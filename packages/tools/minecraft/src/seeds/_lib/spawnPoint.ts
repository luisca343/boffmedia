/**
 * spawnPoint.ts — where the game would put you.
 *
 * A port of Minecraft's overworld spawn search, following
 * jacobsjo/mc-datapack-map's `SpawnTarget` (MIT), which is itself a
 * transcription of `MultiNoiseBiomeSource.findSpawnPosition` /
 * `ChunkGenerator.findSpawnPosition`.
 *
 * The target climate is not invented: `spawn_target` is a real field in the
 * overworld noise settings, so a datapack that moves it moves the spawn here
 * too. That is the whole reason this is worth porting rather than drawing a pin
 * at (0, 0) — with Terralith and Continents loaded, (0, 0) is very often ocean
 * and the actual spawn is somewhere else entirely.
 *
 * ## What this is not
 *
 * It finds the *column* the game aims at, not the block you stand on. Minecraft
 * then walks that column for a valid surface and can move you a few hundred
 * blocks if it fails. It also does not model `/setworldspawn`, spawn radius, or
 * anything a mod does after worldgen. Treat the marker as "the game aims here",
 * and note it inherits the same unvalidated-against-the-real-game caveat as
 * every other number this tool produces.
 */

import { Climate, Json } from "deepslate";

/**
 * 1.21.1 uses the legacy, origin-biased fitness. Later versions switched to a
 * pure best-climate search, and mixing them up moves the answer by thousands of
 * blocks — so this is pinned to the version we actually ship, not left to a
 * default.
 */
export type SpawnAlgorithm = "legacy_zero_biased" | "best_climate";

export interface SpawnResult {
  readonly x: number;
  readonly z: number;
  /** Lower is better. Reported so a caller can tell a good match from a shrug. */
  readonly fitness: number;
  readonly ms: number;
}

/**
 * @param spawnTargetJson the `spawn_target` array from the noise settings
 * @param sampler the seed's climate sampler
 */
export function findSpawn(
  spawnTargetJson: unknown,
  sampler: Climate.Sampler,
  algorithm: SpawnAlgorithm = "legacy_zero_biased",
): SpawnResult | null {
  const points = Json.readArray(spawnTargetJson, Climate.ParamPoint.fromJson) ?? [];
  if (!points.length) return null;

  const t0 = performance.now();

  const fitnessAt = (x: number, z: number): number => {
    const climate = sampler.sample(x >> 2, 0, z >> 2);
    // Depth is forced to 0 — the search is over the *surface* climate, and
    // sampling at the column's real depth would score the caves under it.
    const surface = Climate.target(
      climate.temperature,
      climate.humidity,
      climate.continentalness,
      climate.erosion,
      0,
      climate.weirdness,
    );
    const climateFitness = Math.min(...points.map((p) => p.fittness(surface)));

    if (algorithm === "legacy_zero_biased") {
      // The bias that makes vanilla spawns cluster near the origin: distance
      // costs, quartically, on a 2500-block scale.
      const distance = ((x * x + z * z) / (2500 * 2500)) ** 2;
      return distance + climateFitness;
    }
    return x * x + z * z + 2048 * 2048 * Math.floor(10000 * 10000 * climateFitness);
  };

  let best: [number, number] = [0, 0];
  let bestFitness = fitnessAt(0, 0);

  /** Spiral outward, keeping the best column seen. */
  const radialSearch = (maxRadius: number, radiusStep: number, centerX: number, centerZ: number): void => {
    let angle = 0;
    let radius = radiusStep;

    while (radius <= maxRadius) {
      const x = centerX + Math.floor(Math.sin(angle) * radius);
      const z = centerZ + Math.floor(Math.cos(angle) * radius);
      const fitness = fitnessAt(x, z);
      if (fitness < bestFitness) {
        best = [x, z];
        bestFitness = fitness;
      }

      // Constant arc length, so every ring is sampled at the same spacing
      // rather than the outer ones being sampled more densely.
      angle += radiusStep / radius;
      if (angle > Math.PI * 2) {
        angle = 0;
        radius += radiusStep;
      }
    }
  };

  // Coarse sweep for the region, then a fine sweep around whatever it found.
  radialSearch(2048, 512, 0, 0);
  radialSearch(512, 32, best[0], best[1]);

  return { x: best[0], z: best[1], fitness: bestFitness, ms: performance.now() - t0 };
}
