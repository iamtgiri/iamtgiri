/**
 * generate_snake.js
 *
 * Fetches the GitHub contributions HTML, extracts the SVG contribution grid,
 * and injects a lightweight "snake" overlay animation.
 *
 * Output: writes file to repo-root/output/github-contribution-grid-snake.svg
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const owner = process.env.GITHUB_USER || process.env.USER || "iamtgiri";
const url = `https://github.com/users/${owner}/contributions`;

async function main() {
  console.log("Fetching contribution page from:", url);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept": "text/html"
    }
  });

  if (!res.ok) {
    console.error("Failed to fetch contributions page:", res.status, res.statusText);
    process.exit(1);
  }

  const html = await res.text();

  // Extract SVG contribution graph from HTML
  const match = html.match(/<svg[\s\S]*<\/svg>/);
  if (!match) {
    console.error("Could not find SVG in contributions page.");
    process.exit(1);
  }

  const svgBody = match[0];

  // Snake overlay
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
    <rect class="snake-rect snake-anim" x="-200" y="0" width="1200" height="160" rx="6" ry="6" style="transform-origin: 0 0;" />
  </g>
  `;

  // Insert overlay right after opening <svg>
  const svgOpenTagEnd = svgBody.indexOf(">");
  const finalSvg = `${svgBody.slice(0, svgOpenTagEnd + 1)}
${overlay}
${svgBody.slice(svgOpenTagEnd + 1)}`;

  // Ensure output dir exists
  const outDir = path.resolve(process.cwd(), "../../output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.resolve(outDir, "github-contribution-grid-snake.svg");
  fs.writeFileSync(outFile, finalSvg, "utf8");

  console.log("Wrote:", outFile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
