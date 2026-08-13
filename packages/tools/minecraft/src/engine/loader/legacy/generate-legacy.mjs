// @ts-nocheck
/**
 * Generates the bundled legacy numeric-ID mapping (`1.12.json`) used by the
 * MCEdit `.schematic` loader: pre-flattening `"blockId:meta"` pairs → modern
 * blockstate strings.
 *
 * Source table: WorldEdit's `legacy.json` (the same table WorldEdit itself uses
 * to load MCEdit schematics). Its output uses 1.13 names, so every entry is
 * re-validated here against our bundled vanilla 1.16.5 registry — the oldest
 * target this tool ships — applying the 1.13→1.14 renames and dropping any
 * state key/value 1.16.5 does not recognise. Cross-version renames beyond
 * 1.16.5 are the diff engine's job (rules/known-renames), not this table's.
 *
 * Run:  node generate-legacy.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mcData from "minecraft-data";

const here = dirname(fileURLToPath(import.meta.url));

const SOURCE_URL =
  "https://raw.githubusercontent.com/EngineHub/WorldEdit/master/worldedit-core/src/main/resources/com/sk89q/worldedit/world/registry/legacy.json";

/** 1.13 → 1.16.5 block renames (WorldEdit's table predates the 1.14 renames). */
const RENAMES = new Map([
  ["minecraft:sign", "minecraft:oak_sign"],
  ["minecraft:wall_sign", "minecraft:oak_wall_sign"],
  ["minecraft:stone_slab", "minecraft:smooth_stone_slab"],
]);

function parseStateString(raw) {
  const bracket = raw.indexOf("[");
  if (bracket === -1) return { name: raw, states: {} };
  const name = raw.slice(0, bracket);
  const states = {};
  for (const pair of raw.slice(bracket + 1, raw.lastIndexOf("]")).split(",")) {
    const eq = pair.indexOf("=");
    if (eq !== -1) states[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return { name, states };
}

function serializeStateString(name, states) {
  const keys = Object.keys(states);
  if (!keys.length) return name;
  return `${name}[${keys.sort().map((k) => `${k}=${states[k]}`).join(",")}]`;
}

const registry = JSON.parse(
  readFileSync(join(here, "../../registry/vanilla/1.16.5.json"), "utf8")
);

const res = await fetch(SOURCE_URL);
if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
const legacy = await res.json();

const out = {};
const unmapped = [];
const droppedKeys = new Set();
const droppedValues = new Set();
let renamed = 0;

for (const [key, raw] of Object.entries(legacy.blocks)) {
  const parsed = parseStateString(raw);
  let name = parsed.name;

  if (!registry.blocks[name] && RENAMES.has(name)) {
    name = RENAMES.get(name);
    renamed++;
  }
  if (!registry.blocks[name]) {
    unmapped.push(`${key} → ${raw}`);
    continue;
  }

  const valid = registry.blocks[name].states;
  const states = {};
  for (const [k, v] of Object.entries(parsed.states)) {
    if (!valid[k]) {
      droppedKeys.add(`${name}[${k}]`);
      continue;
    }
    if (!valid[k].includes(v)) {
      droppedValues.add(`${name}[${k}=${v}]`);
      continue;
    }
    states[k] = v;
  }
  out[key] = serializeStateString(name, states);
}

if (unmapped.length) {
  console.error(`UNMAPPED (${unmapped.length}) — add renames:\n  ` + unmapped.join("\n  "));
  process.exit(1);
}
if (droppedKeys.size) console.log(`dropped state keys: ${[...droppedKeys].join(", ")}`);
if (droppedValues.size) console.log(`dropped state values: ${[...droppedValues].join(", ")}`);

// 1.12 block name → numeric id, for references that use names with legacy
// metadata instead of numeric ids (e.g. LittleTiles "minecraft:wool:2").
const names = {};
for (const block of mcData("1.12.2").blocksArray) names[block.name] = block.id;

const file = join(here, "1.12.json");
writeFileSync(
  file,
  JSON.stringify(
    {
      source: "EngineHub/WorldEdit legacy.json",
      generatedAt: new Date().toISOString().slice(0, 10),
      validatedAgainst: "1.16.5",
      count: Object.keys(out).length,
      blocks: out,
      names,
    },
    null,
    0
  ) + "\n"
);
console.log(`wrote ${file} (${Object.keys(out).length} entries, ${renamed} renamed)`);
