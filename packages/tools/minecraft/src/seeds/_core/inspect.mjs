/**
 * inspect.mjs — "what does this pack actually do to worldgen, and can I
 * evaluate it faithfully?"
 *
 * This is the command to point at a new mod (Pixelmon, Lithostitched, anything
 * else) before trusting a single search result. It answers three questions:
 *
 *   1. Which worldgen files does each pack contribute or override?
 *   2. Does any of it use a density-function / noise type deepslate cannot
 *      evaluate? (a non-`minecraft:` type is an immediate correctness stop)
 *   3. Does it ship runtime worldgen *modifiers* — Lithostitched, NeoForge or
 *      Forge biome modifiers — which mutate worldgen after the JSON is read and
 *      are therefore INVISIBLE to any static evaluator, this one included?
 */
import { AUDIT_CATEGORIES, PackStack, WORLDGEN_CATEGORIES } from './packs.mjs';

/** Every density-function type deepslate 0.25 implements. */
export const KNOWN_DF_TYPES = new Set([
  'abs', 'add', 'beardifier', 'blend_alpha', 'blend_density', 'blend_offset', 'cache_2d',
  'cache_all_in_cell', 'cache_once', 'clamp', 'constant', 'cube', 'end_islands', 'flat_cache',
  'half_negative', 'interpolated', 'max', 'min', 'mul', 'noise', 'old_blended_noise',
  'quarter_negative', 'range_choice', 'shift', 'shift_a', 'shift_b', 'shifted_noise', 'slide',
  'spline', 'square', 'squeeze', 'weird_scaled_sampler', 'y_clamped_gradient',
]);

/** Types that appear only inside surface rules / block state providers, which
 *  we deliberately do not model — seeing them is not an error. */
const SURFACE_RULE_KEYS = new Set([
  'condition', 'block', 'sequence', 'biome', 'noise_threshold', 'stone_depth', 'vertical_gradient',
  'y_above', 'water', 'not', 'steep', 'hole', 'above_preliminary_surface', 'bandlands', 'temperature',
  'true', 'block_state', 'surface',
]);

/**
 * The trust gate. Takes packs already loaded in `audit` mode — `packFromZip`
 * with `{ mode: 'audit' }`, which keeps the structure/biome/modifier files the
 * evaluator itself discards precisely so this can see them.
 *
 * @param {Array<{name:string, files:Map<string,Uint8Array>}>} packs
 *        ordered low -> high priority
 */
