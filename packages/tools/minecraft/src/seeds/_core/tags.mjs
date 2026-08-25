/**
 * tags.mjs — resolve `#minecraft:is_ocean`-style biome tags out of the stack.
 *
 * Tag files merge across packs unless a pack sets "replace": true, and entries
 * may themselves be "#other:tag" references, so resolution is recursive with
 * cycle protection.
 */
export class TagSet {
  /** @param {import('./packs.mjs').PackStack} stack @param {string} category e.g. 'worldgen/biome' */
  constructor(stack, category) {
    this.stack = stack;
    this.category = category;
    /** @type {Map<string, string[]>} raw entry lists, already pack-merged */
    this.raw = new Map();
    /** @type {Map<string, Set<string>>} */
    this.resolved = new Map();

    const prefix = 'tags/' + category;
    for (const p of stack.packs) {
      for (const [rel, data] of p.files) {
        const m = /^data\/([a-z0-9_.-]+)\/(.+)\.json$/.exec(rel);
        if (!m) continue;
        const [, ns, rest] = m;
        if (!rest.startsWith(prefix + '/')) continue;
        const id = ns + ':' + rest.slice(prefix.length + 1);
        let json;
        try { json = JSON.parse(new TextDecoder().decode(data)); } catch { continue; }
        const values = (json.values ?? []).map(v => (typeof v === 'string' ? v : v?.id)).filter(Boolean);
        if (json.replace || !this.raw.has(id)) this.raw.set(id, values.slice());
        else this.raw.get(id).push(...values);
      }
    }
  }

  has(tagId) { return this.raw.has(normalize(tagId)); }
  list() { return [...this.raw.keys()]; }

  /** @returns {Set<string>} fully expanded member ids */
  members(tagId, seen = new Set()) {
    const id = normalize(tagId);
    const cached = this.resolved.get(id);
    if (cached) return cached;
    if (seen.has(id)) return new Set();
    seen.add(id);

    const out = new Set();
    for (const v of this.raw.get(id) ?? []) {
      if (v.startsWith('#')) for (const m of this.members(v.slice(1), seen)) out.add(m);
      else out.add(v.includes(':') ? v : 'minecraft:' + v);
    }
    if (seen.size === 1) this.resolved.set(id, out);
    return out;
  }

  /**
   * Match a biome id against a selector list. Entries starting with '#' are
   * tags; everything else is a literal biome id.
   * @param {string} biomeId @param {string[]} selectors
   */
  matches(biomeId, selectors) {
    for (const s of selectors) {
      if (s.startsWith('#')) { if (this.members(s.slice(1)).has(biomeId)) return true; }
      else if (normalize(s) === biomeId) return true;
    }
    return false;
  }

  /** Precompute a membership set for a selector list — hot-loop friendly. */
  compile(selectors) {
    const set = new Set();
    let unresolved = [];
    for (const s of selectors) {
      if (s.startsWith('#')) {
        const m = this.members(s.slice(1));
        if (!m.size) unresolved.push(s);
        for (const b of m) set.add(b);
      } else set.add(normalize(s));
    }
    return { set, unresolved };
  }
}

function normalize(id) { return id.includes(':') ? id : 'minecraft:' + id; }
