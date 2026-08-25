/**
 * packs.mjs — ordered datapack overlay.
 *
 * A "pack" is a folder, a .zip datapack, or a mod .jar. All three expose the
 * same `data/<namespace>/<category>/<path>.json` layout, so we normalise to a
 * flat Map<relPath, Uint8Array> and stack them.
 *
 * Stack order mirrors Minecraft: earlier entries are overridden by later ones.
 * Vanilla first, then mods in load order, then world datapacks.
 */
import { inflateSync, unzipSync } from 'fflate';
import { unpackBundle } from './bundle.mjs';

const dec = new TextDecoder();

/** Everything the evaluator can actually read. Loading only these turns a
 *  cold 6801-file vanilla tree from ~55 s of Windows file I/O into ~0.3 s. */
export const WORLDGEN_CATEGORIES = [
  'worldgen/noise',
  'worldgen/density_function',
  'worldgen/noise_settings',
  'worldgen/multi_noise_biome_source_parameter_list',
  'dimension',
  'tags/worldgen/biome',
];

/**
 * Single files, matched exactly rather than as a category prefix.
 *
 * `c:worldgen/biome_colors` is a community convention (the `c` namespace is
 * the cross-loader "common" one) that map tools read and packs author: Terralith
 * ships 94 entries with both an RGB colour and a display name. It is not
 * worldgen the evaluator reads — it changes nothing about the world — but it is
 * the difference between "terralith:yellowstone" in a hashed hue and
 * "Yellowstone" in the colour its author chose.
 *
 * The unprefixed `<ns>:biome_colors` form is the older layout some packs still
 * ship, kept so those packs are not silently rendered in fallback colours.
 */
export const DATA_FILES = [
  'worldgen/biome_colors',
  'worldgen/structure_icons',
  'biome_colors',
  'structure_icons',
];

/** Paths that reveal what a pack *claims* to do, kept for `inspect`. */
const META_FILES = new Set([
  'pack.mcmeta', 'fabric.mod.json', 'quilt.mod.json',
  'META-INF/mods.toml', 'META-INF/neoforge.mods.toml',
]);

/** Categories `inspect` warns about — worldgen we deliberately do not model. */
export const AUDIT_CATEGORIES = [
  'worldgen/biome', 'worldgen/structure', 'worldgen/structure_set',
  'worldgen/configured_feature', 'worldgen/placed_feature', 'worldgen/configured_carver',
  'worldgen/world_preset', 'worldgen/flat_level_generator_preset',
  'lithostitched/worldgen_modifier', 'lithostitched/biome_modifier',
  'forge/biome_modifier', 'neoforge/biome_modifier',
];

/**
 * Is this path worth keeping? Exported because the bundle builder must apply
 * the *same* filter: a second copy of this list drifted once already and
 * silently dropped every pack's biome colours.
 */
export function wanted(rel, mode) {
  if (META_FILES.has(rel)) return true;
  if (mode === 'full') return rel.startsWith('data/');
  const m = /^data\/[a-z0-9_.-]+\/(.+)\.json$/.exec(rel);
  if (!m) return false;
  if (DATA_FILES.includes(m[1])) return true;
  const cats = mode === 'audit' ? WORLDGEN_CATEGORIES.concat(AUDIT_CATEGORIES) : WORLDGEN_CATEGORIES;
  return cats.some(c => m[1].startsWith(c + '/'));
}

/**
 * A pack from a .zip/.jar byte buffer. This is the browser path: whether the
 * bytes came from Modrinth's CDN, a curated bundle, or a `File` the user
 * dragged in, they arrive here identically.
 *
 * @param {Uint8Array} bytes
 * @param {string} name display name
 * @param {{mode?:'worldgen'|'audit'|'full', kind?:string, source?:string}} [opts]
 * @returns {{name:string, kind:string, source:string, files:Map<string,Uint8Array>}}
 */
export function packFromZip(bytes, name, opts = {}) {
  const mode = opts.mode ?? 'worldgen';
  const entries = unzipSync(bytes, { filter: (f) => !f.name.endsWith('/') && wanted(f.name, mode) });
  const files = new Map();
  for (const [k, v] of Object.entries(entries)) files.set(k, v);
  return { name, kind: opts.kind ?? 'zip', source: opts.source ?? name, files };
}

