#!/usr/bin/env node
/**
 * Pixelmon <-> Pokémon Showdown identity derivation.
 *
 * The two Pokédexes in this repo describe the same Pokémon in two ID spaces.
 * SmartRotom keys on `(dex, formName, paletteName)` (see `rotom_pokedex` in
 * apps/api/src/_db/schema/SmartRotomPokedex.ts and the `dex:form:palette` sprite
 * manifest); Showdown keys on a single `toID()` string. This module derives the
 * mapping between them.
 *
 * Three things make that safe rather than a guess:
 *
 *  1. Almost all of it is MECHANICAL. Five normalization rules take vanilla
 *     forms from 30% to ~89%, and moves/abilities to ~99% on the name alone.
 *  2. The residual is an EXPLICIT table (`FORM_OVERRIDES` below). Every entry
 *     carries a `kind` and a `reason`, because "these two names look alike" is
 *     exactly the failure mode that must never be automated.
 *  3. Every derived pair is CROSS-CHECKED against base stats, types and dex
 *     number before it is trusted. A name match that disagrees on stats is a
 *     defect, not a mapping.
 *
 * Nothing here reads or writes application state. It is used by
 * `pokemon-identity-report.mjs` (the CI gate) and by the generated identity
 * table shipped in `@boffmedia/pokemon-identity`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, "..", "..");

/**
 * Pack roots, in precedence order (later wins per-file). Mirrors the two-layer
 * overlay that `apps/api/.../services/data/base-data.service.ts:29` applies at
 * runtime — if the two ever disagree, the report is describing data the API
 * does not serve.
 *
 * The version is pinned here deliberately: a Pixelmon bump must be a visible
 * one-line change that moves the coverage numbers, not a silent drift.
 */
export const PACK_ROOTS = [
  "public/smartrotom/packs/default_datapack_9.4.0/data/pixelmon",
  "public/smartrotom/packs/datapack/data/pixelmon",
];

export const LANG_ROOTS = [
  "public/smartrotom/packs/default_resourcepack_9.4.0/assets/pixelmon/lang",
  "public/smartrotom/packs/resourcepack/assets/pixelmon/lang",
];

/** Showdown's `toID`. Reimplemented here so this script has no runtime deps. */
export const toID = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");

// ---------------------------------------------------------------------------
// Normalization rules
// ---------------------------------------------------------------------------

/**
 * Pixelmon form name -> Showdown forme id segment.
 *
 * These are SUBSTRING rewrites, not anchored ones: `galarian_zen` has to become
 * `galarzen`, not just fail because it is not exactly `galarian`.
 *
 * The `base` rule carries more weight than the rest combined. Pixelmon 9.4.0
 * renamed the base form from `""` to `"base"`; without this line, form coverage
 * collapses from 88.9% to 30%. That is the whole argument for generating this
 * table under a CI gate instead of trusting it.
 */
export const FORM_RULES = [
  { from: /^base$/, to: "", why: "9.4.0 renamed the empty base form to 'base'" },
  { from: /alolan/g, to: "alola", why: "Pixelmon says alolan, Showdown says alola" },
  { from: /galarian/g, to: "galar", why: "Pixelmon says galarian, Showdown says galar" },
  { from: /hisuian/g, to: "hisui", why: "Pixelmon says hisuian, Showdown says hisui" },
  { from: /paldean/g, to: "paldea", why: "Pixelmon says paldean, Showdown says paldea" },
  { from: /^female$/, to: "f", why: "Showdown suffixes gender formes with F" },
  { from: /^male$/, to: "", why: "Showdown treats the male forme as the base" },
];

export function normalizeFormSegment(formName) {
  let s = String(formName ?? "").toLowerCase();
  for (const rule of FORM_RULES) s = s.replace(rule.from, rule.to);
  return toID(s);
}

// ---------------------------------------------------------------------------
// The override table
// ---------------------------------------------------------------------------

