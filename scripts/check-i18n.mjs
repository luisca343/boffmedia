#!/usr/bin/env node
// i18n guard. Seven checks, all failures:
//   1. es/en key parity (missing + orphan keys)
//   2. ICU argument parity between locales for the same key
//   3. manifest.generated.ts is in sync with the locales directory
//   4. scope safety — every namespace a route uses is reachable from that route
//   5. key-level reachability
//   6. no BCP-47 locale literal outside the locale-resolution layer (ratcheted)
//   7. hardcoded user-facing Spanish in files with no next-intl import (ratcheted)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildManifest, namespaceFiles, render } from "./generate-i18n-manifest.mjs";

const LOCALES = ["es", "en"];
const BASE = "es";

// English parity ratchet, exactly like LEGACY_DIRECT_DB in check-layering.mjs:
// lower these as gaps are backfilled, never raise them. Fully closed 2026-07-18
// (items, tools/pmdsky, twitch, boffmedia, pokedex all backfilled), so both sit
// at 0 — any new untranslated key now fails the build.
const MISSING_BASELINE = 0;
const ORPHAN_BASELINE = 0;
// Files naming a BCP-47 tag outside the locale-resolution layer (§3/§6 of
// docs/I18N_PLAN.md). Ratcheted at 0 after the 2026-07-27 formatting sweep —
// the shared formatter takes the viewer's locale, so nothing else needs one.
const LOCALE_LITERAL_BASELINE = 0;
const ROOT = "apps/web/locales";
const SRC = "apps/web/src";
const MANIFEST = "apps/web/src/i18n/manifest.generated.ts";
const SCOPES = "apps/web/src/i18n/scopes.ts";

const violations = [];
// Known-gap detail, reported but only fatal when a baseline is exceeded.
const gaps = [];

const leaves = (obj, prefix = "", out = new Map()) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) leaves(v, key, out);
    else out.set(key, typeof v === "string" ? v : String(v));
  }
  return out;
};

/**
 * Argument names a translator must preserve: `{name}` and the `count` of
 * `{count, plural, …}`. Depth-aware on purpose — a plural's option bodies are
 * themselves braced (`one {chirp} other {chirps}`) and are translatable text,
 * not arguments, so only depth-1 identifiers count.
 */
const icuArgs = (s) => {
  const args = new Set();
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "}") depth--;
    else if (s[i] === "{") {
      depth++;
      if (depth !== 1) continue;
      const name = /^\s*([a-zA-Z0-9_]+)\s*[,}]/.exec(s.slice(i + 1));
      if (name) args.add(name[1]);
    }
  }
  return args;
};

// ── 1 + 2. parity and ICU arguments ───────────────────────────────────────────
const files = namespaceFiles();
let missing = 0;
let orphan = 0;

for (const rel of files) {
  const base = leaves(JSON.parse(readFileSync(join(ROOT, BASE, rel), "utf8")));

  for (const locale of LOCALES.filter((l) => l !== BASE)) {
    let other;
    try {
      other = leaves(JSON.parse(readFileSync(join(ROOT, locale, rel), "utf8")));
    } catch {
      gaps.push(`${locale}/${rel}  missing entirely (${base.size} keys have no ${locale})`);
      missing += base.size;
      continue;
    }

    const miss = [...base.keys()].filter((k) => !other.has(k));
    const extra = [...other.keys()].filter((k) => !base.has(k));
    missing += miss.length;
    orphan += extra.length;

    if (miss.length) {
      gaps.push(
        `${locale}/${rel}  ${miss.length} key(s) missing, e.g. ${miss.slice(0, 3).join(", ")}`,
      );
    }
    if (extra.length) {
      gaps.push(
        `${locale}/${rel}  ${extra.length} orphan key(s) not in ${BASE}, e.g. ${extra.slice(0, 3).join(", ")}`,
      );
    }

    for (const [key, value] of base) {
      if (!other.has(key)) continue;
      const a = icuArgs(value);
      const b = icuArgs(other.get(key));
      const diff = [...a].filter((x) => !b.has(x)).concat([...b].filter((x) => !a.has(x)));
      if (diff.length) {
        violations.push(`${locale}/${rel}  ICU argument mismatch at "${key}": {${diff.join("}, {")}}`);
      }
    }
  }
}

