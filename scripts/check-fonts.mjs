#!/usr/bin/env node
// The v3 typefaces exist twice on purpose: apps/web serves them from the asset
// volume (so layout.tsx can preload the body font), while
// @boffmedia/tailwind-config carries bundler-resolvable copies for Electron and
// any other non-web host. Fonts are immutable in practice, but "in practice" is
// not a guarantee — this compares them byte-for-byte so a re-export or a
// subsetting pass on one side cannot silently diverge from the other.
//
// Skips cleanly when the asset volume is absent (fresh clone, CI): public/ is
// untracked, so its absence is normal and must not fail the build.

import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const pkgFonts = join(root, "packages/tailwind-config/fonts")
const volume = join(root, "public/assets/fonts")

if (!existsSync(volume)) {
  console.log("• fonts: public/assets/fonts absent (untracked asset volume) — skipped")
  process.exit(0)
}

const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex")
const problems = []
let checked = 0

for (const family of readdirSync(pkgFonts)) {
  const mine = join(pkgFonts, family)
  const theirs = join(volume, family)
  if (!existsSync(theirs)) {
    problems.push(`${family}: missing from the asset volume`)
    continue
  }
  for (const file of readdirSync(mine).filter((f) => f.endsWith(".woff2"))) {
    const a = join(mine, file)
    const b = join(theirs, file)
    if (!existsSync(b)) {
      problems.push(`${family}/${file}: missing from the asset volume`)
      continue
    }
    checked++
    if (md5(a) !== md5(b)) problems.push(`${family}/${file}: DIFFERS between the two copies`)
  }
}

if (problems.length) {
  console.error("✗ fonts: package copies have drifted from the asset volume\n")
  for (const p of problems) console.error(`    ${p}`)
  console.error(
    "\n  Re-sync by copying public/assets/fonts/<family>/*.woff2 into\n" +
      "  packages/tailwind-config/fonts/<family>/, or update the volume to match.",
  )
  process.exit(1)
}

console.log(`✓ fonts: ${checked} woff2 identical across the package and the asset volume`)
