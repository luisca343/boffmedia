#!/usr/bin/env node
/**
 * Regenerates the `teras` ModdedDex from the Pixelmon packs.
 *
 *   node scripts/tools/build-teras-mod.mjs             # report the diff only
 *   node scripts/tools/build-teras-mod.mjs --verbose    # per-entry detail
 *   node scripts/tools/build-teras-mod.mjs --write      # actually overwrite
 *
 * `packages/battle-core/src/mods/teras/pokedex.ts` is 340 species of SmartRotom
 * custom content that feeds a LIVE battle engine, and it arrived as a one-shot
 * conversion with no generator, no provenance, and no way to re-run it. New
 * custom Pokémon therefore have no path into the simulator at all.
 *
 * DEFAULT IS REPORT-ONLY, DELIBERATELY. Replacing that file changes what
 * players battle with, so the diff is the deliverable and a human approves it.
 * `--write` is the explicit second step.
 *
 * Four defects in the committed file that this generator fixes by construction,
 * each verified against the packs:
 *
 *  1. `types: ["Bug", ""]` — 125 entries carry an empty second type. Showdown
 *     treats types positionally, so an empty string is not harmless.
 *  2. `eggGroups: ["BUG"]` — Pixelmon's SCREAMING_CASE leaked verbatim into a
 *     field whose vocabulary is `Bug` / `Human-Like` / `Water 1`.
 *  3. `heightm: 0.034999999999999996` — from `dimensions.height / 10`. That is
 *     wrong twice: Pixelmon's height is already in METRES, and it is the MODEL
 *     height, not the Pokédex height (Venusaur is 1.6 in Pixelmon, 2.0 in
 *     Showdown). Heights are taken from Showdown for anything Showdown knows.
 *     `weightkg` IS reliable from Pixelmon and is verified to match.
 *  4. `evos: ["Metapod f:sakura"]` — a raw Pixelmon evolution string in a field
 *     that must hold Showdown species names. Emitted only when BOTH ends
 *     resolve; otherwise omitted and counted.
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import {
  REPO_ROOT,
  loadSpeciesFiles,
  resolveForm,
  resolveSpeciesForm,
  isCustomForm,
  toID,
} from "./lib-pokemon-identity.mjs";

const require = createRequire(import.meta.url);
const { Dex } = require("@pkmn/sim");

const WRITE = process.argv.includes("--write");
const VERBOSE = process.argv.includes("--verbose");
const TARGET = path.join(REPO_ROOT, "packages/battle-core/src/mods/teras/pokedex.ts");

const log = (...a) => console.log("[teras-mod]", ...a);

/** Pixelmon SCREAMING_CASE -> Showdown's egg-group vocabulary. */
const EGG_GROUPS = {
  AMORPHOUS: "Amorphous",
  BUG: "Bug",
  DITTO: "Ditto",
  DRAGON: "Dragon",
  FAIRY: "Fairy",
  FIELD: "Field",
  FLYING: "Flying",
  GRASS: "Grass",
  HUMAN_LIKE: "Human-Like",
  MINERAL: "Mineral",
  MONSTER: "Monster",
  UNDISCOVERED: "Undiscovered",
  WATER_ONE: "Water 1",
  WATER_TWO: "Water 2",
  WATER_THREE: "Water 3",
};

const TYPE_NAMES = new Map(Dex.types.all().map((t) => [toID(t.name), t.name]));

function showdownTypes(raw) {
  const out = [];
  for (const t of raw ?? []) {
    const name = TYPE_NAMES.get(toID(t));
    if (name) out.push(name); // an unmapped or empty entry is dropped, not blanked
  }
  return out;
}

function showdownEggGroups(raw) {
  const out = [];
  for (const g of raw ?? []) {
    const name = EGG_GROUPS[g] ?? (Object.values(EGG_GROUPS).includes(g) ? g : null);
    if (name) out.push(name);
  }
  return out;
}

