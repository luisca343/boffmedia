#!/usr/bin/env node
/**
 * Fills gaps in the SmartRotom Pokédex locale files from Pixelmon's own lang
 * files, which ship 25 locales and are currently read by nothing.
 *
 *   node scripts/tools/build-pokedex-locales.mjs             # add missing keys
 *   node scripts/tools/build-pokedex-locales.mjs --check     # CI: fail if stale
 *   node scripts/tools/build-pokedex-locales.mjs --review    # list disagreements
 *
 * THE MERGE DIRECTION IS DELIBERATE AND IT IS NOT THE OBVIOUS ONE.
 *
 * The first cut of this script regenerated the dictionaries from Pixelmon and
 * overwrote whatever was there. That was wrong, and the diff proved it:
 * Pixelmon 9.4.0's `es_es.json` says `pixelmon.flapple = "Appletun"` — a
 * different species — and mistranslates Flutter Mane ("Cola Aguda", should be
 * "Melenaleteo") and Brute Bonnet ("Bonete Feroz", should be "Furioseta"). The
 * older 9.3 pack had Flapple right, so this is a regression Pixelmon shipped.
 * Someone had already hand-corrected these in the repo.
 *
 * So: THE REPO WINS. Pixelmon only supplies keys the repo does not have. A key
 * that exists on both sides is never touched, no matter which one looks newer.
 * Disagreements are reported (`--review`) for a human to judge, never applied.
 *
 * The other hard rule is key parity. `scripts/check-i18n.mjs` fails the build if
 * a key exists in one locale and not the other ("orphan grew"), so a key is only
 * added when EVERY target locale can supply it.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadSpeciesFiles, toID } from "./lib-pokemon-identity.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, "..", "..");

const CHECK = process.argv.includes("--check");
const REVIEW = process.argv.includes("--review");
const DRY = process.argv.includes("--dry-run");

const log = (...a) => console.log("[pokedex-locales]", ...a);

/** Resourcepack roots, later wins — same precedence as the datapack overlay. */
const LANG_ROOTS = [
  "public/smartrotom/packs/default_resourcepack_9.4.0/assets/pixelmon/lang",
  "public/smartrotom/packs/resourcepack/assets/pixelmon/lang",
];

/** Repo locale -> Pixelmon lang file. */
const LOCALES = { en: "en_us", es: "es_es" };

/**
 * Every species name in the packs, `toID`-normalised. Used to tell a real
 * species key apart from a Pixelmon UI string that happens to share its shape.
 */
const SPECIES_SLUGS = new Set(
  [...loadSpeciesFiles().values()]
    .map((e) => e.data?.name)
    .filter(Boolean)
    .map(toID),
);

/**
 * Only these key families are auto-filled.
 *
 * `form_*` and `palette_*` in forms.json are a FLAT namespace of SmartRotom's
 * own form vocabulary (`form_teras`, `form_omnitrix`), not Pixelmon's
 * `pixelmon.<species>.form.<name>` keys. They are hand-authored and stay that
 * way — mapping them would be guessing.
 */
const FAMILIES = [
  {
    file: "moves",
    prefix: "attack_",
    toPixelmon: (key) => {
      const rest = key.slice("attack_".length);
      return rest.endsWith("_description")
        ? `attack.${rest.slice(0, -"_description".length)}.description`
        : `attack.${rest}`;
    },
    // STRICT: exactly `attack.<slug>` or `attack.<slug>.description`, where the
    // slug holds no further dots. Pixelmon's `attack.*` namespace also carries
    // battle messages — `attack.category.physical`, `attack.curse.curse`,
    // `attack.expanding_force.onpsychicterrain` — which are not move names. A
    // loose match let those through as `attack_category.physical`, and next-intl
    // rejects any key containing a dot because dots express nesting.
    fromPixelmon: (pk) => {
      const m = /^attack\.([^.]+)(\.description)?$/.exec(pk);
      return m ? `attack_${m[1]}${m[2] ? "_description" : ""}` : null;
    },
  },
  {
    file: "forms",
    prefix: "pixelmon_",
    toPixelmon: (key) => key.replace(/_/g, "."),
    // `pixelmon.<species>` and `pixelmon.<species>.description` only.
    //
    // The shape alone is NOT enough. Pixelmon puts its own UI strings in the same
    // flat namespace — `pixelmon.add`, `pixelmon.save`, `pixelmon.upload`,
    // `pixelmon.egg` — and they match the pattern perfectly while being nothing
    // to do with a Pokémon. So the slug is also checked against the species that
    // actually exist in the packs. Shape says it could be a species; the pack
    // says whether it is one.
    fromPixelmon: (pk) => {
      const m = /^pixelmon\.([a-z0-9]+)(\.description)?$/.exec(pk);
      if (!m || !SPECIES_SLUGS.has(m[1])) return null;
      return `pixelmon_${m[1]}${m[2] ? "_description" : ""}`;
    },
  },
];