/**
 * `kind` says how much trust the entry carries, and consumers MUST branch on it:
 *
 *   renamed          - same Pokémon, different spelling. Safe to map both ways.
 *   differentBaseForm- BOTH sources have the form, but disagree about which one
 *                      is the base. The dangerous class. Never auto-derivable.
 *   cosmeticOnly     - Pixelmon appearance variant with no Showdown counterpart.
 *                      Maps to the base species and must NEVER be emitted as a
 *                      distinct Showdown species.
 *   pixelmonOnly     - mechanically real in Pixelmon, absent from Showdown
 *                      (Pixelmon ships Megas the official games never had).
 *
 * `to: null` means "there is deliberately no Showdown counterpart".
 */
export const FORM_OVERRIDES = {
  // -- renamed: a real counterpart exists, only the spelling differs ---------
  "castform::rain": { to: "castformrainy", kind: "renamed" },
  "castform::sun": { to: "castformsunny", kind: "renamed" },
  "floette::az": { to: "floetteeternal", kind: "renamed", reason: "AZ's Floette is Floette-Eternal upstream" },
  "magearna::original_color": { to: "magearnaoriginal", kind: "renamed" },
  "pichu::spiky": { to: "pichuspikyeared", kind: "renamed" },
  "zygarde::ten_percent": { to: "zygarde10", kind: "renamed" },
  "urshifu::gmaxss": { to: "urshifugmax", kind: "renamed", reason: "ss = single strike" },
  "urshifu::gmaxrs": { to: "urshifurapidstrikegmax", kind: "renamed", reason: "rs = rapid strike" },

  // -- differentBaseForm: the two sources disagree about the base -----------
  // Each of these was verified against Showdown's own `baseForme` field.
  "maushold::family_three": {
    to: "maushold",
    kind: "differentBaseForm",
    reason: "Showdown baseForme is 'Three'; Pixelmon defaults to family_four",
  },
  "maushold::family_four": { to: "mausholdfour", kind: "differentBaseForm" },
  "minior::core": {
    to: "minior",
    kind: "differentBaseForm",
    reason: "Showdown baseForme is 'Red' (a core); Pixelmon defaults to meteor",
  },
  "eiscue::ice_face": { to: "eiscue", kind: "differentBaseForm" },
  "eiscue::noice_face": { to: "eiscuenoice", kind: "differentBaseForm" },
  "eternatus::ordinary": { to: "eternatus", kind: "differentBaseForm" },
  "zygarde::fifty_percent": { to: "zygarde", kind: "differentBaseForm" },
  "terapagos::normal": { to: "terapagos", kind: "differentBaseForm", reason: "Pixelmon has no 'base' form for Terapagos" },
  "darmanitan::galarian_zen": { to: "darmanitangalarzen", kind: "renamed" },
  // Pixelmon does not model Pumpkaboo/Gourgeist's four sizes at all — it ships a
  // single form whose stats are the SMALL size, while Showdown's base is AVERAGE.
  // Found by the stat cross-check, not by name: both sides call it the base form.
  "pumpkaboo::base": {
    to: "pumpkaboosmall",
    kind: "differentBaseForm",
    reason: "Pixelmon's only Pumpkaboo is the Small size; Showdown's base is Average",
  },
  "gourgeist::base": {
    to: "gourgeistsmall",
    kind: "differentBaseForm",
    reason: "Pixelmon's only Gourgeist is the Small size; Showdown's base is Average",
  },

  // -- cosmeticOnly: Pixelmon appearance variants, no Showdown record -------
  "lunatone::gibbous": { to: null, kind: "cosmeticOnly", reason: "moon phase" },
  "lunatone::quarter": { to: null, kind: "cosmeticOnly", reason: "moon phase" },
  "lunatone::full": { to: null, kind: "cosmeticOnly", reason: "moon phase" },
  "lunatone::new_moon": { to: null, kind: "cosmeticOnly", reason: "moon phase" },
  "lunatone::crescent": { to: null, kind: "cosmeticOnly", reason: "moon phase" },
  "mareep::shorn": { to: null, kind: "cosmeticOnly", reason: "sheared wool" },
  "wooloo::shorn": { to: null, kind: "cosmeticOnly", reason: "sheared wool" },
  "dubwool::shorn": { to: null, kind: "cosmeticOnly", reason: "sheared wool" },
  "deoxys::sus": { to: null, kind: "cosmeticOnly", reason: "Pixelmon joke forme" },
  "bidoof::sirdoofusiii": { to: null, kind: "cosmeticOnly", reason: "Pixelmon joke forme" },
  "dragonite::creator": { to: null, kind: "cosmeticOnly", reason: "Pixelmon tribute forme" },
  "solgaleo::radiantsun": { to: null, kind: "cosmeticOnly", reason: "cutscene forme" },
  "lunala::fullmoon": { to: null, kind: "cosmeticOnly", reason: "cutscene forme" },
  "marshadow::zenith": { to: null, kind: "cosmeticOnly", reason: "Pixelmon-only forme" },

  // -- pixelmonOnly: real in Pixelmon, never existed upstream ---------------
  "dragonite::mega": { to: null, kind: "pixelmonOnly", reason: "Pixelmon ships a Mega the games never had" },
  "darkrai::mega": { to: null, kind: "pixelmonOnly", reason: "Pixelmon ships a Mega the games never had" },
};