/** Pixelmon ability names are PascalCase run together: `ShieldDust`. */
function abilityName(raw) {
  const hit = Dex.abilities.get(toID(raw));
  return hit.exists ? hit.name : String(raw).replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function abilitiesTable(form) {
  const a = form.abilities ?? {};
  const normal = (a.abilities ?? []).filter(Boolean).map(abilityName);
  const hidden = (a.hiddenAbilities ?? []).filter(Boolean).map(abilityName);
  const out = {};
  normal.slice(0, 2).forEach((name, i) => {
    out[String(i)] = name;
  });
  if (hidden[0]) out.H = hidden[0];
  return Object.keys(out).length ? out : undefined;
}

function statsTable(form) {
  const b = form.battleStats;
  if (!b) return undefined;
  const def = b.defense ?? b.defence;
  const spd = b.specialDefense ?? b.specialDefence;
  const all = { hp: b.hp, atk: b.attack, def, spa: b.specialAttack, spd, spe: b.speed };
  return Object.values(all).every((v) => typeof v === "number") ? all : undefined;
}

// ---------------------------------------------------------------------------

const speciesFiles = loadSpeciesFiles();
const entries = {};
const stats = { customSpecies: 0, customForms: 0, vanillaBases: 0, evosOmitted: 0, skipped: [] };
const collisions = [];

// Pass 1 — decide which (species, form) pairs belong in the mod at all.
/** @type {Array<{data: any, entry: any, form: any, isVanillaBase: boolean}>} */
const wanted = [];

for (const entry of speciesFiles.values()) {
  const { data } = entry;
  if (!data?.name || !data?.dex) continue;

  const seen = new Set();
  let ambiguous = false;
  for (const f of data.forms ?? []) {
    const n = String(f.name ?? "");
    if (seen.has(n)) ambiguous = true;
    seen.add(n);
  }
  if (ambiguous) {
    // Two forms with the same name cannot be addressed. Never guess which one.
    stats.skipped.push(`${data.name} (duplicate form names)`);
    continue;
  }

  const baseIsVanilla = Dex.species.get(toID(data.name)).exists;
  const customForms = (data.forms ?? []).filter((f) => isCustomForm(entry, f.name));

  if (!baseIsVanilla) {
    // A SmartRotom-original species: every form belongs in the mod.
    stats.customSpecies++;
    for (const form of data.forms ?? []) wanted.push({ data, entry, form, isVanillaBase: false });
  } else if (customForms.length) {
    // A vanilla species carrying custom forms. Showdown needs the BASE entry too
    // so `otherFormes`/`formeOrder` can point at the new formes.
    stats.vanillaBases++;
    const base = (data.forms ?? []).find((f) => String(f.name ?? "") === (data.defaultForms?.[0] ?? "base"));
    if (base) wanted.push({ data, entry, form: base, isVanillaBase: true });
    for (const form of customForms) wanted.push({ data, entry, form, isVanillaBase: false });
  }
}

// Pass 2 — build the ids first, so evolution targets can be resolved against the
// set that will actually exist.
/**
 * A species' DEFAULT form is its base entry and takes the bare id — Punktricity's
 * default form is called `amped`, and emitting `punktricityamped` while naming the
 * record "Punktricity" would put the id and the name out of step. The base-form
 * test has to be the same one the record builder uses, so it lives here.
 */
const isBaseForm = (data, formName) => {
  const label = String(formName ?? "");
  return label === "" || label === (data.defaultForms?.[0] ?? "base");
};

const idFor = (data, formName, isCustom) => {
  if (!isCustom) {
    const r = resolveSpeciesForm(Dex, data.name, formName);
    if (r.ok) return r.id;
  }
  return toID(data.name) + (isBaseForm(data, formName) ? "" : toID(formName));
};

const willExist = new Set();
for (const w of wanted) {
  const custom = isCustomForm(w.entry, w.form.name) || !Dex.species.get(toID(w.data.name)).exists;
  willExist.add(idFor(w.data, String(w.form.name ?? ""), custom));
}

for (const w of wanted) {
  const { data, entry, form, isVanillaBase } = w;
  const custom = isCustomForm(entry, form.name) || !Dex.species.get(toID(data.name)).exists;
  const id = idFor(data, String(form.name ?? ""), custom);
  const resolved = resolveForm(data, form);
  const vanilla = Dex.species.get(id);

  if (!isVanillaBase && custom && Dex.species.get(toID(data.name)).exists) stats.customForms++;

  const formLabel = String(form.name ?? "");
  const isBase = isBaseForm(data, formLabel);
  const displayForme = isBase
    ? ""
    : formLabel
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((p) => p[0].toUpperCase() + p.slice(1))
        .join("-");

  const record = {
    num: data.dex,
    name: isBase ? data.name : `${data.name}-${displayForme}`,
  };
  if (!isBase) {
    record.baseSpecies = data.name;
    record.forme = displayForme;
  } else {
    record.baseForme = "";
  }

  const types = showdownTypes(resolved.types);
  if (types.length) record.types = types;

  const baseStats = statsTable(resolved);
  if (baseStats) record.baseStats = baseStats;

  const abilities = abilitiesTable(resolved);
  if (abilities) record.abilities = abilities;

  if (typeof resolved.weight === "number") record.weightkg = resolved.weight;

  // Height comes from Showdown wherever Showdown knows the species. Pixelmon's
  // `dimensions.height` is a MODEL height and disagrees (Venusaur 1.6 vs 2.0).
  if (vanilla.exists && typeof vanilla.heightm === "number") record.heightm = vanilla.heightm;
  else if (typeof resolved.dimensions?.height === "number") {
    record.heightm = Number(resolved.dimensions.height.toFixed(2));
  }

  const eggGroups = showdownEggGroups(resolved.eggGroups);
  if (eggGroups.length) record.eggGroups = eggGroups;

  // Evolutions: emit only when the target resolves to something that will exist.
  const evos = [];
  for (const evo of resolved.evolutions ?? []) {
    const toName = evo.to?.name ?? evo.to;
    if (typeof toName !== "string") continue;
    const bare = toName.split(/\s+(?:form|f|palette):/)[0].trim();
    const target = Dex.species.get(toID(bare));
    if (target.exists && willExist.has(target.id)) evos.push(target.name);
    else if (willExist.has(toID(bare))) evos.push(bare);
    else stats.evosOmitted++;
  }
  if (evos.length) record.evos = [...new Set(evos)];

  if (!isBase) record.changesFrom = data.name;

  // The bridge this replaces did `terasPokemonData[showdownId] = …` with no
  // collision check, so two Pixelmon forms landing on one Showdown id silently
  // lost one of them. Refuse instead.
  if (entries[id] && JSON.stringify(entries[id]) !== JSON.stringify(record)) {
    collisions.push(`${id} <- ${data.name}::${formLabel} (already held ${entries[id].name})`);
    continue;
  }

  entries[id] = record;
}

// `otherFormes` / `formeOrder` on each base that gained formes.
for (const [id, record] of Object.entries(entries)) {
  if (record.baseSpecies) continue;
  const children = Object.values(entries).filter((r) => r.baseSpecies === record.name);
  if (!children.length) continue;
  record.otherFormes = children.map((c) => c.name).sort();
  record.formeOrder = [record.name, ...record.otherFormes];
}

// ---------------------------------------------------------------------------

const header = `import type {ModdedSpeciesDataTable} from '@pkmn/sim';

// GENERATED by scripts/tools/build-teras-mod.mjs from the Pixelmon packs.
// Do not edit by hand — re-run the generator instead.

export const Pokedex: ModdedSpeciesDataTable = `;

const sorted = Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)));
const body = `${header}${JSON.stringify(sorted, null, 2)};\n`;

