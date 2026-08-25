/**
 * registry.mjs — turn a PackStack into deepslate's global worldgen registries
 * plus everything the evaluator needs to build a per-seed sampler.
 *
 * deepslate's registries are process-global singletons, so ONE PackStack per
 * process (or per worker thread). That is fine: search workers each own a world.
 */
import {
  BiomeSource, DensityFunction, Holder, Identifier, NoiseGeneratorSettings,
  NoiseParameters, WorldgenRegistries,
} from 'deepslate';

const dec = new TextDecoder();

/** Evaluate fabric:load_conditions / neoforge:conditions against a mod set. */
export function conditionsPass(json, mods) {
  const has = (id) => mods.has(id);
  const fabric = (c) => {
    if (!c) return true;
    switch (c.condition) {
      case 'fabric:not': return !fabric(c.value);
      case 'fabric:and': return c.values.every(fabric);
      case 'fabric:or': return c.values.some(fabric);
      case 'fabric:all_mods_loaded': return c.values.every(has);
      case 'fabric:any_mods_loaded': return c.values.some(has);
      default: return true; // unknown condition: never silently drop the file
    }
  };
  const neo = (c) => {
    if (!c) return true;
    switch (c.type) {
      case 'neoforge:not': case 'forge:not': return !neo(c.value);
      case 'neoforge:and': case 'forge:and': return c.values.every(neo);
      case 'neoforge:or': case 'forge:or': return c.values.some(neo);
      case 'neoforge:mod_loaded': case 'forge:mod_loaded': return has(c.modid);
      case 'neoforge:true': case 'forge:true': return true;
      case 'neoforge:false': case 'forge:false': return false;
      default: return true;
    }
  };
  if (json['fabric:load_conditions'] !== undefined) return fabric(json['fabric:load_conditions']);
  if (Array.isArray(json['neoforge:conditions'])) return json['neoforge:conditions'].every(neo);
  if (Array.isArray(json['forge:conditions'])) return json['forge:conditions'].every(neo);
  return true;
}

const relOf = (id, category) => {
  const [ns, p] = id.includes(':') ? id.split(':') : ['minecraft', id];
  return 'data/' + ns + '/' + category + '/' + p + '.json';
};

/** Highest-priority pack entry whose load conditions pass. */
function resolveConditional(stack, rel, mods, notes) {
  for (let i = stack.packs.length - 1; i >= 0; i--) {
    const p = stack.packs[i];
    const raw = p.files.get(rel);
    if (!raw) continue;
    const json = JSON.parse(dec.decode(raw));
    if (conditionsPass(json, mods)) return { json, pack: p.name };
    notes?.push(rel + ': skipped copy from "' + p.name + '" (load conditions not met for mods [' + [...mods].join(', ') + '])');
  }
  return undefined;
}

/**
 * @param {import('./packs.mjs').PackStack} stack
 * @param {{dimension?:string, mods?:string[]}} opts
 */