export function inspectPacks(packs) {
  const stack = new PackStack(packs);

  const report = { packs: [], categories: {}, overrides: [], unknownTypes: [], runtimeModifiers: [], verdict: [] };

  for (const p of packs) {
    const cats = {};
    for (const rel of p.files.keys()) {
      const m = /^data\/[a-z0-9_.-]+\/(.+)\.json$/.exec(rel);
      if (!m) continue;
      const cat = WORLDGEN_CATEGORIES.concat(AUDIT_CATEGORIES).find(c => m[1].startsWith(c + '/'));
      if (cat) cats[cat] = (cats[cat] ?? 0) + 1;
    }
    report.packs.push({ name: p.name, kind: p.kind, source: p.source, files: p.files.size, categories: cats });
  }

  // 1. who overrides whom
  for (const cat of WORLDGEN_CATEGORIES) {
    const contrib = stack.contributors(cat);
    report.categories[cat] = contrib.size;
    for (const [id, from] of contrib) {
      if (from.length > 1) report.overrides.push({ category: cat, id, chain: from, winner: from[from.length - 1] });
    }
  }

  // 2. types deepslate cannot evaluate
  const seen = new Map();
  for (const cat of ['worldgen/density_function', 'worldgen/noise_settings']) {
    for (const [id, rel] of stack.ids(cat)) {
      let json;
      try { json = stack.json(rel); } catch (e) { report.unknownTypes.push({ id, type: 'PARSE ERROR', detail: e.message }); continue; }
      walkTypes(json, (t, inSurfaceRule) => {
        const bare = t.includes(':') ? t.split(':')[1] : t;
        const ns = t.includes(':') ? t.split(':')[0] : 'minecraft';
        if (inSurfaceRule || SURFACE_RULE_KEYS.has(bare)) return;
        if (ns !== 'minecraft' || !KNOWN_DF_TYPES.has(bare)) {
          const key = t + ' @ ' + cat;
          if (!seen.has(key)) { seen.set(key, true); report.unknownTypes.push({ id, type: t, category: cat, provider: stack.providerOf(rel) }); }
        }
      });
    }
  }

  // 3. runtime modifiers — the real blind spot
  for (const p of packs) {
    const mods = [];
    for (const rel of p.files.keys()) {
      if (/\/(lithostitched\/(worldgen_modifier|biome_modifier)|(neo)?forge\/biome_modifier)\//.test(rel)) mods.push(rel);
    }
    if (mods.length) {
      report.runtimeModifiers.push({ pack: p.name, count: mods.length, examples: mods.slice(0, 6) });
    }
  }

  // verdict
  if (report.unknownTypes.length) {
    report.verdict.push('STOP: ' + report.unknownTypes.length + ' worldgen type(s) deepslate cannot evaluate. Results would be wrong, not just imprecise.');
  }
  if (report.runtimeModifiers.length) {
    const total = report.runtimeModifiers.reduce((a, b) => a + b.count, 0);
    report.verdict.push('WARNING: ' + total + ' runtime worldgen modifier file(s). These mutate worldgen after the JSON is loaded and are invisible to a static evaluator — validate in-game before trusting results.');
  }
  if (!report.verdict.length) {
    report.verdict.push('OK: every worldgen file in this stack is plain JSON using types deepslate implements, and no runtime worldgen modifiers were found.');
  }
  return report;
}

/** Walk any JSON, reporting every "type" string, flagging surface-rule subtrees. */
function walkTypes(node, cb, inSurfaceRule = false) {
  if (Array.isArray(node)) { for (const v of node) walkTypes(v, cb, inSurfaceRule); return; }
  if (!node || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    const sr = inSurfaceRule || k === 'surface_rule' || k === 'then_run' || k === 'if_true';
    if (k === 'type' && typeof v === 'string') cb(v, sr);
    else walkTypes(v, cb, sr);
  }
}

export function formatInspect(r) {
  const L = [];
  L.push('PACKS');
  for (const p of r.packs) {
    L.push('  ' + p.name.padEnd(26) + p.kind.padEnd(8) + p.files + ' worldgen files');
    for (const [c, n] of Object.entries(p.categories)) L.push('      ' + String(n).padStart(5) + '  ' + c);
  }
  L.push('');
  L.push('OVERRIDES (' + r.overrides.length + ' files supplied by more than one pack)');
  for (const o of r.overrides.slice(0, 40)) {
    L.push('  ' + o.category.replace(/^worldgen\//, '').padEnd(38) + o.id.padEnd(46) + o.chain.join(' -> '));
  }
  if (r.overrides.length > 40) L.push('  ... and ' + (r.overrides.length - 40) + ' more');
  L.push('');
  L.push('UNEVALUABLE TYPES (' + r.unknownTypes.length + ')');
  for (const u of r.unknownTypes.slice(0, 30)) L.push('  ' + u.type + '   in ' + u.id + (u.provider ? '  [' + u.provider + ']' : ''));
  L.push('');
  L.push('RUNTIME WORLDGEN MODIFIERS (' + r.runtimeModifiers.length + ' pack(s))');
  for (const m of r.runtimeModifiers) {
    L.push('  ' + m.pack + ': ' + m.count + ' file(s)');
    for (const e of m.examples) L.push('      ' + e);
  }
  L.push('');
  L.push('VERDICT');
  for (const v of r.verdict) L.push('  ' + v);
  return L.join('\n');
}
