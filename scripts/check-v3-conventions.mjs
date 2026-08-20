#!/usr/bin/env node
// Design-system convention guard. Fails CI on mechanical footguns that type-check
// can't catch.
//
// Boffmedia v3 (BOFFMEDIA_V3.md §3) — checked on the Boffmedia roots:
//   1. Unspaced `+`/`-` inside a Tailwind arbitrary `calc(...)` — invalid CSS,
//      silently dropped by the browser (the ToolShell dropdown-offset bug class).
//   2. Raw `[clip-path:polygon(...)]` in className whose shape IS one of the named
//      utilities — should be `cut` / `cut-seal` / `cut-corner` / `cut-tag`.
// Genuine one-off polygons (diamonds, single-corner cuts, asymmetric shapes) are
// left alone: only the four utility-shaped patterns are flagged.
//
// SmartRotom v3 (SMARTROTOM_V3.md §3/§4) — checked on the *migrated* roots only
// (legacy apps are grandfathered until they migrate; see the migration table):
//   3. Cross-design-system imports — a SmartRotom file pulling a Boffmedia-owned
//      primitive (`@/components/ui/*`, `@/components/boffmedia/*`). CLAUDE.md
//      forbids crossing the two systems; the migrated apps are clean and must stay so.
//   4. Dynamic Tailwind class fragments (`bg-${x}`, `text-${x}`…) — the JIT cannot
//      see them, so the class silently never compiles (audit gap G2).
//
// The unspaced-calc() rule (1) is deliberately NOT applied to the SmartRotom roots:
// Tailwind v3 normalizes math operators inside `calc()` for both arbitrary values and
// arbitrary properties (verified — `calc(100dvh-3rem)` and `calc(100dvh_-_3rem)` emit
// identical CSS), so it is a spacing convention, not a correctness bug.
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { posix } from "node:path";

const BM_ROOTS = ["apps/web/src/components/boffmedia", "apps/web/src/app/(boffmedia)"];

// Only the surfaces that have actually been migrated to the SmartRotom v3 system.
// Add a root here as each remaining app is migrated — that is what makes the guard
// ratchet forward instead of being disabled by the legacy tree's 85 violations.
// The guard used to list only the migrated app dirs, which left `app/smartrotom` and
// `components/smartrotom` themselves OUTSIDE every root — so the shell and the chrome
// (RotomNav, the main nav) were never scanned, and SMARTROTOM_V3.md §3's claim that the
// chrome is "clean (0 imports)" passed CI while being false. The roots are now the two
// trees, with the remaining debt pinned in CROSS_DS_BASELINE below.
const SR_ROOTS = [
  "apps/web/src/app/smartrotom",
  "apps/web/src/components/smartrotom",
];

// Known cross-design-system imports, per file. This is a RATCHET, not an exemption: the
// count may only go DOWN. Adding an import to a listed file fails the build, and so does
// the first one in any file not listed. When a file is cleaned, drop its entry.
//
// 2026-08-20: the last 12 entries (camara/liga/mina/bidkea) all reached 0 and were dropped,
// so the ratchet now sits at zero for the whole tree. The chrome (RotomNav, layout,
// providers) was rebuilt on sr-* primitives in components/smartrotom/chrome/ and is clean.
const CROSS_DS_BASELINE = {
  // Empty: every listed file reached 0. Adding a cross-DS import
  // anywhere under SR_ROOTS now fails the build outright.
};

// The wingull / auth / battlesim zones belong to no design system and used to be watched
// by nothing — their legacy shadcn (`components/ui`) usage could grow freely. Same ratchet
// contract as CROSS_DS_BASELINE: counts may only go DOWN; when a file is cleaned, drop its
// entry. Imports of `components/boffmedia` are deliberately NOT counted here — adopting
// the live design system is the direction these zones should move in.
const ORPHAN_ROOTS = [
  "apps/web/src/app/wingull",
  "apps/web/src/app/auth",
  "apps/web/src/app/battlesim",
];

