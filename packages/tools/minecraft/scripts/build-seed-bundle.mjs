/**
 * build-seed-bundle.mjs — turn a datapack source into a curated worldgen
 * bundle served from our own origin.
 *
 * Why this exists at all: the browser can fetch Modrinth directly (its CDN and
 * API both send `access-control-allow-origin: *`), but **vanilla worldgen JSON
 * is not on Modrinth**. It comes from misode/mcmeta via codeload.github.com,
 * which sends no CORS headers whatsoever. So the vanilla bundle is not an
 * optimisation, it is the only way a browser can ever get that data — every
 * other pack is curated purely for speed.
 *
 * The bundle carries only what `packs.mjs` keeps, so `inspectPacks` still has
 * the files it audits and `biome_colors.json` survives, and it is written in the
 * *solid* format (see `_core/bundle.mjs`) rather than as a .zip. That is not a
 * preference — a zip deflates each file independently, and these packs are
 * thousands of ~2 KB JSONs that share almost all their vocabulary:
 *
 *   vanilla 1.21.1   5.49 MB raw   385 KB as .zip   112 KB solid
 *   terralith 2.6.2  5.59 MB raw   878 KB as .zip   194 KB solid
 *
 * 4.2x over the whole stack, for one deflate stream and a JSON index.
 *
 * ## The filename carries a content hash, and it has to
 *
 * `apps/web/next.config.mjs` serves `/boffmedia/tools/*` as
 * `max-age=31536000, immutable`, on the stated grounds that everything under it
 * is content-addressed or append-only. A name like `terralith-2.6.2.bin` is
 * neither: it pins the *pack* version, not the bundle's contents, so rebuilding
 * it — which is exactly what happened when the filter started keeping biome
 * colours — leaves every browser that already fetched it holding the old bytes
 * for a year, with no error and no way to tell. Hashing the output into the
 * name makes a rebuild a different URL, which is what that header already
 * promises.
 *
 *   node scripts/build-seed-bundle.mjs <src> <outDir> <id> <version>
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, unzipSync } from 'fflate';
import { packBundle } from '../src/seeds/_core/bundle.mjs';
import { wanted as keepFile } from '../src/seeds/_core/packs.mjs';

// The filter is imported, never re-stated: a local copy of the category list
// drifted from the real one once and quietly dropped every pack's biome
// colours, which is exactly the kind of failure a bundle cannot report.
const wanted = (rel) => keepFile(rel, 'audit');

// Only needed to prune the root walk below; `wanted` does the real deciding.
const META_FILES = new Set([
  'pack.mcmeta', 'fabric.mod.json', 'quilt.mod.json',
  'META-INF/mods.toml', 'META-INF/neoforge.mods.toml',
]);

/** Where the generated id -> filename map is written. */
const MANIFEST = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', 'src', 'seeds', '_lib', 'bundles.generated.ts',
);

/**
 * Split a leading `overlay.<name>/` off a path.
 *
 * A datapack may ship alternative copies of its files in overlay directories
 * and declare in `pack.mcmeta` which pack_format range each one serves. The
 * game applies the matching ones over the base tree; anything that reads only
 * `data/` sees a pack with dangling references. Tectonic is the live example:
 * its base tree references `tectonic:__constants/*` and every one of those
 * files lives in `overlay.datapack`, so loading the base alone throws
 * "Missing key in minecraft:worldgen/density_function".
 */
const splitOverlay = (p) => {
  const m = /^(overlay\.[^/]+)\/(.*)$/.exec(p);
  return m ? [m[1], m[2]] : ['', p];
};

/** The bounds of one `overlays.entries` row, in either spelling. */
function formatRange(e) {
  const f = e.formats;
  const lo = e.min_format ?? (Array.isArray(f) ? f[0] : typeof f === 'object' && f ? f.min_inclusive : f);
  const hi = e.max_format ?? (Array.isArray(f) ? f[1] : typeof f === 'object' && f ? f.max_inclusive : f);
  return [lo ?? -Infinity, hi ?? Infinity];
}

/**
 * Which overlay directories to apply, in application order.
 *
 * Only those the pack itself declares for this pack_format, plus any named on
 * the command line. The undeclared ones are opt-in variants a player chooses
 * (Tectonic ships `overlay.terratonic`, its Terralith compatibility layer, and
 * `overlay.no_carvers` among others) and must never be applied by default.
 */
function applicableOverlays(mcmeta, packFormat, extra) {
  const out = [];
  for (const e of mcmeta?.overlays?.entries ?? []) {
    const [lo, hi] = formatRange(e);
    if (packFormat >= lo && packFormat <= hi) out.push(e.directory);
  }
  // `--overlay=terratonic` and `--overlay=overlay.terratonic` mean the same
  // directory; the short form is what the pack's own documentation uses.
  for (const name of extra) {
    const dir = name.startsWith('overlay.') ? name : `overlay.${name}`;
    if (!out.includes(dir)) out.push(dir);
  }
  return out;
}