/**
 * Accepted data disagreements on a mapping that is otherwise CORRECT.
 *
 * This is deliberately a different table from `FORM_OVERRIDES`. A wrong mapping
 * is a defect and fails the build; two sources genuinely holding different
 * numbers for the same Pokémon is a fact about the world that has to be recorded
 * and re-reviewed, not silenced. Adding an entry here is an assertion that
 * someone looked at it.
 *
 * Keyed `<showdownId>::<field>`.
 */
export const KNOWN_DIVERGENCES = {
  "deoxysspeed::baseStats": {
    reason:
      "Pixelmon gives Deoxys-Speed 95 SpD; every mainline game and Showdown say 90. Pixelmon is wrong — do not 'fix' the mapping.",
  },
};

/** Move name -> resolution. Keyed on the Pixelmon `attackName`. */
export const MOVE_OVERRIDES = {
  "Ancient Ceaseless Edge": { to: null, kind: "pixelmonOnly", reason: "Legends: Arceus style move" },
  "Ancient Lunar Blessing": { to: null, kind: "pixelmonOnly", reason: "Legends: Arceus style move" },
  "Ancient Mud-Slap": { to: null, kind: "pixelmonOnly", reason: "Legends: Arceus style move" },
  "Ancient Mud Bomb": { to: null, kind: "pixelmonOnly", reason: "Legends: Arceus style move" },
  "Ancient Octazooka": { to: null, kind: "pixelmonOnly", reason: "Legends: Arceus style move" },
  "Ancient Shadow Force": { to: null, kind: "pixelmonOnly", reason: "Legends: Arceus style move" },
  "Ancient Shelter": { to: null, kind: "pixelmonOnly", reason: "Legends: Arceus style move" },
  "Ancient Stone Axe": { to: null, kind: "pixelmonOnly", reason: "Legends: Arceus style move" },
  "Desenvaine Súbito": { to: null, kind: "sourceOnly", reason: "SmartRotom custom move" },
  "Test Attack": { to: null, kind: "ignore", reason: "Pixelmon placeholder" },
};

/** Ability file slug -> resolution. */
export const ABILITY_OVERRIDES = {
  battle_armour: { to: "battlearmor", kind: "renamed", reason: "en_GB spelling" },
  shell_armour: { to: "shellarmor", kind: "renamed", reason: "en_GB spelling" },
  teal_mask: { to: "embodyaspectteal", kind: "renamed" },
  wellspring_mask: { to: "embodyaspectwellspring", kind: "renamed" },
  hearthflame_mask: { to: "embodyaspecthearthflame", kind: "renamed" },
  cornerstone_mask: { to: "embodyaspectcornerstone", kind: "renamed" },
  as_one: {
    to: null,
    kind: "ambiguous",
    reason: "Showdown splits this into asoneglastrier and asonespectrier; the correct one depends on the holder",
  },
  embody_aspect: {
    to: null,
    kind: "ambiguous",
    reason: "Showdown has four Embody Aspect abilities, one per mask",
  },
  revenant: { to: null, kind: "sourceOnly", reason: "SmartRotom custom ability" },
  iaido: { to: null, kind: "sourceOnly", reason: "SmartRotom custom ability" },
  coming_soon: { to: null, kind: "ignore", reason: "Pixelmon placeholder" },
  error: { to: null, kind: "ignore", reason: "Pixelmon placeholder" },
  test: { to: null, kind: "ignore", reason: "Pixelmon placeholder" },
};