const LEGACY_UI = ["apps/web/src/components/ui/"];

const ORPHAN_LEGACY_BASELINE = {
  // Empty: every listed file reached 0. A new legacy-shadcn import
  // anywhere under ORPHAN_ROOTS now fails the build outright.
};

function listFiles(roots) {
  const out = [];
  for (const root of roots) {
    let res = "";
    try {
      res = execSync(`git ls-files -- '${root}/*.tsx' '${root}/*.ts'`, { encoding: "utf8" });
    } catch { /* root may be empty */ }
    for (const f of res.split("\n").map((s) => s.trim()).filter(Boolean)) {
      // `git ls-files` reads the INDEX, so a file that is staged but has since been deleted
      // from the working tree is still listed. Reading it throws ENOENT and takes the whole
      // check down with it — a deleted file is not a convention violation.
      if (existsSync(f)) out.push(f);
    }
  }
  return out;
}

// A SmartRotom file must not import a Boffmedia-owned primitive. The rule is about the
// DEPENDENCY, not how it is spelled: matching only `@/components/…` let a relative
// `../../ui/navigation/Link` through (components/smartrotom/apps/App.tsx did exactly that).
//
// A relative specifier cannot be matched textually — from `notas/_components/overlays/`,
// `../ui/ThemedLayer` is the app's OWN barrel, while from `components/smartrotom/apps/`,
// `../../ui/navigation/Link` is Boffmedia. Same text, opposite verdicts. So resolve it
// against the importing file's directory and ask where it actually lands.
const BM_OWNED = ["apps/web/src/components/ui/", "apps/web/src/components/boffmedia/"];
const IMPORT_FROM = /(?:from|import)\s+["']([^"']+)["']/;

function importLandsIn(file, line, roots) {
  const m = line.match(IMPORT_FROM);
  if (!m) return false;
  const spec = m[1];

  const target = spec.startsWith("@/")
    ? posix.join("apps/web/src", spec.slice(2))
    : spec.startsWith(".")
      ? posix.normalize(posix.join(posix.dirname(file), spec))
      : null; // a bare package name is never a local primitive

  return target !== null && roots.some((root) => (target + "/").startsWith(root));
}

const isCrossDs = (file, line) => importLandsIn(file, line, BM_OWNED);

// `bg-${tone}`, `text-${c}-300`, `border-${x}` … inside a template literal. The JIT
// only sees literal class strings, so these silently never compile. Full-class maps
// (`{ red: "bg-red-500" }`) are the fix.
const DYNAMIC_CLASS = /\b(?:bg|text|border|from|to|via|ring|fill|stroke|shadow)-(?:\w+-)*\$\{/;

// Comment lines are prose, not code — the convention docs quote the very patterns we
// ban (`bg-${t}`), so matching them would flag the warning against the bug as the bug.
const IS_COMMENT = /^\s*(?:\/\/|\/\*|\*)/;

// Same problem, one layer up: the showcase EXPLAINS the rule, and it does so in JSX
// prose props — `note="…nunca text-wp-rarity-${r}, que el JIT jamás compilaría"`. Those
// are quoted strings, not comments, so IS_COMMENT never saw them and the guard flagged
// the warning against the bug as the bug.
//
// The discriminator is exact rather than a heuristic: `${…}` only interpolates inside a
// BACKTICK literal. In a '…' or "…" string it is inert text that can never become a
// class name, so blanking those spans before testing costs the guard nothing — a real
// `className={`bg-${t}`}` lives in backticks and still trips. Escaped quotes are skipped
// so an apostrophe inside a double-quoted note cannot swallow the rest of the line.
const QUOTED = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
const withoutQuotedProse = (line) => line.replace(QUOTED, '""');

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

function checkCalc(file, line, i) {
  if (line.includes("calc(") && UNSPACED_CALC.test(line)) {
    violations.push(`${file}:${i + 1}  unspaced calc() — add spaces (\`_-_\`/\`_+_\`); unspaced +/- is invalid CSS and silently dropped`);
  }
}

for (const file of listFiles(BM_ROOTS)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    checkCalc(file, line, i);
    for (const [re, util] of SHAPED) {
      if (re.test(line)) {
        violations.push(`${file}:${i + 1}  utility-shaped clip-path — use \`${util}\` (BOFFMEDIA_V3.md §3)`);
        break;
      }
    }
  });
}