/** Every candidate entry, still carrying its overlay prefix. */
function readEntries(src) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    const out = new Map();
    const walk = (dir, prefix) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = prefix + e.name;
        if (e.isDirectory()) {
          // Prune at the root so we never stat the thousands of files we
          // discard — but never prune an overlay, which is a second root.
          if (prefix === '' && full !== 'data' && !full.startsWith('overlay.') && !META_FILES.has(full)) continue;
          walk(path.join(dir, e.name), full + '/');
        } else if (wanted(splitOverlay(full)[1])) {
          out.set(full, new Uint8Array(fs.readFileSync(path.join(dir, e.name))));
        }
      }
    };
    walk(src, '');
    return out;
  }
  const unzipped = unzipSync(new Uint8Array(fs.readFileSync(src)), {
    filter: (f) => !f.name.endsWith('/') && (f.name === 'pack.mcmeta' || wanted(splitOverlay(f.name)[1])),
  });
  return new Map(Object.entries(unzipped));
}

function collect(src, packFormat, extra) {
  const entries = readEntries(src);

  let mcmeta = null;
  const metaBytes = entries.get('pack.mcmeta');
  if (metaBytes) {
    try {
      mcmeta = JSON.parse(new TextDecoder().decode(metaBytes));
    } catch {
      console.warn('  pack.mcmeta is not valid JSON — no overlays applied');
    }
  }

  const overlays = applicableOverlays(mcmeta, packFormat, extra);
  if (overlays.length) console.log(`  overlays for pack_format ${packFormat}: ${overlays.join(', ')}`);

  // Base first, then each overlay over it, in declaration order — the same
  // order the game applies them.
  const out = {};
  for (const [full, bytes] of entries) {
    const [dir, rel] = splitOverlay(full);
    if (dir === '') out[rel] = bytes;
  }
  for (const dir of overlays) {
    let n = 0;
    for (const [full, bytes] of entries) {
      const [d, rel] = splitOverlay(full);
      if (d === dir) { out[rel] = bytes; n++; }
    }
    // An overlay asked for by name that contributes nothing is a typo, and a
    // bundle built from a typo is indistinguishable from one built correctly
    // — it just quietly lacks the compatibility layer it was named for.
    if (!n && extra.some((e) => (e.startsWith('overlay.') ? e : `overlay.${e}`) === dir)) {
      throw new Error(
        `--overlay=${dir} matched no files. Available: ` +
        [...new Set([...entries.keys()].map((f) => splitOverlay(f)[0]).filter(Boolean))].join(', '),
      );
    }
    console.log(`    ${dir}: ${n} files`);
  }
  return out;
}

/** Rewrite the generated manifest, preserving every id but the one just built. */
function writeManifest(entries) {
  const rows = [...entries.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, file]) => `  ${JSON.stringify(id)}: ${JSON.stringify(file)},`)
    .join('\n');

  fs.writeFileSync(
    MANIFEST,
    `/**
 * GENERATED by scripts/build-seed-bundle.mjs — do not edit by hand.
 *
 * Maps a curated pack id to the file currently on disk. The filename carries a
 * hash of the bundle's contents because \`/boffmedia/tools/*\` is served
 * immutable for a year: without it, a rebuilt bundle keeps its old URL and
 * every browser that already has it never sees the new bytes.
 */

export const BUNDLE_FILES: Readonly<Record<string, string>> = {
${rows}
};
`,
  );
}

function readManifest() {
  const entries = new Map();
  if (!fs.existsSync(MANIFEST)) return entries;
  const src = fs.readFileSync(MANIFEST, 'utf8');
  for (const m of src.matchAll(/^\s*"([^"]+)":\s*"([^"]+)",$/gm)) entries.set(m[1], m[2]);
  return entries;
}

const [src, outDir, id, version, ...rest] = process.argv.slice(2);
if (!src || !outDir || !id || !version) {
  console.error(
    'usage: build-seed-bundle.mjs <src> <outDir> <id> <version> [--format=N] [--overlay=name ...]',
  );
  process.exit(1);
}

// 48 is 1.21.1, the version this tool ships. It decides which of a pack's
// declared overlays apply, so building for the wrong number silently produces
// a pack meant for another Minecraft.
const packFormat = Number(rest.find((a) => a.startsWith('--format='))?.slice(9) ?? 48);
const extraOverlays = rest.filter((a) => a.startsWith('--overlay=')).map((a) => a.slice(10));

const files = collect(src, packFormat, extraOverlays);
const count = Object.keys(files).length;
if (!count) {
  throw new Error(`No worldgen files found in ${src} — wrong path, or a pack that ships no worldgen.`);
}

// level 9: written once at build time, fetched immutably forever after.
const out = packBundle(files, deflateSync);
const hash = crypto.createHash('sha256').update(out).digest('hex').slice(0, 8);
const filename = `${id}-${version}.${hash}.bin`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, filename), out);

// Drop superseded builds of the same id. Nothing references them any more —
// the manifest only ever names one file per id — and leaving them behind grows
// the deployed tree without bound.
for (const existing of fs.readdirSync(outDir)) {
  if (existing !== filename && new RegExp(`^${id}-.*\\.bin$`).test(existing)) {
    fs.unlinkSync(path.join(outDir, existing));
    console.log(`  removed superseded ${existing}`);
  }
}

const entries = readManifest();
entries.set(id, filename);
writeManifest(entries);

const raw = Object.values(files).reduce((n, b) => n + b.length, 0);
console.log(
  `${id}: ${count} files, ${(raw / 1048576).toFixed(2)} MB raw -> ` +
  `${(out.length / 1024).toFixed(0)} KB solid (${(raw / out.length).toFixed(1)}x)  ${filename}`,
);