/**
 * A pack from an already-flat `Map<relPath, Uint8Array>` — the curated-bundle
 * path, where the filtering happened at build time. Entries are re-filtered
 * anyway so a bundle built for `audit` can be consumed as `worldgen`.
 *
 * @param {Map<string,Uint8Array>|Record<string,Uint8Array>} entries
 * @param {string} name
 * @param {{mode?:'worldgen'|'audit'|'full', kind?:string, source?:string}} [opts]
 */
export function packFromFiles(entries, name, opts = {}) {
  const mode = opts.mode ?? 'worldgen';
  const it = entries instanceof Map ? entries : Object.entries(entries);
  const files = new Map();
  for (const [rel, data] of it) if (wanted(rel, mode)) files.set(rel, data);
  return { name, kind: opts.kind ?? 'bundle', source: opts.source ?? name, files };
}

/**
 * A pack from a curated bundle built by `scripts/build-seed-bundle.mjs`. This
 * is the only way the browser can ever load *vanilla* worldgen: it is not on
 * Modrinth, it lives on codeload.github.com, and codeload sends no CORS
 * headers at all. For every other pack this path is merely 30-50x faster.
 *
 * @param {Uint8Array} bytes
 * @param {string} name
 * @param {{mode?:'worldgen'|'audit'|'full', source?:string}} [opts]
 */
export function packFromBundle(bytes, name, opts = {}) {
  return packFromFiles(unpackBundle(bytes, inflateSync), name, {
    ...opts,
    kind: 'bundle',
    source: opts.source ?? name,
  });
}

export class PackStack {
  /** @param {Array<ReturnType<typeof packFromZip>>} packs ordered low -> high priority */
  constructor(packs) {
    this.packs = packs;
    /** @type {Map<string, {pack:string, data:Uint8Array}>} */
    this.index = new Map();
    for (const p of packs) {
      for (const [rel, data] of p.files) this.index.set(rel, { pack: p.name, data });
    }
  }

  has(rel) { return this.index.has(rel); }
  /** Every winning path in the stack. For callers that match whole paths
   *  rather than a category prefix, e.g. the biome-colour files. */
  paths() { return this.index.keys(); }
  raw(rel) { return this.index.get(rel)?.data; }
  providerOf(rel) { return this.index.get(rel)?.pack; }

  text(rel) {
    const e = this.index.get(rel);
    return e ? stripBom(dec.decode(e.data)) : undefined;
  }

  json(rel) {
    const t = this.text(rel);
    if (t === undefined) return undefined;
    try { return JSON.parse(t); }
    catch (e) { throw new Error('Bad JSON in ' + rel + ' (from ' + this.providerOf(rel) + '): ' + e.message); }
  }

  /** Winning resource ids for `data/<ns>/<category>/**.json`, as Map<"ns:path", relPath>. */
  ids(category) {
    const out = new Map();
    const pre = category + '/';
    for (const rel of this.index.keys()) {
      const m = /^data\/([a-z0-9_.-]+)\/(.+)\.json$/.exec(rel);
      if (!m) continue;
      const [, ns, rest] = m;
      if (!rest.startsWith(pre)) continue;
      out.set(ns + ':' + rest.slice(pre.length), rel);
    }
    return out;
  }

  /** Every pack that supplied each id, low->high priority — for `inspect`. */
  contributors(category) {
    const byId = new Map();
    const pre = category + '/';
    for (const p of this.packs) {
      for (const rel of p.files.keys()) {
        const m = /^data\/([a-z0-9_.-]+)\/(.+)\.json$/.exec(rel);
        if (!m) continue;
        const [, ns, rest] = m;
        if (!rest.startsWith(pre)) continue;
        const id = ns + ':' + rest.slice(pre.length);
        if (!byId.has(id)) byId.set(id, []);
        byId.get(id).push(p.name);
      }
    }
    return byId;
  }
}

function stripBom(s) { return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s; }