// ── 3. manifest freshness ─────────────────────────────────────────────────────
const expected = render(buildManifest());
let actual = "";
try {
  actual = readFileSync(MANIFEST, "utf8");
} catch {
  /* reported below */
}
if (actual !== expected) {
  violations.push(`${MANIFEST}  stale — run \`pnpm generate:i18n\``);
}

// ── 4. scope safety ───────────────────────────────────────────────────────────
// A namespace root is reachable from a route if some file providing it is CORE
// (not scoped anywhere), or is scoped to a prefix covering that route.
const { roots } = buildManifest();
const scopeSrc = readFileSync(SCOPES, "utf8");
const scoped = new Map();
for (const block of scopeSrc.matchAll(/prefix:\s*"([^"]+)",\s*namespaces:\s*\[([^\]]*)\]/g)) {
  for (const ns of block[2].matchAll(/"([^"]+)"/g)) {
    if (!scoped.has(ns[1])) scoped.set(ns[1], []);
    scoped.get(ns[1]).push(block[1]);
  }
}

const sources = [];
const walkSrc = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules") continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walkSrc(path);
    else if (/\.(tsx?|jsx?)$/.test(entry) && !/\.(test|spec)\./.test(entry)) sources.push(path);
  }
};
walkSrc(join(SRC, "app"));
walkSrc(join(SRC, "components"));

/** `app/(boffmedia)/torneos/page.tsx` → `/torneos`; route groups are not in the URL. */
const routeOf = (file) => {
  const rel = file.replace(/\\/g, "/").replace(`${SRC}/`, "");
  if (!rel.startsWith("app/")) return null; // shared component: CORE only
  const parts = rel.slice(4).split("/").slice(0, -1);
  return `/${parts.filter((p) => !p.startsWith("(") && !p.startsWith("_")).join("/")}`;
};