export function buildWorld(stack, opts = {}) {
  const dimension = opts.dimension ?? 'minecraft:overworld';
  const mods = new Set(opts.mods ?? []);
  const notes = [];
  const stats = {};

  /* ---- 1. noise parameters ---------------------------------------------- */
  WorldgenRegistries.NOISE.clear();
  const noiseIds = stack.ids('worldgen/noise');
  for (const [id, rel] of noiseIds) {
    WorldgenRegistries.NOISE.register(Identifier.parse(id), NoiseParameters.fromJson(stack.json(rel)));
  }
  stats.noise = noiseIds.size;

  /* ---- 2. density functions --------------------------------------------- */
  WorldgenRegistries.DENSITY_FUNCTION.clear();
  const dfIds = stack.ids('worldgen/density_function');
  const dfParse = Holder.parser(WorldgenRegistries.DENSITY_FUNCTION, DensityFunction.fromJson);
  for (const [id, rel] of dfIds) {
    WorldgenRegistries.DENSITY_FUNCTION.register(
      Identifier.parse(id), new DensityFunction.HolderHolder(dfParse(stack.json(rel))));
  }
  stats.densityFunction = dfIds.size;

  /* ---- 3. dimension + noise settings ------------------------------------ */
  const dimRel = relOf(dimension, 'dimension');
  const dim = resolveConditional(stack, dimRel, mods, notes);
  if (!dim) throw new Error('No applicable ' + dimRel + ' in the pack stack');

  const settingsId = typeof dim.json.generator?.settings === 'string'
    ? dim.json.generator.settings : dimension;
  const settingsRel = relOf(settingsId, 'worldgen/noise_settings');
  const settingsEntry = resolveConditional(stack, settingsRel, mods, notes);
  if (!settingsEntry) throw new Error('No applicable ' + settingsRel + ' in the pack stack');
  const settingsJson = settingsEntry.json;
  const settings = NoiseGeneratorSettings.fromJson(settingsJson);

  /* ---- 4. biome parameter list ------------------------------------------ */
  const biomeList = resolveBiomeList(stack, dim, dimension, mods, notes);
  const biomeSource = BiomeSource.fromJson({ type: 'minecraft:multi_noise', biomes: biomeList.entries });

  /* ---- 5. the surface-level density function -----------------------------
   * deepslate 0.25 reads `preliminary_surface_level` from the router JSON, but
   * the real field is `initial_density_without_jaggedness`, so
   * randomState.router.preliminarySurfaceLevel is a dud. Build it ourselves and
   * push it through RandomState's visitor at seed time (see evaluator.mjs).   */
  const initialDensityJson = settingsJson.noise_router?.initial_density_without_jaggedness;
  if (initialDensityJson === undefined) {
    notes.push('noise_router.initial_density_without_jaggedness missing — surface height falls back to final_density scanning (slow).');
  }

  return {
    dimension, settings, settingsJson, initialDensityJson, biomeSource, biomeList,
    seaLevel: settings.seaLevel,
    noiseShape: settings.noise,
    provenance: {
      dimension: dim.pack,
      noiseSettings: settingsEntry.pack,
      biomeList: biomeList.source,
      biomeListPack: biomeList.packs[0],
    },
    stats, notes,
  };
}

/**
 * Terralith 2.6.x ships the overworld biome list twice: a standalone
 * `dimension/overworld.json` (used when Lithostitched is absent) and a
 * `multi_noise_biome_source_parameter_list` carrying `lithostitched:biomes`
 * (used when it is present). Resolve whichever the game would use, and
 * cross-check the other so a divergence can never pass silently.
 */
function resolveBiomeList(stack, dim, dimension, mods, notes) {
  const direct = dim.json.generator?.biome_source;
  const candidates = [];

  // (a) parameter-list route — what Lithostitched-style mods hook.
  const presetId = typeof direct?.preset === 'string' ? direct.preset : dimension;
  const rel = relOf(presetId, 'worldgen/multi_noise_biome_source_parameter_list');
  const e = resolveConditional(stack, rel, mods, notes);
  if (e) {
    const entries = e.json['lithostitched:biomes'] ?? e.json.biomes;
    if (Array.isArray(entries) && entries.length) {
      candidates.push({ source: 'parameter_list:' + presetId, entries, packs: [e.pack] });
    }
  }

  // (b) explicit list on the applicable dimension file.
  if (Array.isArray(direct?.biomes) && direct.biomes.length) {
    candidates.push({ source: 'dimension:' + dimension, entries: direct.biomes, packs: [dim.pack] });
  }

  if (!candidates.length) throw new Error('Could not resolve a multi-noise biome parameter list');
  const chosen = candidates[0];

  // (c) cross-check every dimension copy in the stack, applicable or not.
  const key = (x) => JSON.stringify([x.biome, x.parameters]);
  const chosenSet = new Set(chosen.entries.map(key));
  for (const p of stack.packs) {
    const raw = p.files.get(relOf(dimension, 'dimension'));
    if (!raw) continue;
    const b = JSON.parse(dec.decode(raw)).generator?.biome_source?.biomes;
    if (!Array.isArray(b) || !b.length) continue;
    if (p.name === chosen.packs[0] && chosen.source.startsWith('dimension:')) continue;
    const agrees = b.length === chosen.entries.length && b.every(x => chosenSet.has(key(x)));
    if (agrees) {
      notes.push('biome list cross-check: "' + p.name + '" dimension copy AGREES with ' + chosen.source + ' (' + chosen.entries.length + ' entries)');
    } else if (p.name !== 'vanilla') {
      notes.push('biome list cross-check: "' + p.name + '" dimension copy DIFFERS from ' + chosen.source +
        ' (' + b.length + ' vs ' + chosen.entries.length + ' entries) — verify which route the game actually uses');
    }
  }

  const biomeIds = new Set(chosen.entries.map(x => x.biome));
  return { ...chosen, count: chosen.entries.length, biomeCount: biomeIds.size, biomeIds };
}
