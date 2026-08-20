#!/usr/bin/env node
// Emits the JSON Schema that apps/desktop's build.rs turns into Rust structs.
// zod stays the single source of truth for the manifest format; this is the
// bridge across the one unavoidable TS↔Rust boundary.
//
// The output is COMMITTED on purpose: src-tauri/build.rs must be able to codegen
// without Node installed, so a Rust-only checkout still builds.
//
// `--check` fails when the committed file is stale, mirroring
// scripts/generate-error-codes.mjs. Wire it into CI, not just into the build.
//
// LIMITATION, and it matters: JSON Schema cannot express zod refinements, so
// `.superRefine` rules are SILENTLY DROPPED here. Today that is the
// case-insensitive duplicate-path check in PackManifest. The Rust side must
// re-implement those; see validate.rs. Anything added as a refinement in
// boffmedia.ts is invisible to the generated types.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"

import { PackManifest } from "./dist/esm/index.js"

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, "schema")
const outFile = join(outDir, "pack-manifest.schema.json")

// draft-07, not 2020-12: the consumer is typify, which builds on schemars 0.8
// and is happiest with draft-07. Emitting the newer draft parses but exercises
// far less well-trodden ground for no benefit — nothing here needs 2020-12.
const schema = {
  $id: "https://boffmedia.es/schema/pack-manifest.json",
  title: "PackManifest",
  description:
    "Generated from packages/pack-schema by emit-schema.mjs — do not edit by hand. " +
    "zod refinements (e.g. the duplicate-path check) are NOT represented here.",
  ...z.toJSONSchema(PackManifest, { target: "draft-7" }),
}

const next = JSON.stringify(schema, null, 2) + "\n"

if (process.argv.includes("--check")) {
  if (!existsSync(outFile)) {
    console.error(`✗ pack-schema: ${outFile} is missing — run \`pnpm --filter @boffmedia/pack-schema build\``)
    process.exit(1)
  }
  if (readFileSync(outFile, "utf8") !== next) {
    console.error(
      "✗ pack-schema: pack-manifest.schema.json is stale.\n" +
        "  The zod schema changed but the JSON Schema the Rust build reads did not.\n" +
        "  Run `pnpm --filter @boffmedia/pack-schema build` and commit the result.",
    )
    process.exit(1)
  }
  console.log("✓ pack-schema: JSON Schema matches the zod source of truth")
  process.exit(0)
}

mkdirSync(outDir, { recursive: true })
writeFileSync(outFile, next)
console.log(`✓ pack-schema: wrote ${outFile}`)