const crossDsSeen = {};

for (const file of listFiles(SR_ROOTS)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (IS_COMMENT.test(line)) return;
    if (isCrossDs(file, line)) {
      (crossDsSeen[file] ??= []).push(i + 1);
    }
    if (DYNAMIC_CLASS.test(withoutQuotedProse(line))) {
      violations.push(`${file}:${i + 1}  dynamic Tailwind class — the JIT can't see \`bg-\${…}\`; use a full-class map (SMARTROTOM_V3.md §4)`);
    }
  });
}

// Cross-DS is ratcheted rather than absolute: the baseline pins the known legacy debt, and
// only a count that GREW is a violation. A count that shrank is progress — the guard says so
// and asks for the baseline to be lowered, which is what stops the debt creeping back.
for (const [file, lines] of Object.entries(crossDsSeen)) {
  const allowed = CROSS_DS_BASELINE[file] ?? 0;
  if (lines.length > allowed) {
    const where = lines.join(", ");
    violations.push(
      allowed === 0
        ? `${file}:${lines[0]}  cross-design-system import — SmartRotom must not import Boffmedia primitives (SMARTROTOM_V3.md §3)`
        : `${file}  cross-design-system imports grew ${allowed} → ${lines.length} (lines ${where}) — SMARTROTOM_V3.md §3`,
    );
  }
}

for (const [file, allowed] of Object.entries(CROSS_DS_BASELINE)) {
  const actual = crossDsSeen[file]?.length ?? 0;
  if (actual < allowed && existsSync(file)) {
    violations.push(
      `${file}  cross-DS imports are down to ${actual} (baseline says ${allowed}) — lower it to ${actual} in CROSS_DS_BASELINE so the guard ratchets forward`,
    );
  }
}

// Same ratchet, orphan zones: legacy `components/ui` imports may only go down.
const orphanSeen = {};

for (const file of listFiles(ORPHAN_ROOTS)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (IS_COMMENT.test(line)) return;
    if (importLandsIn(file, line, LEGACY_UI)) {
      (orphanSeen[file] ??= []).push(i + 1);
    }
  });
}

for (const [file, lines] of Object.entries(orphanSeen)) {
  const allowed = ORPHAN_LEGACY_BASELINE[file] ?? 0;
  if (lines.length > allowed) {
    const where = lines.join(", ");
    violations.push(
      allowed === 0
        ? `${file}:${lines[0]}  legacy shadcn import in an unguarded zone — don't add components/ui usage here`
        : `${file}  legacy shadcn imports grew ${allowed} → ${lines.length} (lines ${where})`,
    );
  }
}

for (const [file, allowed] of Object.entries(ORPHAN_LEGACY_BASELINE)) {
  const actual = orphanSeen[file]?.length ?? 0;
  if (actual < allowed && existsSync(file)) {
    violations.push(
      `${file}  legacy shadcn imports are down to ${actual} (baseline says ${allowed}) — lower it to ${actual} in ORPHAN_LEGACY_BASELINE so the guard ratchets forward`,
    );
  }
}

if (violations.length) {
  console.error(`\n✗ v3 convention check failed (${violations.length}):\n`);
  for (const v of violations) console.error("  " + v);
  console.error("");
  process.exit(1);
}
console.log("✓ v3 conventions: Boffmedia (calc / clip-path) + SmartRotom (cross-DS / dynamic classes) + orphan zones (legacy shadcn ratchet)");
