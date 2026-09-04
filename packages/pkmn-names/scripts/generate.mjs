/**
 * Builds `src/data/es.generated.ts` — the Spanish name of every move, ability
 * and item the simulator can put on screen, keyed by the id `@pkmn` uses.
 *
 * KEYED BY ID, NOT BY NAME, and that is the whole point of generating this
 * rather than shipping the source catalogues. The repo's curated Spanish names
 * are keyed the way Pixelmon writes them (`attack_double-edge`, but
 * `ability_BattleArmour` — different casing, different separators, British
 * spellings, and `As One (Glastrier)` nowhere at all). Resolving those shapes at
 * RUNTIME means every screen carries a normaliser and a list of exceptions, and
 * a missed exception shows up as an English word in a Spanish sentence. Resolved
 * HERE, once, the runtime is a single object lookup on `toID(name)` that cannot
 * disagree with itself, and every gap is reported by this script instead of by a
 * user.
 *
 * TWO SOURCES, IN THIS ORDER:
 *  1. `apps/web/locales/es/smartrotom/pokedex/{moves,abilities}.json` — the
 *     repo's own catalogue, taken from WikiDex's official Spain track. It is
 *     authoritative: it was built precisely because the obvious source
 *     (Pixelmon's bundled `es_es.json`) is community-filled for the Gen 9 DLC
 *     and gets those names literally wrong.
 *  2. PokéAPI's `*_names.csv` (language 7 = es-ES) for what the catalogue does
 *     not carry — every item name, and the handful of moves/abilities the
 *     Pixelmon-shaped keys never had an entry for.
 *
 * Run it with `pnpm --filter @boffmedia/pkmn-names generate`. It needs network
 * for the CSVs and prints every unresolved name; a gap is a build-time fact
 * here, not a runtime surprise.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Dex, toID } from "@pkmn/dex";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.join(HERE, "..");
const REPO = path.join(PKG, "..", "..");
const LOCALES = path.join(REPO, "apps", "web", "locales", "es", "smartrotom", "pokedex");
const CSV_BASE = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv";
const ES = "7"; // languages.csv: 7 = es-ES (Spain), 9 = en
const EN = "9";

// ── sources ─────────────────────────────────────────────────────────────────

function repoCatalog(file) {
  const raw = JSON.parse(fs.readFileSync(path.join(LOCALES, `${file}.json`), "utf8"));
  return raw.pokedex ?? raw;
}

/** `attack_x` / `ability_x` entries, re-keyed by id so the shape stops mattering. */
function byId(catalog, prefix) {
  const out = new Map();
  for (const [key, value] of Object.entries(catalog)) {
    if (!key.startsWith(prefix) || key.endsWith("_description")) continue;
    if (typeof value !== "string" || !value.trim()) continue;
    out.set(toID(key.slice(prefix.length)), value.trim());
  }
  return out;
}

async function pokeapiNames(file) {
  const res = await fetch(`${CSV_BASE}/${file}.csv`);
  if (!res.ok) throw new Error(`${file}.csv: HTTP ${res.status}`);
  const rows = parseCsv(await res.text());
  const head = rows[0];
  const idCol = head.findIndex((c) => c.endsWith("_id"));
  const langCol = head.indexOf("local_language_id");
  const nameCol = head.indexOf("name");
  // English name -> Spanish name, joined on the numeric id the two rows share.
  const en = new Map();
  const es = new Map();
  for (const row of rows.slice(1)) {
    if (row[langCol] === EN) en.set(row[idCol], row[nameCol]);
    else if (row[langCol] === ES) es.set(row[idCol], row[nameCol]);
  }
  const out = new Map();
  for (const [numeric, english] of en) {
    const spanish = es.get(numeric);
    if (spanish) out.set(toID(english), spanish);
  }
  return out;
}

/** Minimal RFC-4180 reader — PokéAPI quotes any name containing a comma. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ── the run ─────────────────────────────────────────────────────────────────

const gen = Dex.forGen(9);

/** Everything a battle, a replay or the teambuilder can name. */
const wanted = {
  moves: gen.moves.all().filter((m) => m.exists),
  abilities: gen.abilities.all().filter((a) => a.exists),
  items: gen.items.all().filter((i) => i.exists),
};

const repoMoves = byId(repoCatalog("moves"), "attack_");
const repoAbilities = byId(repoCatalog("abilities"), "ability_");
const [apiMoves, apiAbilities, apiItems] = await Promise.all([
  pokeapiNames("move_names"),
  pokeapiNames("ability_names"),
  pokeapiNames("item_names"),
]);

/**
 * Showdown disambiguates four abilities that share one printed name by hanging a
 * parenthetical off it — `As One (Glastrier)`, `Embody Aspect (Cornerstone)`.
 * No official source has those strings, because officially they ARE one name
 * ("Unidad Ecuestre", "Evocarrecuerdos"); the parenthetical is Showdown's, and a
 * Spanish player still needs it to tell the four Ogerpon forms apart. So it is
 * rebuilt: the base name comes from the sources like anything else, and only the
 * word in brackets is translated here — the masks by their official Spanish
 * names, species names by passing through unchanged.
 */
