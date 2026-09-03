#!/usr/bin/env node
/**
 * Regenerates the sample-team TS modules from their `.txt` originals.
 *
 * The pastes are the editable source — a Showdown paste is what a player copies
 * out of the teambuilder, and reviewing a diff of one is far easier than
 * reviewing a diff of an escaped string literal. But `@boffmedia/battle-core`
 * is consumed as compiled CJS by apps/api and as ESM by two bundlers, and none
 * of the three reads a sibling `.txt` the same way, so the shipped form has to
 * be a module.
 *
 * Run after editing any `packages/battle-core/src/samples/*.txt`:
 *   node scripts/tools/sync-battle-samples.mjs [--check]
 *
 * `--check` verifies the modules are current without writing, for CI.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES = path.resolve(here, "..", "..", "packages/battle-core/src/samples");

const CHECK = process.argv.includes("--check");

function moduleFor(name, body) {
  return (
    `// Generated from ./${name}.txt — edit that file, then re-run\n` +
    `// \`node scripts/tools/sync-battle-samples.mjs\`.\n` +
    `export const ${name} = ${JSON.stringify(body)};\n`
  );
}

const entries = (await readdir(SAMPLES)).filter((f) => f.endsWith(".txt")).sort();
let stale = 0;

for (const file of entries) {
  const name = file.replace(/\.txt$/, "");
  const body = (await readFile(path.join(SAMPLES, file), "utf8")).replace(/\n+$/, "");
  const wanted = moduleFor(name, body);
  const target = path.join(SAMPLES, `${name}.ts`);

  const current = await readFile(target, "utf8").catch(() => null);
  if (current === wanted) continue;

  stale++;
  if (CHECK) {
    console.error(`[sync-battle-samples] ${name}.ts is stale`);
  } else {
    await writeFile(target, wanted, "utf8");
    console.log(`[sync-battle-samples] wrote ${name}.ts`);
  }
}

if (CHECK && stale) {
  console.error(`[sync-battle-samples] ${stale} module(s) stale — run node scripts/tools/sync-battle-samples.mjs`);
  process.exit(1);
}
console.log(`[sync-battle-samples] ${entries.length} sample(s), ${stale} rewritten`);
