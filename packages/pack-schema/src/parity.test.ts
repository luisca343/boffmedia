import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { PackManifest } from "./index.js"

/**
 * Half of the cross-language parity harness. The other half is
 * `mod parity` at the bottom of apps/desktop/src-tauri/src/pack.rs.
 *
 * WHY IT EXISTS. `emit-schema.mjs` cannot express a zod refinement in JSON
 * Schema, so every `.superRefine`/`.refine` in this package is dropped on the
 * way to the Rust types and has to be re-implemented by hand in `pack.rs`.
 * CLAUDE.md mandates that mirror; until this file existed nothing checked it,
 * so the launcher could accept a pack the dashboard rejects (or the reverse)
 * with no signal anywhere.
 *
 * HOW IT WORKS. The verdict is a boolean — accepted or rejected — and nothing
 * finer. The two sides genuinely have different error taxonomies (zod collects
 * every issue and reports paths; `ManifestError` is one enum variant and stops
 * at the first) and forcing those to match would be inventing a requirement
 * neither side owes the other. What they DO owe each other is agreeing on which
 * manifests are installable.
 *
 * The fixtures are the substance: one reject fixture per refinement rule, named
 * after the rule and crafted to violate that rule and nothing else. Both
 * languages read the same directory off disk, so a fixture can never exist for
 * only one side — the only way to weaken the harness is to delete a file, which
 * is a visible change in a diff. The floors below catch a broken glob.
 */
const fixtureRoot = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__", "parity")

/** Floors, not exact counts: adding a fixture must not have to touch two
 *  languages, but a directory that silently stops being found must fail. Keep
 *  these in step with `MIN_ACCEPT`/`MIN_REJECT` in pack.rs. */
const MIN_ACCEPT = 8
const MIN_REJECT = 48

const fixturesIn = (verdict: "accept" | "reject") => {
  const dir = join(fixtureRoot, verdict)
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((name) => [name.replace(/\.json$/, ""), readFileSync(join(dir, name), "utf8")] as const)
}

describe("cross-language parity fixtures", () => {
  const accepted = fixturesIn("accept")
  const rejected = fixturesIn("reject")

  it("finds the shared fixture set", () => {
    expect(accepted.length).toBeGreaterThanOrEqual(MIN_ACCEPT)
    expect(rejected.length).toBeGreaterThanOrEqual(MIN_REJECT)
  })

  describe("accept/", () => {
    it.each(accepted)("%s", (_name, raw) => {
      const result = PackManifest.safeParse(JSON.parse(raw))
      // The issue list is the useful failure message here: an accept fixture
      // that stops parsing has usually gone stale against a tightened rule.
      expect(result.success ? [] : result.error.issues.map((i) => i.message)).toEqual([])
    })
  })

  describe("reject/", () => {
    it.each(rejected)("%s", (_name, raw) => {
      expect(PackManifest.safeParse(JSON.parse(raw)).success).toBe(false)
    })
  })
})