const NS_CALL = /(?:useTranslations|getTranslations)\(\s*(["'`])([^"'`]*)\1/g;
const rootUsage = new Map();

for (const file of sources) {
  const src = readFileSync(file, "utf8");
  if (!src.includes("next-intl")) continue;
  for (const m of src.matchAll(NS_CALL)) {
    const root = m[2].split(".")[0];
    if (!root) continue; // root-namespace translator, reported separately
    if (!rootUsage.has(root)) rootUsage.set(root, new Set());
    rootUsage.get(root).add(file);
  }
}

// A root served by both a CORE file and a scoped one is only partly available off
// its prefix. Root-level analysis cannot tell which half a `t()` call wants, so
// these are reported for human review rather than silently trusted.
const splitRoots = [];

for (const [root, users] of rootUsage) {
  const providers = Object.entries(roots)
    .filter(([, keys]) => keys.includes(root))
    .map(([file]) => file);

  const core = providers.filter((p) => !scoped.has(p));
  if (core.length && core.length < providers.length) {
    const prefixes = [...new Set(providers.flatMap((p) => scoped.get(p) ?? []))];
    const offPrefix = [...users].filter((f) => {
      const route = routeOf(f);
      return route === null || !prefixes.some((p) => route.startsWith(p));
    });
    if (offPrefix.length) {
      splitRoots.push(
        `"${root}" — CORE: ${core.join(", ")} · scoped to ${prefixes.join(", ")}. ` +
          `${offPrefix.length} file(s) use it off-prefix and can only reach the CORE half: ${offPrefix
            .slice(0, 3)
            .map((f) => f.replace(`${SRC}/`, ""))
            .join(", ")}`,
      );
    }
  }

  if (!providers.length) {
    violations.push(
      `namespace "${root}" is used by ${users.size} file(s) but no locale file defines it — e.g. ${[...users][0]}`,
    );
    continue;
  }

  const alwaysLoaded = providers.some((p) => !scoped.has(p));
  if (alwaysLoaded) continue;

  const prefixes = providers.flatMap((p) => scoped.get(p) ?? []);
  for (const file of users) {
    const route = routeOf(file);
    if (route === null) {
      violations.push(
        `${file}  is a shared component using scoped namespace "${root}" — shared code may only use CORE namespaces, or the keys blank out wherever it renders`,
      );
    } else if (!prefixes.some((p) => route.startsWith(p) || p.startsWith(route))) {
      violations.push(
        `${file}  uses namespace "${root}", scoped to ${prefixes.join(", ")} — not loaded on ${route}`,
      );
    }
  }
}

// ── 5. key-level reachability ─────────────────────────────────────────────────
// Root-level analysis misses a root split across CORE and scoped files: arcade's
// squirdle reads `pokedex.pixelmon_*` from forms.json while only common.json is
// CORE. So resolve each literal `t()` key against the files that route loads.
const keysOf = (rel) => {
  const flat = leaves(JSON.parse(readFileSync(join(ROOT, BASE, rel), "utf8")));
  return new Set(flat.keys());
};
const fileKeys = Object.fromEntries(files.map((f) => [f, keysOf(f)]));

const loadedFor = (route) =>
  files.filter((f) => {
    const prefixes = scoped.get(f);
    return !prefixes || (route !== null && prefixes.some((p) => route.startsWith(p)));
  });

const T_CALL = /\bt(?:\.rich)?\(\s*([`"'])([^`"'$]*)(\$\{)?/g;

for (const file of sources) {
  const src = readFileSync(file, "utf8");
  if (!src.includes("next-intl")) continue;

  const ns = [...src.matchAll(NS_CALL)].map((m) => m[2]);
  if (!ns.length) continue;
  const route = routeOf(file);
  const available = loadedFor(route).flatMap((f) => [...fileKeys[f]]);

  for (const m of src.matchAll(T_CALL)) {
    const raw = m[2];
    const dynamic = Boolean(m[3]);
    if (!raw || (!dynamic && raw.includes(" "))) continue; // prose, not a key
    // A key resolves under any namespace the file declares.
    const candidates = ns.map((n) => (n ? `${n}.${raw}` : raw));
    const hit = candidates.some((c) =>
      dynamic ? available.some((k) => k.startsWith(c)) : available.includes(c),
    );
    if (!hit) {
      // Does it exist at all? If so this is a scoping bug, not a typo.
      const anywhere = files.some((f) =>
        candidates.some((c) =>
          dynamic ? [...fileKeys[f]].some((k) => k.startsWith(c)) : fileKeys[f].has(c),
        ),
      );
      violations.push(
        anywhere
          ? `${file.replace(`${SRC}/`, "")}  key "${raw}${dynamic ? "${…}" : ""}" exists but is NOT loaded on ${route} — widen scopes.ts`
          : `${file.replace(`${SRC}/`, "")}  key "${raw}${dynamic ? "${…}" : ""}" is not defined in any locale file`,
      );
    }
  }
}

const rootTranslators = sources.filter((f) => {
  const src = readFileSync(f, "utf8");
  return src.includes("next-intl") && /(?:useTranslations|getTranslations)\(\s*(["'`])\1/.test(src);
});

// ── 6. locale literals ────────────────────────────────────────────────────────
// A translated string next to a Spanish-formatted date is still a broken English
// page. Nothing outside the locale-resolution layer may name a BCP-47 tag: take
// the viewer's locale in and hand it to Intl. Ratcheted like the two above.
const LOCALE_LITERAL_RE = /(["'`])((?:[a-z]{2})-[A-Z]{2})\1/g;

// The resolution layer plus the genuine exemptions. Everything else is a bug.
const LOCALE_LITERAL_ALLOW = [
  // The one module allowed to map an app locale onto an Intl tag.
  "lib/locale.ts",
  // next-intl's own request/scope plumbing.
  "i18n/",
  // Pasaporte's MRZ strip is ICAO-encoded machine data, not presentation — its
  // transliteration is fixed by the spec, not by the viewer, so it is the one
  // place a locale literal would be legitimate. It does not currently need the
  // waiver (it formats nothing through Intl); this entry keeps it from being
  // "fixed" into locale-awareness later, which would corrupt the strip.
  "app/smartrotom/pasaporte/_utils/mrz.ts",
];

const localeLiteralFiles = [];
for (const file of sources) {
  const rel = file.replace(`${SRC}/`, "");
  if (LOCALE_LITERAL_ALLOW.some((a) => rel.startsWith(a) || rel.includes(a))) continue;
  const src = readFileSync(file, "utf8");
  const hits = [...src.matchAll(LOCALE_LITERAL_RE)].map((m) => m[2]);
  if (!hits.length) continue;
  localeLiteralFiles.push(
    `${rel}  hardcodes ${[...new Set(hits)].join(", ")} — take the locale as an argument ` +
      `(useFormat() from lib/useFormat, or intlLocale() from lib/locale)`,
  );
}
const localeLiterals = localeLiteralFiles.length;
if (localeLiterals > LOCALE_LITERAL_BASELINE) {
  for (const f of localeLiteralFiles) violations.push(f);
}

// ── 7. hardcoded Spanish ratchet ──────────────────────────────────────────────
// §6 of docs/I18N_PLAN.md: count files with user-facing Spanish that do not import
// next-intl, pin the number, fail when it grows. Exactly how check-layering.mjs
// pins LEGACY_DIRECT_DB. This is what stops the count silently climbing again
// while the extraction passes work it down.
//
// Detector: strip comments and import statements first, then look at JSX text and
// string/template literals only. A fragment is Spanish if it carries an accented
// character (or ¿¡) or contains at least two Spanish stopwords. Two independently
// written detectors agreed within noise (155 vs 157 files) on 2026-07-27.

// Showcase/specimen pages. Decided 2026-07-27 (§2): they document the design
// systems for developers, are explicitly excluded from translation, and are 76
// files — they must never be able to inflate this count.
const SPANISH_SKIP_DIRS = ["app/smartrotom/styles/", "app/(boffmedia)/styles/"];

// Files whose Spanish is game DATA or a wire value, not chrome. Translating any
// of these changes behaviour, so they are exempt individually rather than by glob.
const SPANISH_ALLOW = {
  "app/battlesim/_utils/toBSXMon.ts":
    "regexes that parse the battle engine's localized Spanish output — the literals are the input format",
  "app/smartrotom/taxi/_utils/trips.ts":
    '"Taxi a " is a StarBank ledger concept: it is written into the ledger and re-parsed out of it',
  "app/smartrotom/pc/_utils/marks.ts":
    "SUGGESTED_TAGS are persisted verbatim on the Pokémon; translating them forks the stored data",
  "app/smartrotom/gobierno/_components/eventos/shared.tsx":
    "RARITY_TIERS strings ARE the API's values, not labels for them",
  "app/smartrotom/gobierno/_components/seguridad/severity.ts":
    "TO_ENGLISH maps the API's Spanish wire vocabulary; the Spanish side is the wire, not copy",
  // Game taxonomy maps. Pokémon type names, Monster Hunter ailments and Mewgenics
  // rarities are game data, not copy — the do-not-translate glossary in
  // .claude/context/i18n.md covers exactly these.
  "app/smartrotom/pokedex/_utils/typeColors.ts": "Pokémon type names are game data",
  "app/(boffmedia)/(herramientas)/pokemon/battlesim/_lib/bx-helpers.ts":
    "Pokémon type names are game data",
  "components/boffmedia/ui/mh-db/mh-db-util.ts":
    "Monster Hunter ailment/element taxonomy — game data",
  "components/boffmedia/ui/mewgenics/mew-util.ts": "Mewgenics rarity taxonomy — game data",
};

const SPANISH_ACCENT_RE = /[áéíóúüñÁÉÍÓÚÜÑ¿¡]/;
const SPANISH_STOPWORDS = new Set([
  "de", "del", "la", "las", "el", "los", "un", "una", "unos", "unas", "que", "con",
  "por", "para", "sin", "sobre", "desde", "hasta", "entre", "como", "cuando",
  "donde", "porque", "pero", "aunque", "este", "esta", "estos", "estas", "ese",
  "esa", "todo", "toda", "todos", "todas", "otro", "otra", "hay", "ser", "estar",
  "tiene", "tienes", "puede", "puedes", "debe", "solo", "cada", "sus", "tus",
  "nuestro", "nuestra", "ninguno", "ninguna", "algun", "alguna", "mismo", "misma",
]);

const isSpanish = (text) => {
  if (!/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(text)) return false;
  if (SPANISH_ACCENT_RE.test(text)) return true;
  const words = text.toLowerCase().match(/[a-záéíóúüñ]+/g) ?? [];
  const hits = new Set(words.filter((w) => SPANISH_STOPWORDS.has(w)));
  return hits.size >= 2;
};

/** Comments and imports carry Spanish that never reaches a user. */
const stripNoise = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1")
    .replace(/^\s*import[\s\S]*?from\s*["'][^"']*["'];?/gm, " ")
    .replace(/^\s*import\s*["'][^"']*["'];?/gm, " ");

const STRING_LIT_RE = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
const JSX_TEXT_RE = />([^<>{}]+)</g;

const spanishSources = [];
const walkAll = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules") continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walkAll(path);
    else if (/\.tsx?$/.test(entry) && !/\.(test|spec)\./.test(entry)) spanishSources.push(path);
  }
};
walkAll(SRC);

const hardcodedSpanish = [];
for (const file of spanishSources) {
  const rel = file.replace(/\\/g, "/").replace(`${SRC}/`, "");
  if (SPANISH_SKIP_DIRS.some((d) => rel.startsWith(d))) continue;
  if (SPANISH_ALLOW[rel]) continue;
  const raw = readFileSync(file, "utf8");
  if (raw.includes("next-intl")) continue;
  const src = stripNoise(raw);
  const fragments = [
    ...[...src.matchAll(STRING_LIT_RE)].map((m) => m[2]),
    ...[...src.matchAll(JSX_TEXT_RE)].map((m) => m[1]),
  ];
  const hit = fragments.find((f) => isSpanish(f.trim()));
  if (hit) hardcodedSpanish.push({ rel, sample: hit.trim().slice(0, 60) });
}

// Pinned 2026-07-27, right after the mass extraction, at its historic low. Only
// ever lower this — a growth means someone shipped a new hardcoded string.
const HARDCODED_ES_BASELINE = 39;
const hardcodedCount = hardcodedSpanish.length;
if (hardcodedCount > HARDCODED_ES_BASELINE) {
  for (const { rel, sample } of hardcodedSpanish.slice(0, 40)) {
    violations.push(`${rel}  hardcoded user-facing copy (accents/Spanish stopwords), no next-intl import — e.g. "${sample}"`);
  }
}

for (const [label, count, baseline, grew] of [
  ["missing", missing, MISSING_BASELINE, "new work must ship every locale; see the listing above"],
  ["orphan", orphan, ORPHAN_BASELINE, "new work must ship every locale; see the listing above"],
  [
    "locale_literal",
    localeLiterals,
    LOCALE_LITERAL_BASELINE,
    "new work must ship every locale; see the listing above",
  ],
  [
    "hardcoded_es",
    hardcodedCount,
    HARDCODED_ES_BASELINE,
    "a file gained user-facing Spanish with no next-intl — extract it (see the listing above)",
  ],
]) {
  if (count > baseline) {
    violations.push(`${label} grew ${baseline} → ${count} — ${grew}`);
  } else if (count < baseline) {
    violations.push(
      `${label} is down to ${count} (baseline ${baseline}) — lower ${label.toUpperCase()}_BASELINE in scripts/check-i18n.mjs so the guard ratchets forward`,
    );
  }
}

console.log(
  `i18n: ${files.length} namespaces · ${missing}/${MISSING_BASELINE} missing key(s) · ` +
    `${orphan}/${ORPHAN_BASELINE} orphan key(s) · ${localeLiterals}/${LOCALE_LITERAL_BASELINE} locale literal(s) · ` +
    `${hardcodedCount}/${HARDCODED_ES_BASELINE} file(s) with hardcoded Spanish · ` +
    `${scoped.size} scoped namespace(s) · ` +
    `${rootTranslators.length} root-namespace translator(s)`,
);

if (gaps.length) {
  console.log(`\n  known English gap (${gaps.length} file(s), at baseline — backfill lowers it):`);
  for (const g of gaps.slice(0, 12)) console.log("    " + g);
  if (gaps.length > 12) console.log(`    … and ${gaps.length - 12} more`);
}

if (hardcodedSpanish.length) {
  const byArea = new Map();
  for (const { rel } of hardcodedSpanish) {
    // `app/smartrotom/gobierno/…` → `app/smartrotom/gobierno`; `lib/x.ts` → `lib`.
    const dirs = rel.split("/").slice(0, -1);
    const area = dirs.slice(0, 3).join("/") || ".";
    byArea.set(area, (byArea.get(area) ?? 0) + 1);
  }
  console.log(
    `\n  hardcoded Spanish, no next-intl (${hardcodedSpanish.length} file(s), at baseline — extracting lowers it):`,
  );
  for (const [area, n] of [...byArea].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`    ${n}  ${area}`);
  }
}

if (splitRoots.length) {
  console.log(`\n  split roots (partly CORE, partly scoped — key-level risk this check cannot see):`);
  for (const s of splitRoots) console.log("    " + s);
}

if (violations.length) {
  console.error(`\n✗ i18n check failed (${violations.length}):\n`);
  for (const v of violations.slice(0, 40)) console.error("  " + v);
  if (violations.length > 40) console.error(`  … and ${violations.length - 40} more`);
  console.error("");
  process.exit(1);
}
console.log("✓ i18n: locales in parity, manifest current, every namespace reachable from its routes");
