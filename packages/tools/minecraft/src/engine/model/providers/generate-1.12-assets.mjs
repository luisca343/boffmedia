// @ts-nocheck
/**
 * Generates `1.12-assets.json`: the blockstate-name aliases needed to render a
 * 1.12 world with 1.12 assets.
 *
 * The legacy loader translates `id:meta` into *modern* blockstates, and the
 * asset mirror's 1.12.2 tree is itself mostly flattened (`red_wool.json`,
 * `oak_planks.json`), so most modern names resolve there unchanged. A minority
 * do not — `grass_block` is `grass.json`, `oak_door` is `wooden_door.json`,
 * `red_bed` is `bed.json` — and those are what this table records.
 *
 * Rather than hand-maintaining that list, every name reachable from the legacy
 * table is probed against the mirror once, at build time: modern name first,
 * then the 1.12 registry name for the same numeric id. Nothing here runs at
 * runtime; the tool ships the resulting JSON.
 *
 * Run:  node generate-1.12-assets.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const REF = "1.12.2";
const BASE = `https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@${REF}/assets/minecraft/blockstates`;
const CONCURRENCY = 16;

const legacy = JSON.parse(readFileSync(join(here, "../../loader/legacy/1.12.json"), "utf8"));

/** numeric id → 1.12 registry name (the inverse of the table's `names` map). */
const idToLegacyName = new Map();
for (const [name, id] of Object.entries(legacy.names)) idToLegacyName.set(id, name);

/** modern bare name → the 1.12 name of the id it came from. */
const candidates = new Map();
for (const [key, stateString] of Object.entries(legacy.blocks)) {
  const modern = stateString.split("[")[0].replace(/^minecraft:/, "");
  if (candidates.has(modern)) continue;
  const id = Number(key.split(":")[0]);
  candidates.set(modern, idToLegacyName.get(id));
}

async function exists(name) {
  const res = await fetch(`${BASE}/${name}.json`, { method: "HEAD" });
  return res.ok;
}

async function mapLimit(items, limit, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const index = i++;
        out[index] = await fn(items[index]);
      }
    }),
  );
  return out;
}

const entries = [...candidates.entries()];
const results = await mapLimit(entries, CONCURRENCY, async ([modern, legacyName]) => {
  if (await exists(modern)) return { modern, alias: null, missing: false };
  if (legacyName && legacyName !== modern && (await exists(legacyName))) {
    return { modern, alias: legacyName, missing: false };
  }
  return { modern, alias: null, missing: true };
});

/**
 * Drop ambiguous aliases. Several modern blocks often descend from one 1.12
 * file that distinguished them by a `variant` property — `stone.json` covers
 * stone, granite, polished_granite, diorite… Aliasing all of those to `stone`
 * would render polished granite as plain stone, which is worse than the
 * fallback: an unaliased name resolves against the newest asset ref, where the
 * block exists under its own name and looks right. So an alias survives only
 * when exactly one modern block claims that 1.12 file.
 */
const claimants = new Map();
for (const r of results) {
  if (!r.alias) continue;
  claimants.set(r.alias, (claimants.get(r.alias) ?? 0) + 1);
}

const aliases = {};
const ambiguous = [];
const missing = [];
for (const r of results) {
  if (r.alias) {
    if (claimants.get(r.alias) === 1) aliases[`minecraft:${r.modern}`] = r.alias;
    else ambiguous.push(`${r.modern} → ${r.alias}`);
  }
  if (r.missing) missing.push(r.modern);
}

const file = join(here, "1.12-assets.json");
writeFileSync(
  file,
  JSON.stringify(
    {
      ref: REF,
      generatedAt: new Date().toISOString().slice(0, 10),
      probed: entries.length,
      aliasCount: Object.keys(aliases).length,
      aliases,
      // Recorded, not applied: several modern blocks share one 1.12 file that
      // told them apart by a property we cannot recover from the name alone.
      ambiguous: ambiguous.sort(),
      // Blocks with no 1.12-era blockstate under either name (fluids, blocks
      // the mirror never shipped). These fall back to the newest asset ref at
      // runtime, so they render — just not with period-accurate assets.
      missing: missing.sort(),
    },
    null,
    0,
  ) + "\n",
);
console.log(
  `wrote ${file} (${entries.length} probed, ${Object.keys(aliases).length} aliases, ${ambiguous.length} ambiguous, ${missing.length} missing)`,
);
