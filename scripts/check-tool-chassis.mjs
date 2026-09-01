#!/usr/bin/env node
/**
 * check-tool-chassis — fails the build on the drift that keeps coming back.
 *
 * Three unifications of the tool chassis have now happened, and each held for
 * about three months. Both times the mechanism was the same: `ToolStrip` takes a
 * `className`, so a call site that needed a slightly taller bar just typed one,
 * and the "shared" bar quietly became seven bars with four heights and four
 * gutters. Review does not catch this — each individual diff looks reasonable.
 *
 * So the rules that cannot be expressed in the type system are checked here:
 *
 *   1. A tool must not set `--tool-pad`. The gutter belongs to the host shell;
 *      a tool that sets its own is a tool whose bar stops lining up with the
 *      body under it.
 *   2. Bar geometry must not be passed through `className` on a `ToolStrip` —
 *      height, vertical padding, or a position override. Those are props now.
 *   3. Nothing outside `@boffmedia/ui` may hardcode a bar height. Offsetting
 *      below a bar reads `--tool-bar-h`; a literal silently drifts the moment
 *      the height changes, which is exactly what happened to the mhwilds roster
 *      column and to datakit's `--dk-bar-h`.
 *   4. `packages/tools/*` must not reference `--nav-h`. It is defined in
 *      apps/web's globals.css only, so in the launcher the whole declaration is
 *      invalid and silently dropped. Read `--tool-sticky-top` / `--tool-vh`.
 *
 * Run: node scripts/check-tool-chassis.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

const ROOT = process.cwd()

/** Where tool chassis code lives. Everything else is out of scope. */
const ROOTS = [
  "apps/web/src/app/(boffmedia)/(herramientas)",
  "apps/web/src/components/boffmedia/ui/tools",
  "apps/web/src/components/boffmedia/ui/mewgenics",
  "apps/desktop/src",
  "packages/tools",
]

/** The primitive itself is where this geometry is ALLOWED to be spelled out. */
const OWNER = join("packages", "ui", "src", "primitives", "tool-header.tsx")

const findings = []

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    if (name === "node_modules" || name === "dist" || name === ".next") continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (/\.(tsx|ts)$/.test(name)) out.push(full)
  }
  return out
}

function report(file, line, rule, detail) {
  findings.push({ file: relative(ROOT, file).split(sep).join("/"), line, rule, detail })
}

/**
 * Blank every comment while preserving line numbers.
 *
 * This matters more than it looks: several of these files explain these very
 * rules in prose ("never write `calc(100dvh - var(--nav-h))` here"), so a naive
 * scan reports the documentation as the violation and the guard cries wolf on
 * its first run. Block form covers JSDoc and JSX `{/* … *\/}` alike.
 */
function stripComments(src) {
  // Normalise CRLF FIRST. `.` does not match `\r`, so on a CRLF file
  // `/\/\/.*$/` never reaches end-of-string and silently strips nothing — the
  // guard then reports its own documentation as a violation.
  const lf = src.replace(/\r\n/g, "\n")
  const noBlock = lf.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
  return noBlock
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, ""))
    .join("\n")
}

for (const r of ROOTS) {
  for (const file of walk(join(ROOT, r))) {
    const rel = relative(ROOT, file)
    if (rel === OWNER) continue
    const src = readFileSync(file, "utf8")
    const code = stripComments(src)
    const inToolsPackage = rel.split(sep).join("/").startsWith("packages/tools/")

    code.split("\n").forEach((text, i) => {
      const n = i + 1

      // 1 — gutter ownership
      if (text.includes("--tool-pad")) {
        report(file, n, "tool-pad", "`--tool-pad` is the host shell's to set, never a tool's.")
      }

      // 3 — a literal bar height used to offset BELOW the bar. Deliberately not
      // "any 58px": plenty of unrelated things are 58px tall. The bug is a
      // literal standing in for the bar's height inside a sticky/viewport calc,
      // which is what silently drifted the mhwilds roster and `--dk-bar-h`.
      // `var(--tool-vh)` is a READ; `"--tool-vh":` is the host DECLARING it, which
      // is exactly what a host is supposed to do. Only reads can drift.
      //
      // Two narrowings, both from false positives this rule produced on code
      // that was already correct:
      //
      //  * `var(--tool-vh, 100dvh)`'s FALLBACK is not a drifting literal — it is
      //    what the token means when a host forgot to set it. Fallbacks are
      //    stripped before the test, which also covers `var(--tool-sticky-top,0px)`.
      //  * The literal has to be in a height or an offset, not merely somewhere
      //    on the same line. A `text-[13px]` beside a `min-h-[var(--tool-vh)]`
      //    was reported as a bar height, sending readers after a bug that was
      //    never there.
      const offsets = text.includes("var(--tool-sticky-top") || text.includes("var(--tool-vh")
      const literal = text.replace(/var\(--[^)]*\)/g, "")
      const inOffset =
        /\b(?:top|bottom|h|min-h|max-h)-\[[^\]]*\b\d+px\b/.test(literal) ||
        /calc\([^)]*\b\d+px\b/.test(literal)
      if (offsets && inOffset && !text.includes("--tool-bar-h")) {
        report(file, n, "bar-height", "Literal height in a bar offset. Read `var(--tool-bar-h)` instead — a literal drifts silently when the bar changes.")
      }

      // 4 — --nav-h inside a shared tool package
      if (inToolsPackage && text.includes("--nav-h")) {
        report(file, n, "nav-h", "`--nav-h` is web-only and is silently dropped in the launcher. Use `--tool-sticky-top` / `--tool-vh`.")
      }
    })

    // 2 — geometry passed through className on a ToolStrip
    const strip = /<ToolStrip\b[^>]*className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/g
    let m
    while ((m = strip.exec(src)) !== null) {
      const cls = m[1] ?? m[2] ?? m[3] ?? ""
      const bad = [
        [/\bmin-h-\[|\bh-\[/, "height"],
        [/\bpy-|\bpt-|\bpb-/, "vertical padding"],
        [/\bstatic\b|\bsticky\b|\bfixed\b/, "position (use the `sticky` prop)"],
        [/--tool-pad/, "gutter"],
      ].filter(([re]) => re.test(cls))
      if (bad.length) {
        const line = src.slice(0, m.index).split(/\r?\n/).length
        report(file, line, "strip-geometry", `className sets ${bad.map(([, l]) => l).join(", ")} on a ToolStrip. Geometry is props + tokens.`)
      }
    }
  }
}

if (findings.length === 0) {
  console.log("check-tool-chassis: ok — no chassis drift")
  process.exit(0)
}

const byRule = new Map()
for (const f of findings) byRule.set(f.rule, (byRule.get(f.rule) ?? 0) + 1)

console.error(`check-tool-chassis: ${findings.length} violation(s)\n`)
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}`)
  console.error(`    [${f.rule}] ${f.detail}\n`)
}
console.error("Summary: " + [...byRule].map(([r, c]) => `${r}=${c}`).join(" · "))
process.exit(1)
