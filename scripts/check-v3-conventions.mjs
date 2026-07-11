#!/usr/bin/env node
// Boffmedia v3 convention guard (BOFFMEDIA_V3.md §3). Fails CI on two mechanical
// footguns that type-check can't catch:
//   1. Unspaced `+`/`-` inside a Tailwind arbitrary `calc(...)` — invalid CSS,
//      silently dropped by the browser (the ToolShell dropdown-offset bug class).
//   2. Raw `[clip-path:polygon(...)]` in className whose shape IS one of the named
//      utilities — should be `cut` / `cut-seal` / `cut-corner` / `cut-tag`.
// Genuine one-off polygons (diamonds, single-corner cuts, asymmetric shapes) are
// left alone: only the four utility-shaped patterns are flagged.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const ROOTS = ["apps/web/src/components/boffmedia", "apps/web/src/app/(boffmedia)"];

function listFiles() {
  const out = [];
  for (const root of ROOTS) {
    let res = "";
    try {
      res = execSync(`git ls-files -- '${root}/*.tsx' '${root}/*.ts'`, { encoding: "utf8" });
    } catch { /* root may be empty */ }
    for (const f of res.split("\n").map((s) => s.trim()).filter(Boolean)) out.push(f);
  }
  return out;
}

// Unspaced binary +/- inside a calc value. High precision: the operator must sit
// immediately after a value terminator — `%`, `)`, or `<digit><length-unit>` — and
// immediately before a value start (digit / `.` / `(` / `var(` / `calc(`). This
// deliberately ignores hyphens inside custom-property names (`var(--nav-h)`), unary
// minus (`calc(-1*…)`), and `*`/`/` (which need no spaces). Spaced (`_-_`) is fine.
const UNIT = "px|rem|em|vh|vw|dvh|dvw|dvi|svh|lvh|vmin|vmax|ch|ex|fr|pt|pc|in|cm|mm|q";
const UNSPACED_CALC = new RegExp(
  String.raw`(?:%|\)|\d(?:${UNIT}))[+\-](?:[\d.(]|var\(|calc\()`,
  "i",
);

// The four utility-shaped polygons (numeric px or var(--cut)). N is captured and
// both corners must match; one-off shapes don't fit these and are ignored.
const N = String.raw`(?:\d+px|var\(--cut\))`;
const SHAPED = [
  [new RegExp(String.raw`\[clip-path:polygon\(0_0,calc\(100%_-_(${N})\)_0,100%_\1,100%_100%,0_100%\)\]`), "cut-corner"],
  [new RegExp(String.raw`\[clip-path:polygon\(0_0,100%_0,100%_calc\(100%_-_(${N})\),calc\(100%_-_\1\)_100%,0_100%\)\]`), "cut-tag"],
  [new RegExp(String.raw`\[clip-path:polygon\((${N})_0,100%_0,100%_calc\(100%_-_\1\),calc\(100%_-_\1\)_100%,0_100%,0_\1\)\]`), "cut-seal"],
  [new RegExp(String.raw`\[clip-path:polygon\((${N})_0,100%_0,calc\(100%_-_\1\)_100%,0_100%\)\]`), "cut"],
];

const violations = [];
for (const file of listFiles()) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (line.includes("calc(") && UNSPACED_CALC.test(line)) {
      violations.push(`${file}:${i + 1}  unspaced calc() — add spaces (\`_-_\`/\`_+_\`); unspaced +/- is invalid CSS and silently dropped`);
    }
    for (const [re, util] of SHAPED) {
      if (re.test(line)) {
        violations.push(`${file}:${i + 1}  utility-shaped clip-path — use \`${util}\` (BOFFMEDIA_V3.md §3)`);
        break;
      }
    }
  });
}

if (violations.length) {
  console.error(`\n✗ Boffmedia v3 convention check failed (${violations.length}):\n`);
  for (const v of violations) console.error("  " + v);
  console.error("");
  process.exit(1);
}
console.log("✓ Boffmedia v3 conventions: no unspaced calc / utility-shaped clip-paths");