// ---------------------------------------------------------------------------
// Pack loading
// ---------------------------------------------------------------------------

/**
 * Reads a pack subdirectory across every root.
 *
 * `data` is the EFFECTIVE record (later roots win per-file, matching
 * base-data.service.ts). `stockData` is the same record as the *first* root
 * shipped it, or null if only an overlay supplies the file. Keeping both is what
 * lets custom content be identified by provenance instead of by a hand-kept list
 * of form names that would go stale the moment someone adds one.
 */
function readJsonDir(subdir) {
  /** @type {Map<string, {file: string, root: string, data: any, stockData: any}>} */
  const out = new Map();
  const [stockRoot] = PACK_ROOTS;

  for (const root of PACK_ROOTS) {
    const dir = path.join(REPO_ROOT, root, subdir);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      let data;
      try {
        data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      } catch (err) {
        throw new Error(`[pokemon-identity] unreadable ${path.join(root, subdir, file)}: ${err.message}`);
      }
      const prior = out.get(file);
      out.set(file, {
        file,
        root,
        data,
        stockData: root === stockRoot ? data : (prior?.stockData ?? null),
      });
    }
  }
  return out;
}

/**
 * True when this form is not in the stock Pixelmon pack — i.e. it is SmartRotom
 * custom content (`sakura`, `omnitrix`, `pesadilla`, `teras`, …). These belong to
 * the custom-content pipeline that feeds the `teras` ModdedDex; they are not
 * mapping failures and must not be reported as ones.
 */
export function isCustomForm(entry, formName) {
  if (!entry?.stockData) return true;
  const wanted = String(formName ?? "");
  return !(entry.stockData.forms ?? []).some((f) => String(f.name ?? "") === wanted);
}

export const loadSpeciesFiles = () => readJsonDir("species");
export const loadMoveFiles = () => readJsonDir("moves");
export const loadAbilityFiles = () => readJsonDir("abilities");

/**
 * Pixelmon forms are SPARSE DELTAS over a parent form — Venusaur's `mega`
 * declares stats but inherits its types, and `gmax` declares neither. Showdown
 * formes are fully-resolved standalone records. Any comparison between the two
 * has to resolve the delta first or it reports differences that are not there.
 */
export function resolveForm(species, form) {
  const forms = species.forms ?? [];
  const parentName = form.defaultBaseForm || species.defaultForms?.[0] || forms[0]?.name;
  const parent = forms.find((f) => f.name === parentName);
  if (!parent || parent === form) return { ...form };

  const merged = { ...parent };
  for (const [key, value] of Object.entries(form)) {
    if (value !== null && value !== undefined) merged[key] = value;
  }
  return merged;
}

const STAT_KEYS = [
  ["hp", "hp"],
  ["attack", "atk"],
  ["defense", "def"],
  ["specialAttack", "spa"],
  ["specialDefense", "spd"],
  ["speed", "spe"],
];

