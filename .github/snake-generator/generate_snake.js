/**
 * generate_snake.js
 *
 * Fetches the GitHub contributions SVG for the repository owner and
 * wraps it with a lightweight animated "snake" overlay.
 *
 * Output: writes file to repo-root/output/github-contribution-grid-snake.svg
 *
 * Environment variables:
 *  - GITHUB_USER  (set by the Action to the repo owner)
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const owner = process.env.GITHUB_USER || process.env.USER || "iamtgiri"; // fallback
const url = `https://github.com/users/${owner}/contributions?format=svg`;

async function main() {
  console.log("Fetching contribution SVG from:", url);

const res = await fetch(url, {
  headers: {
    "User-Agent": "github-snake-generator",
    "Accept": "image/svg+xml"   // 👈 this is the fix
  }
});


  if (!res.ok) {
    console.error("Failed to fetch contributions SVG:", res.status, res.statusText);
    process.exit(1);
  }

  const svgBody = await res.text();

  // Wrap/augment the SVG with a simple animated overlay.
  // We insert an extra <g> with a translucent rectangle that moves across the grid to simulate a snake.
  // The injected CSS is inline and should be allowed in the SVG.

  // Build final SVG string.
  // Some GitHub contribution SVGs already include an <svg ...> root. We'll inject our overlay inside it.
  // A simple approach: find the opening <svg ...> tag and append our <defs>/<style>/<g> right after it.

  const overlay = `
  <defs>
    <style type="text/css"><![CDATA[
      .snake-rect { fill: rgba(255,0,127,0.12); stroke: rgba(255,0,127,0.35); stroke-width: 1; }
      .snake-anim { animation: moveX 6s linear infinite; }
      @keyframes moveX {
        0% { transform: translateX(-10%); }
        50% { transform: translateX(50%); }
        100% { transform: translateX(110%); }
      }
    ]]></style>
  </defs>

  <g transform="translate(0,0)" id="snake-overlay">
    <!-- moving translucent bar to simulate a snake -->
    <rect class="snake-rect snake-anim" x="-200" y="0" width="1200" height="160" rx="6" ry="6" style="transform-origin: 0 0;" />
  </g>
  `;

  // locate index after the first <svg...> tag close '>'
  const svgOpenTagEnd = svgBody.indexOf(">");

  if (svgOpenTagEnd === -1) {
    console.error("Couldn't parse SVG content.");
    process.exit(1);
  }

  const finalSvg = `${svgBody.slice(0, svgOpenTagEnd + 1)}
${overlay}
${svgBody.slice(svgOpenTagEnd + 1)}`;

  // ensure output dir exists at repo root
  const outDir = path.resolve(process.cwd(), "../../output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.resolve(outDir, "github-contribution-grid-snake.svg");
  fs.writeFileSync(outFile, finalSvg, "utf8");

  console.log("Wrote:", outFile);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