log(`generated ${Object.keys(entries).length} entries`);
log(
  `  ${stats.customSpecies} SmartRotom-original species, ${stats.customForms} custom forms on ` +
    `${stats.vanillaBases} vanilla bases`,
);
if (stats.evosOmitted) log(`  ${stats.evosOmitted} evolution target(s) omitted — they resolve to nothing that exists`);
for (const s of stats.skipped) log(`  SKIPPED ${s}`);
if (collisions.length) {
  console.error(`[teras-mod] ${collisions.length} id COLLISION(S) — two source forms want one Showdown id:`);
  for (const c of collisions) console.error(`  ${c}`);
  console.error("[teras-mod] refusing to guess. Add an override or fix the pack.");
  process.exit(1);
}

// --- diff against the committed file ---------------------------------------

const current = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, "utf8") : "";
const currentIds = new Set([...current.matchAll(/^\s{4}"([a-z0-9]+)":\s*\{/gm)].map((m) => m[1]));
const nextIds = new Set(Object.keys(entries));

const added = [...nextIds].filter((i) => !currentIds.has(i)).sort();
const removed = [...currentIds].filter((i) => !nextIds.has(i)).sort();

log("");
log(`committed file: ${currentIds.size} entries · generated: ${nextIds.size} entries`);
log(`  ${added.length} would be ADDED, ${removed.length} would be REMOVED`);
if (VERBOSE) {
  for (const i of added) log(`    + ${i}`);
  for (const i of removed) log(`    - ${i}`);
} else if (added.length || removed.length) {
  log(`    added  : ${added.slice(0, 8).join(", ")}${added.length > 8 ? ` … +${added.length - 8}` : ""}`);
  log(`    removed: ${removed.slice(0, 8).join(", ")}${removed.length > 8 ? ` … +${removed.length - 8}` : ""}`);
  log("    (--verbose for the full lists)");
}

const emptyTypes = (current.match(/\"\"\s*\n\s*\]/g) ?? []).length;
const screaming = new Set(current.match(/"[A-Z][A-Z_]{2,}"/g) ?? []);
log("");
log("defects in the committed file that the generated one does not have:");
log(`  ${emptyTypes} empty-string type entries`);
log(`  ${screaming.size} SCREAMING_CASE egg groups: ${[...screaming].slice(0, 6).join(", ")}`);
log(`  ${(current.match(/"heightm": \d+\.\d{6,}/g) ?? []).length} float-artifact heights`);
log(`  ${(current.match(/"(?:evos|prevo)": \[\s*"[^"]* (?:form|f|palette):/g) ?? []).length} raw Pixelmon evolution strings`);

if (WRITE) {
  fs.writeFileSync(TARGET, body, "utf8");
  log("");
  log(`WROTE ${path.relative(REPO_ROOT, TARGET)} — review the git diff before committing.`);
} else {
  const out = path.join(REPO_ROOT, "scripts/tools/teras-pokedex.generated.ts");
  fs.writeFileSync(out, body, "utf8");
  log("");
  log(`report-only. Generated output written to ${path.relative(REPO_ROOT, out)} for comparison.`);
  log(`Run with --write to replace the live mod (it feeds the battle engine).`);
}