/** Pixelmon writes both `defense`/`defence`; accept either. */
function pixelmonStats(battleStats) {
  if (!battleStats) return null;
  const pick = (a, b) => battleStats[a] ?? battleStats[b];
  return {
    hp: battleStats.hp,
    atk: battleStats.attack,
    def: pick("defense", "defence"),
    spa: battleStats.specialAttack,
    spd: pick("specialDefense", "specialDefence"),
    spe: battleStats.speed,
  };
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

/**
 * @returns {{ok: boolean, id: string|null, kind: string, reason?: string, via: string}}
 *
 * Always a RESULT, never a bare id. The bridge this replaces
 * (apps/api/.../pokemon-showdown.service.ts) fell back to `|| forms[0]` and a
 * capitalize-first-letter default, which is how `evos: ["Ninetales form:base"]`
 * ended up inside a Showdown mod.
 */
export function resolveSpeciesForm(dex, speciesName, formName) {
  const baseId = toID(speciesName);
  const key = `${baseId}::${String(formName ?? "").toLowerCase()}`;

  const override = FORM_OVERRIDES[key];
  if (override) {
    return {
      ok: override.to !== null,
      id: override.to,
      kind: override.kind,
      reason: override.reason,
      via: "override",
    };
  }

  const base = dex.species.get(baseId);
  if (!base.exists) {
    return { ok: false, id: null, kind: "sourceOnly", reason: "species absent from Showdown", via: "derived" };
  }

  const candidate = baseId + normalizeFormSegment(formName);
  const hit = dex.species.get(candidate);
  if (hit.exists) return { ok: true, id: hit.id, kind: "derived", via: "derived" };

  return {
    ok: false,
    id: null,
    kind: "unmapped",
    reason: `no Showdown species for '${candidate}'`,
    via: "derived",
  };
}

export function resolveMove(dex, attackName) {
  const override = MOVE_OVERRIDES[attackName];
  if (override) {
    return { ok: override.to !== null, id: override.to, kind: override.kind, reason: override.reason, via: "override" };
  }
  const hit = dex.moves.get(toID(attackName));
  if (hit.exists) return { ok: true, id: hit.id, kind: "derived", via: "derived" };
  return { ok: false, id: null, kind: "unmapped", reason: `no Showdown move for '${toID(attackName)}'`, via: "derived" };
}

export function resolveAbility(dex, slug) {
  const override = ABILITY_OVERRIDES[slug];
  if (override) {
    return { ok: override.to !== null, id: override.to, kind: override.kind, reason: override.reason, via: "override" };
  }
  const hit = dex.abilities.get(toID(slug));
  if (hit.exists) return { ok: true, id: hit.id, kind: "derived", via: "derived" };
  return { ok: false, id: null, kind: "unmapped", reason: `no Showdown ability for '${toID(slug)}'`, via: "derived" };
}

// ---------------------------------------------------------------------------
// Cross-source validation
// ---------------------------------------------------------------------------

/**
 * The safety net. A name that resolves is not yet a mapping — Minior, Eiscue,
 * Maushold and Castform all have plausible names whose base form differs between
 * the two sources. Anything this returns is a defect in the table, not a
 * curiosity.
 *
 * `cosmeticOnly` entries are exempt from the stat check by design: Pixelmon's
 * `gmax` forms carry no stats at all, and its cosmetic formes are not expected
 * to match anything.
 */
export function validatePair({ pixelmonSpecies, resolvedForm, showdownSpecies }) {
  const problems = [];
  const accepted = (field) => KNOWN_DIVERGENCES[`${showdownSpecies.id}::${field}`];

  if (showdownSpecies.num !== pixelmonSpecies.dex && !accepted("num")) {
    problems.push({
      field: "num",
      pixelmon: pixelmonSpecies.dex,
      showdown: showdownSpecies.num,
    });
  }

  const px = pixelmonStats(resolvedForm.battleStats);
  if (px && Object.values(px).every((v) => typeof v === "number")) {
    const sd = showdownSpecies.baseStats;
    const bad = STAT_KEYS.filter(([, k]) => px[k] !== sd[k]).map(([, k]) => k);
    if (bad.length && !accepted("baseStats")) {
      problems.push({
        field: "baseStats",
        stats: bad,
        pixelmon: px,
        showdown: { hp: sd.hp, atk: sd.atk, def: sd.def, spa: sd.spa, spd: sd.spd, spe: sd.spe },
      });
    }
  }

  const pxTypes = (resolvedForm.types ?? []).map(toID).filter(Boolean).sort();
  const sdTypes = (showdownSpecies.types ?? []).map(toID).sort();
  if (pxTypes.length && pxTypes.join("/") !== sdTypes.join("/") && !accepted("types")) {
    problems.push({ field: "types", pixelmon: pxTypes, showdown: sdTypes });
  }

  return problems;
}
