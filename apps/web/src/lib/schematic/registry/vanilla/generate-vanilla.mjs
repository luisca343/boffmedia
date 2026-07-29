// @ts-nocheck
/**
 * Generates the bundled vanilla block registries shipped with the schematic
 * compatibility tool.
 *
 * These are FULL, accurate registries (every block + every valid state value +
 * the real default state) derived from PrismarineJS `minecraft-data`. They are
 * the vanilla base that the JAR scanner layers mod blocks on top of: when a user
 * points an environment at a real instance, we detect its Minecraft version and
 * load the matching file here, then merge the scanned mod blocks.
 *
 * `minecraft-data` is a devDependency — this script runs at build time only and
 * is never imported by client/worker code.
 *
 * Run:  node generate-vanilla.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mcData from "minecraft-data";

const here = dirname(fileURLToPath(import.meta.url));

/** Versions bundled offline. Keep in sync with BUNDLED_VERSIONS in ../../../versions.ts. */
const VERSIONS = [
  "1.13.2",
  "1.14.4",
  "1.15.2",
  "1.16.5",
  "1.17.1",
  "1.18",
  "1.18.2",
  "1.19.2",
  "1.19.4",
  "1.20",
  "1.20.4",
  "1.20.6",
  "1.21.1",
  "1.21.4",
  "1.21.8",
];

/**
 * Resolve the list of valid values for one state, regardless of type.
 * - enum  → its `values` array
 * - bool  → ["true", "false"]  (Minecraft orders boolean states true-first)
 * - int   → ["0", "1", … num_values-1]
 */
function stateValues(state) {
  if (Array.isArray(state.values) && state.values.length) {
    return state.values.map(String);
  }
  if (state.type === "bool") return ["true", "false"];
  return Array.from({ length: state.num_values }, (_, i) => String(i));
}

/**
 * Decode the per-property default values from a block's global `defaultState`.
 * Block state ids are a mixed-radix number where the LAST state varies fastest:
 *   stateId = minStateId + Σ valueIndex[i] · Π(num_values[j] for j > i)
 * So we peel values off from the last state to the first.
 */
function defaultStateValues(block) {
  const states = block.states ?? [];
  if (!states.length) return {};
  let rem = (block.defaultState ?? block.minStateId) - block.minStateId;
  const out = {};
  for (let i = states.length - 1; i >= 0; i--) {
    const s = states[i];
    const values = stateValues(s);
    const idx = rem % s.num_values;
    rem = Math.floor(rem / s.num_values);
    out[s.name] = values[idx] ?? values[0];
  }
  return out;
}

function buildVersion(version) {
  const data = mcData(version);
  if (!data) throw new Error(`minecraft-data has no version "${version}"`);

  const blocks = {};
  for (const block of data.blocksArray) {
    const id = `minecraft:${block.name}`;
    const states = {};
    for (const s of block.states ?? []) states[s.name] = stateValues(s);
    blocks[id] = { states, default: defaultStateValues(block) };
  }

  const sorted = {};
  for (const id of Object.keys(blocks).sort()) sorted[id] = blocks[id];

  return {
    version,
    dataVersion: data.version.dataVersion ?? data.version.version,
    blockCount: Object.keys(sorted).length,
    blocks: sorted,
  };
}

/**
 * 1.12.2 cannot come from `minecraft-data`: pre-flattening blocks have no
 * `states` there (only metadata `variations`) and carry their old names, which
 * would contradict the loader — the legacy `.schematic`/`.mca` path translates
 * `id:meta` into *modern* blockstates via WorldEdit's table.
 *
 * So the 1.12.2 registry is exactly that table's reachable set: every modern
 * block a 1.12 world can contain, with its state definitions borrowed from
 * 1.16.5. That keeps the environment consistent with what the loader emits, and
 * makes it a correct *source* for an upgrade diff. It is deliberately not a
 * usable export target — nothing here writes pre-flattening files.
 */
function buildLegacy1122() {
  const legacy = JSON.parse(readFileSync(join(here, "../../loader/legacy/1.12.json"), "utf8"));
  const base = JSON.parse(readFileSync(join(here, "1.16.5.json"), "utf8"));

  const blocks = {};
  for (const stateString of Object.values(legacy.blocks)) {
    const name = stateString.split("[")[0];
    const def = base.blocks[name];
    if (!def || blocks[name]) continue;
    blocks[name] = def;
  }

  const sorted = {};
  for (const id of Object.keys(blocks).sort()) sorted[id] = blocks[id];

  return {
    version: "1.12.2",
    dataVersion: 1343,
    blockCount: Object.keys(sorted).length,
    blocks: sorted,
  };
}

for (const version of VERSIONS) {
  const out = buildVersion(version);
  const file = join(here, `${version}.json`);
  writeFileSync(file, JSON.stringify(out, null, 0) + "\n");
  console.log(`wrote ${file} (${out.blockCount} blocks, dataVersion ${out.dataVersion})`);
}

// After 1.16.5 exists on disk — it is this one's source of state definitions.
const legacyOut = buildLegacy1122();
const legacyFile = join(here, "1.12.2.json");
writeFileSync(legacyFile, JSON.stringify(legacyOut, null, 0) + "\n");
console.log(
  `wrote ${legacyFile} (${legacyOut.blockCount} blocks, dataVersion ${legacyOut.dataVersion})`,
);
