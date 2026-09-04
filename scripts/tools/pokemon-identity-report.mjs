#!/usr/bin/env node
/**
 * Derives the Pixelmon <-> Showdown identity mapping and reports on it.
 *
 *   node scripts/tools/pokemon-identity-report.mjs            # write the golden file
 *   node scripts/tools/pokemon-identity-report.mjs --check    # CI: fail if stale
 *   node scripts/tools/pokemon-identity-report.mjs --verbose  # list every residual
 *
 * The golden file (`scripts/tools/pokemon-identity.golden.json`) is the point of
 * this script. Coverage is not a statistic to admire — it is a tripwire. A
 * Pixelmon pack bump, a `@pkmn/sim` bump, or a new custom form all move these
 * numbers, and the diff is what tells you which. Pixelmon 9.4.0 renaming the
 * base form from `""` to `"base"` would silently have cut form coverage from
 * 88.9% to 30%; under this gate it is a failed build with the delta named.
 *
 * VALIDATION FAILURES ARE ERRORS, not warnings. If a name-matched pair
 * disagrees on dex number, base stats or types, the table is wrong and the run
 * exits non-zero regardless of `--check`.
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import {
  ABILITY_OVERRIDES,
  FORM_OVERRIDES,
  MOVE_OVERRIDES,
  PACK_ROOTS,
  REPO_ROOT,
  loadSpeciesFiles,
  loadMoveFiles,
  loadAbilityFiles,
  resolveForm,
  resolveSpeciesForm,
  resolveMove,
  resolveAbility,
  isCustomForm,
  validatePair,
  toID,
} from "./lib-pokemon-identity.mjs";

const require = createRequire(import.meta.url);
const { Dex } = require("@pkmn/sim");

// `@pkmn/sim` ships an `exports` map that does not expose ./package.json, so the
// version has to be read off disk. `apps/api/scripts/add-regulation` hits the
// same wall and solves it by walking `require.resolve` upward.
const SIM_VERSION = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "node_modules/@pkmn/sim/package.json"), "utf8"),
).version;

const CHECK = process.argv.includes("--check");
const VERBOSE = process.argv.includes("--verbose");
const GOLDEN = path.join(REPO_ROOT, "scripts/tools/pokemon-identity.golden.json");

const log = (...a) => console.log("[pokemon-identity]", ...a);
const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : "n/a");

// ---------------------------------------------------------------------------
// Override-table self-check — the only part that can run in CI
// ---------------------------------------------------------------------------
//
// `/public/` is gitignored (.gitignore:20), so the Pixelmon packs are NOT in
// this repository and a CI checkout has nothing to measure coverage against.
// What CI *can* verify is that every id the override table points at still
// exists in the pinned @pkmn/sim — a dead entry is how a table like this rots.

const deadOverrides = [];
const checkTargets = (table, kind, lookup) => {
  for (const [key, entry] of Object.entries(table)) {
    if (!entry.to) continue;
    if (!lookup(entry.to).exists) deadOverrides.push(`${kind} ${key} -> '${entry.to}' does not exist`);
  }
};
checkTargets(FORM_OVERRIDES, "form   ", (id) => Dex.species.get(id));
checkTargets(MOVE_OVERRIDES, "move   ", (id) => Dex.moves.get(id));
checkTargets(ABILITY_OVERRIDES, "ability", (id) => Dex.abilities.get(id));

if (deadOverrides.length) {
  console.error(`[pokemon-identity] ${deadOverrides.length} override(s) point at ids @pkmn/sim ${SIM_VERSION} does not have:`);
  for (const d of deadOverrides) console.error(`  ${d}`);
  process.exit(1);
}
log(
  `overrides   : ${Object.keys(FORM_OVERRIDES).length} form + ${Object.keys(MOVE_OVERRIDES).length} move + ` +
    `${Object.keys(ABILITY_OVERRIDES).length} ability, all targets resolve`,
);

// The type chart is the other thing CI can check without the packs, and it needs
// checking: the VGC damage calculator's chart was missing `Bug -> Poison`
// entirely, so it silently defaulted to 1x instead of 0.5x. A hand-maintained
// 18x18 table drifts exactly this quietly. Showdown's `damageTaken` is the truth.
{
  const DAMAGE_TAKEN = { 0: 1, 1: 2, 2: 0.5, 3: 0 };
  const chartPath = path.join(REPO_ROOT, "packages/pokemon-identity/dist/cjs/index.js");
  if (fs.existsSync(chartPath)) {
    const { TYPE_EFF, ALL_TYPES } = require(chartPath);
    const wrong = [];
    for (const atk of ALL_TYPES) {
      for (const def of ALL_TYPES) {
        const truth = DAMAGE_TAKEN[Dex.types.get(def).damageTaken[atk]];
        const got = TYPE_EFF[atk]?.[def] ?? 1;
        if (truth !== got) wrong.push(`${atk} -> ${def}: chart ${got}, Showdown ${truth}`);
      }
    }
    if (wrong.length) {
      console.error(`[pokemon-identity] type chart disagrees with @pkmn/sim in ${wrong.length} matchup(s):`);
      for (const w of wrong) console.error(`  ${w}`);
      process.exit(1);
    }
    log(`type chart : ${ALL_TYPES.length}x${ALL_TYPES.length} matchups agree with @pkmn/sim`);
  } else {
    log("type chart : skipped (packages/pokemon-identity not built)");
  }
}

const packsPresent = PACK_ROOTS.some((r) => fs.existsSync(path.join(REPO_ROOT, r, "species")));
if (!packsPresent) {
  log("");
  log("Pixelmon packs are not present (/public/ is gitignored) — coverage not measured.");
  log("The override table was still verified against @pkmn/sim, which is the part CI can check.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Species and forms
// ---------------------------------------------------------------------------

const speciesFiles = loadSpeciesFiles();
const speciesStats = {
  files: 0,
  sourceOnlySpecies: 0,
  forms: 0,
  derived: 0,
  override: 0,
  unmapped: 0,
  customForms: 0,
  resolved: 0,
};
const residualForms = [];
const validationFailures = [];
const duplicateForms = [];
const mappings = [];

for (const entry of speciesFiles.values()) {
  const { data, file, root } = entry;
  if (!data?.name || !data?.dex) continue;
  speciesStats.files++;

  // Two forms with the same name are unresolvable by definition — and this is
  // not hypothetical. The overlay's 097_hypno.json declares `forms: ["", ""]`
  // using the pre-9.4.0 schema, so the RUNNING API collides on them too:
  // `speciesByNameWithForm` (pokemon-data.service.ts:35) keys on
  // `${name}_${form}` and the second write silently wins.
  const seen = new Map();
  for (const form of data.forms ?? []) {
    const name = String(form.name ?? "");
    seen.set(name, (seen.get(name) ?? 0) + 1);
  }
  for (const [name, count] of seen) {
    if (count > 1) {
      duplicateForms.push({
        species: data.name,
        form: name === "" ? "(empty)" : name,
        count,
        file: `${root}/species/${file}`,
      });
    }
  }

  // A species whose pack record is ambiguous cannot be mapped at all. Report the
  // duplicate once (above) rather than emitting a derived failure that is really
  // just a symptom of it.
  if ([...seen.values()].some((n) => n > 1)) continue;

  const baseExists = Dex.species.get(toID(data.name)).exists;
  if (!baseExists) {
    // A SmartRotom-original species (dex 9xxx/10xxx). Its forms belong to the
    // custom-content pipeline, not to this mapping.
    speciesStats.sourceOnlySpecies++;
    speciesStats.customForms += (data.forms ?? []).length;
    continue;
  }

  for (const form of data.forms ?? []) {
    speciesStats.forms++;
    const result = resolveSpeciesForm(Dex, data.name, form.name);

    if (result.via === "override") speciesStats.override++;
    else if (result.ok) speciesStats.derived++;
    if (result.ok) speciesStats.resolved++;

    if (!result.ok) {
      if (result.kind === "unmapped" && isCustomForm(entry, form.name)) {
        // SmartRotom custom content on a vanilla base species. Expected.
        speciesStats.customForms++;
      } else if (result.kind === "unmapped") {
        speciesStats.unmapped++;
        residualForms.push({
          species: data.name,
          dex: data.dex,
          form: form.name ?? "",
          reason: result.reason,
        });
      } else {
        // cosmeticOnly / pixelmonOnly / sourceOnly — a deliberate non-mapping.
        speciesStats.customForms++;
      }
      continue;
    }

    const showdown = Dex.species.get(result.id);
    const resolved = resolveForm(data, form);
    const problems = validatePair({
      pixelmonSpecies: data,
      resolvedForm: resolved,
      showdownSpecies: showdown,
    });

    if (problems.length) {
      validationFailures.push({
        species: data.name,
        form: form.name ?? "",
        showdownId: result.id,
        showdownName: showdown.name,
        via: result.via,
        problems,
      });
    }

    mappings.push({
      dex: data.dex,
      form: form.name ?? "",
      showdownId: result.id,
      kind: result.kind,
    });
  }
}

// ---------------------------------------------------------------------------
// Moves and abilities
// ---------------------------------------------------------------------------

function tally(files, resolve, nameOf) {
  const stats = { total: 0, derived: 0, override: 0, unmapped: 0, deliberate: 0, resolved: 0 };
  const residual = [];
  const map = [];
  for (const entry of files.values()) {
    stats.total++;
    const name = nameOf(entry);
    const result = resolve(Dex, name);
    if (result.via === "override") stats.override++;
    else if (result.ok) stats.derived++;

    if (result.ok) { stats.resolved++; map.push({ source: name, showdownId: result.id, kind: result.kind }); }
    else if (result.kind === "unmapped") {
      stats.unmapped++;
      residual.push({ source: name, reason: result.reason });
    } else stats.deliberate++;
  }
  return { stats, residual, map };
}

const moves = tally(
  loadMoveFiles(),
  resolveMove,
  (e) => e.data?.attackName ?? e.file.replace(/\.json$/, ""),
);
const abilities = tally(
  loadAbilityFiles(),
  resolveAbility,
  (e) => e.file.replace(/\.json$/, ""),
);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

// "mapped" means it resolved to a real Showdown id. An override whose target is
// null (cosmeticOnly, pixelmonOnly) is a DELIBERATE non-mapping and must not be
// counted as coverage — that would report 100% while 10 moves map to nothing.
const mappedForms = speciesStats.resolved;

log(`pack roots  : ${speciesFiles.size} species files, ${moves.stats.total} moves, ${abilities.stats.total} abilities`);
log(`@pkmn/sim   : ${SIM_VERSION}`);
log("");
log(`species     : ${speciesStats.files} files, ${speciesStats.sourceOnlySpecies} SmartRotom-original (no Showdown base)`);
log(
  `forms       : ${mappedForms}/${speciesStats.forms} mapped (${pct(mappedForms, speciesStats.forms)}) ` +
    `— ${speciesStats.derived} derived, ${speciesStats.override} via override, ` +
    `${speciesStats.customForms} deliberate non-mappings, ${speciesStats.unmapped} UNMAPPED`,
);
log(
  `moves       : ${moves.stats.resolved}/${moves.stats.total} mapped ` +
    `(${pct(moves.stats.resolved, moves.stats.total)}) — ` +
    `${moves.stats.deliberate} deliberate, ${moves.stats.unmapped} UNMAPPED`,
);
log(
  `abilities   : ${abilities.stats.resolved}/${abilities.stats.total} mapped ` +
    `(${pct(abilities.stats.resolved, abilities.stats.total)}) — ` +
    `${abilities.stats.deliberate} deliberate, ${abilities.stats.unmapped} UNMAPPED`,
);

const residualTotal = speciesStats.unmapped + moves.stats.unmapped + abilities.stats.unmapped;
if (residualTotal) {
  log("");
  log(`${residualTotal} unmapped entr${residualTotal === 1 ? "y" : "ies"} — each needs an entry in the override table:`);
  const show = (rows, label) => {
    for (const r of VERBOSE ? rows : rows.slice(0, 15)) {
      log(`  ${label} ${r.species ? `${r.species}::${r.form}` : r.source} — ${r.reason}`);
    }
    if (!VERBOSE && rows.length > 15) log(`  ${label} … and ${rows.length - 15} more (--verbose)`);
  };
  show(residualForms, "form   ");
  show(moves.residual, "move   ");
  show(abilities.residual, "ability");
}

if (duplicateForms.length) {
  log("");
  // These are defects in the source packs, which live in a separate repository
  // (wingull-2-datapack) and are not editable from here. So they are recorded in
  // the golden file rather than hard-failing: the CURRENT two are known, and a
  // THIRD would change the golden file and fail --check. Silence would be wrong;
  // blocking every build on someone else's repo would be too.
  console.warn(
    `[pokemon-identity] WARNING: ${duplicateForms.length} species declare DUPLICATE form names — ` +
      `the source pack is ambiguous and the running API collides on them too ` +
      `(speciesByNameWithForm keys on \`name_form\`, so the second write wins):`,
  );
  for (const d of duplicateForms) {
    console.warn(`  ${d.species} has ${d.count}x form '${d.form}'  (${d.file})`);
  }
}

if (validationFailures.length) {
  log("");
  console.error(
    `[pokemon-identity] ${validationFailures.length} MAPPED pair(s) disagree on dex/stats/types — the mapping is wrong:`,
  );
  for (const f of VERBOSE ? validationFailures : validationFailures.slice(0, 20)) {
    for (const p of f.problems) {
      console.error(
        `  ${f.species}::${f.form} -> ${f.showdownName} (${f.via}) ` +
          `${p.field} px=${JSON.stringify(p.pixelmon)} sd=${JSON.stringify(p.showdown)}`,
      );
    }
  }
  if (!VERBOSE && validationFailures.length > 20) {
    console.error(`  … and ${validationFailures.length - 20} more (--verbose)`);
  }
}

// ---------------------------------------------------------------------------
// Golden file
// ---------------------------------------------------------------------------

const golden = {
  // Deliberately NOT a timestamp — this file must be byte-stable so its diff
  // means "the mapping changed", never "the script ran again".
  packRoots: PACK_ROOTS,
  pkmnSim: SIM_VERSION,
  species: {
    files: speciesStats.files,
    sourceOnly: speciesStats.sourceOnlySpecies,
  },
  forms: {
    total: speciesStats.forms,
    derived: speciesStats.derived,
    override: speciesStats.override,
    deliberateNonMapping: speciesStats.customForms,
    unmapped: speciesStats.unmapped,
    residual: residualForms.map((r) => `${r.species}::${r.form}`).sort(),
  },
  moves: { ...moves.stats, residual: moves.residual.map((r) => r.source).sort() },
  abilities: { ...abilities.stats, residual: abilities.residual.map((r) => r.source).sort() },
  duplicateForms: duplicateForms.map((d) => `${d.species}::${d.form} x${d.count}`).sort(),
  validationFailures: validationFailures
    .map((f) => `${f.species}::${f.form} -> ${f.showdownId} [${f.problems.map((p) => p.field).join(",")}]`)
    .sort(),
};

const wanted = `${JSON.stringify(golden, null, 2)}\n`;
const current = fs.existsSync(GOLDEN) ? fs.readFileSync(GOLDEN, "utf8") : null;

log("");
if (current === wanted) {
  log("golden file is current");
} else if (CHECK) {
  console.error("[pokemon-identity] golden file is STALE — coverage changed.");
  console.error("[pokemon-identity] run: node scripts/tools/pokemon-identity-report.mjs");
  if (current) {
    const a = JSON.parse(current);
    const b = golden;
    const delta = (label, x, y) => (x !== y ? console.error(`  ${label}: ${x} -> ${y}`) : undefined);
    delta("forms.derived", a.forms?.derived, b.forms.derived);
    delta("forms.override", a.forms?.override, b.forms.override);
    delta("forms.unmapped", a.forms?.unmapped, b.forms.unmapped);
    delta("moves.unmapped", a.moves?.unmapped, b.moves.unmapped);
    delta("abilities.unmapped", a.abilities?.unmapped, b.abilities.unmapped);
    delta("duplicateForms", a.duplicateForms?.length, b.duplicateForms.length);
    delta("validationFailures", a.validationFailures?.length, b.validationFailures.length);
  }
  process.exit(1);
} else {
  fs.writeFileSync(GOLDEN, wanted, "utf8");
  log(`wrote ${path.relative(REPO_ROOT, GOLDEN)}`);
}

if (validationFailures.length) {
  console.error("[pokemon-identity] FAILED: the mapping errors above must be resolved.");
  process.exit(1);
}