const QUALIFIER = {
  Cornerstone: "Cimiento",
  Hearthflame: "Horno",
  Teal: "Turquesa",
  Wellspring: "Fuente",
};

/**
 * One capitalisation for the whole table.
 *
 * The two sources disagree: the repo's catalogue is Title Case ("A Bocajarro"),
 * which is what WikiDex, the pokédex and therefore the rest of this site use,
 * while PokéAPI follows the games' sentence case ("Unidad ecuestre"). Either is
 * defensible on its own; both at once is not, because the same battle log line
 * would show two conventions side by side. The site's own is the one that wins,
 * and Spanish keeps its joining words lowercase.
 */
const MINOR = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "o", "u", "a", "al", "en", "con", "por", "para", "sin", "un", "una"]);

function titleCaseEs(value) {
  return value
    .split(" ")
    .map((word, i) => {
      const bare = word.replace(/^\(/, "");
      if (i > 0 && MINOR.has(bare.toLowerCase())) return word.toLowerCase();
      return word.replace(/^(\(?)(.)/, (_, paren, first) => paren + first.toLocaleUpperCase("es"));
    })
    .join(" ");
}

/**
 * A source's answer is only an answer if it is a Spanish NAME.
 *
 * Two ways it is not. The repo catalogue leaves an entry at its English string
 * when Pixelmon never translated it — `Armor Cannon` sits there looking exactly
 * like a resolved name, while the real one (Cañón Blindado) is one source down.
 * And a handful of entries are raw Minecraft formatting codes (`ability_Error`
 * is literally `§k?§rError§k?§r`), which must never reach a screen.
 *
 * So a value equal to the English name does not stop the search — it is kept
 * only if nothing better exists, where it is indistinguishable from leaving the
 * name alone. Genuinely identical names (Amnesia, Surf, Poltergeist) come out
 * the same either way, which is why this can be a blanket rule.
 */
function usable(value) {
  return typeof value === "string" && value.trim() !== "" && !value.includes("§");
}

function resolve(entries, sources) {
  const table = {};
  const missing = [];
  const lookup = (id, english) => {
    const found = sources.map((s) => s.get(id)).filter(usable);
    return found.find((value) => value !== english) ?? found[0];
  };
  for (const entry of entries) {
    const id = entry.id ?? toID(entry.name);
    let found = lookup(id, entry.name);
    const qualified = /^(.+?) \(([^)]+)\)$/.exec(entry.name);
    if (!found && qualified) {
      const base = lookup(toID(qualified[1]), qualified[1]);
      if (base) found = `${base} (${QUALIFIER[qualified[2]] ?? qualified[2]})`;
    }
    if (found) table[id] = titleCaseEs(found);
    else missing.push(entry.name);
  }
  return { table, missing };
}

const moves = resolve(wanted.moves, [repoMoves, apiMoves]);
const abilities = resolve(wanted.abilities, [repoAbilities, apiAbilities]);
const items = resolve(wanted.items, [apiItems]);

for (const [label, r, total] of [
  ["moves", moves, wanted.moves.length],
  ["abilities", abilities, wanted.abilities.length],
  ["items", items, wanted.items.length],
]) {
  console.log(`${label}: ${total - r.missing.length}/${total} translated`);
  if (r.missing.length) console.log(`  no Spanish name: ${r.missing.join(", ")}`);
}

// Eyes on the output, every run: these are the names a competitive player reads
// most, and a source that quietly went LatAm (Combate Cercano for A Bocajarro)
// or lost the Gen 9 items would still produce a complete-looking table.
const SPOT = {
  moves: ["Close Combat", "Ivy Cudgel", "Thunderclap", "Upper Hand", "Tera Blast"],
  abilities: ["Embody Aspect (Cornerstone)", "As One (Glastrier)", "Protosynthesis", "Good as Gold"],
  items: ["Choice Band", "Focus Sash", "Leftovers", "Booster Energy", "Covert Cloak", "Loaded Dice", "Clear Amulet"],
};
console.log("\nspot check:");
for (const [label, names] of Object.entries(SPOT)) {
  const table = { moves: moves.table, abilities: abilities.table, items: items.table }[label];
  console.log(`  ${label}: ${names.map((n) => `${n} → ${table[toID(n)] ?? "(MISSING)"}`).join(" · ")}`);
}

const stamp = new Date().toISOString().slice(0, 10);
const body = (name, table) =>
  `export const ${name}: Record<string, string> = {\n` +
  Object.keys(table).sort().map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(table[id])},`).join("\n") +
  `\n};\n`;

const out = `// GENERATED by scripts/generate.mjs on ${stamp} — do not edit by hand.
// Sources: apps/web/locales/es/smartrotom/pokedex (WikiDex, official Spain) for
// moves and abilities; PokéAPI item_names.csv (language 7) for items.
// Keys are \`@pkmn\`'s \`toID(name)\`; values are display names.

${body("ES_MOVES", moves.table)}
${body("ES_ABILITIES", abilities.table)}
${body("ES_ITEMS", items.table)}`;

fs.writeFileSync(path.join(PKG, "src", "data", "es.generated.ts"), out, "utf8");
console.log(`wrote src/data/es.generated.ts (${(out.length / 1024).toFixed(1)} KB)`);