function readLang(locale) {
  let merged = {};
  let found = false;
  for (const root of LANG_ROOTS) {
    const p = path.join(REPO_ROOT, root, `${LOCALES[locale]}.json`);
    if (!fs.existsSync(p)) continue;
    found = true;
    merged = { ...merged, ...JSON.parse(fs.readFileSync(p, "utf8")) };
  }
  return found ? merged : null;
}

/**
 * The two files do not agree on indentation — moves.json is 2-space, forms.json
 * is 4-space. Hardcoding either one rewrites 4900 lines of the other and buries
 * the real change, so detect it per file.
 */
function detectIndent(source) {
  const nl = source.indexOf(String.fromCharCode(10));
  if (nl < 0) return "  ";
  const second = source.slice(nl + 1);
  const width = second.length - second.trimStart().length;
  return width > 0 ? second.slice(0, width) : "  ";
}

const targetPath = (locale, file) =>
  path.join(REPO_ROOT, "apps/web/locales", locale, "smartrotom/pokedex", `${file}.json`);

// ---------------------------------------------------------------------------

const langs = {};
for (const locale of Object.keys(LOCALES)) {
  langs[locale] = readLang(locale);
  if (!langs[locale]) {
    log(`Pixelmon lang files not present (/public/ is gitignored) — nothing to do.`);
    process.exit(0);
  }
}

let stale = 0;
const review = [];
const rejected = [];

for (const family of FAMILIES) {
  // A key is only addable if EVERY locale can supply it (check-i18n parity).
  const addable = new Map();
  for (const [locale, lang] of Object.entries(langs)) {
    const own = new Set();
    for (const pk of Object.keys(lang)) {
      const key = family.fromPixelmon(pk);
      if (key) own.add(key);
    }
    if (addable.size === 0 && locale === Object.keys(langs)[0]) {
      for (const k of own) addable.set(k, true);
    } else {
      for (const k of [...addable.keys()]) if (!own.has(k)) addable.delete(k);
    }
  }

  for (const [locale, lang] of Object.entries(langs)) {
    const file = targetPath(locale, family.file);
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    const dict = raw.pokedex ?? raw;

    let added = 0;
    let agree = 0;
    let disagree = 0;

    for (const key of Object.keys(dict)) {
      if (!key.startsWith(family.prefix)) continue;
      const value = lang[family.toPixelmon(key)];
      if (value === undefined) continue;
      if (String(value).trim() === String(dict[key]).trim()) agree++;
      else {
        disagree++;
        review.push({ locale, file: family.file, key, repo: dict[key], pixelmon: value });
      }
    }

    // Append missing keys, sorted, after the existing ones. Existing order is
    // preserved so the diff shows only what was actually added.
    // Hard guard, independent of the matchers above: next-intl uses "." to
    // express nesting, so a key containing one is rejected at load time with
    // INVALID_KEY. Never write one, whatever a mapper thinks.
    const missing = [...addable.keys()]
      .filter((k) => !(k in dict))
      .filter((k) => {
        if (!k.includes(".")) return true;
        rejected.push(`${family.file} ${k}`);
        return false;
      })
      .sort();
    const next = { ...dict };
    for (const key of missing) {
      const value = lang[family.toPixelmon(key)];
      if (value === undefined) continue;
      next[key] = value;
      added++;
    }

    const current = fs.readFileSync(file, "utf8");
    const wanted = `${JSON.stringify({ pokedex: next }, null, detectIndent(current))}\n`;

    log(
      `${locale}/${family.file}: ${Object.keys(dict).length} keys, ` +
        `+${added} filled from Pixelmon, ${agree} agree, ${disagree} DISAGREE (not touched)`,
    );

    if (current === wanted) continue;
    stale++;
    if (CHECK) {
      console.error(`[pokedex-locales] ${locale}/${family.file}.json is stale (+${added} keys)`);
    } else if (!DRY) {
      fs.writeFileSync(file, wanted, "utf8");
      log(`  wrote ${path.relative(REPO_ROOT, file)}`);
    }
  }
}

if (rejected.length) {
  log("");
  log(`${rejected.length} candidate key(s) rejected for containing "." (next-intl nesting):`);
  for (const r of rejected) log(`  ${r}`);
}

if (review.length) {
  log("");
  log(
    `${review.length} key(s) where Pixelmon and the repo DISAGREE. The repo value is kept. ` +
      `Pixelmon 9.4.0 is known to have regressed some of these — review, do not bulk-apply.`,
  );
  if (REVIEW) {
    for (const r of review) {
      log(`  ${r.locale}/${r.file} ${r.key}`);
      log(`      repo     : ${JSON.stringify(r.repo).slice(0, 100)}`);
      log(`      pixelmon : ${JSON.stringify(r.pixelmon).slice(0, 100)}`);
    }
  } else {
    log("  run with --review to list them");
  }
}

if (CHECK && stale) {
  console.error("[pokedex-locales] run: node scripts/tools/build-pokedex-locales.mjs");
  process.exit(1);
}
