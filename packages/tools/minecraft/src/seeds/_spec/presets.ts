/**
 * presets.ts — the two specs a first-time visitor can start from (D11).
 *
 * A preset is not a convenience here, it is the documentation. The constraint
 * vocabulary is eleven types deep and a blank editor teaches none of it, so the
 * opening state is a spec that already means something and can be taken apart.
 *
 * They are written in the *core* shape, not the editor's, so they read exactly
 * like `specs/example.json` and can be diffed against it. `fromCoreSpec` turns
 * them into cards.
 *
 * Two, deliberately:
 *
 * - `oceanSpawn` is the teaching one. Two constraints, one location, a
 *   prefilter that rejects most seeds for almost nothing — it is also the only
 *   preset whose search is fast enough to feel interactive.
 * - `islandAndCities` is `specs/example.json`, retuned: the towns' flatness
 *   pass is gone, every settlement is pinned near the central north–south axis,
 *   and the capitals must have sea close enough to hold a port. It is the
 *   showcase *and* the honest example — four locations, a soft town, and enough
 *   work per seed to show what a demanding spec costs, which is the number the
 *   search panel then has to be truthful about.
 */

import { TERAS_SPEC } from "./teras";

export interface PresetDefinition {
  readonly id: string;
  /** Message key suffix under `spec.preset.*`. */
  readonly label: string;
  readonly spec: Record<string, unknown>;
}

/** Land at spawn with an ocean beside it. Two constraints, nothing else. */
const oceanSpawn: Record<string, unknown> = {
  origin: { x: 0, z: 0 },
  scan: {
    radius: 3072, // 24 x 128: whole cells, so the origin is a sample point
    coarse_step: 128,
    fine_step: 16,
    water_mode: "auto",
    prefilter: { radius: 1000, step: 64, water_mode: "biome", locations: ["Spawn"] },
  },
  locations: {
    Spawn: {
      hard: true,
      at: { x: 0, z: 0, tolerance: 600 },
      constraints: [
        { type: "land_at", within: 300 },
        // An ocean, not specifically a warm one: `require_any` narrowed this to
        // a biome most seeds have nowhere near spawn, which made the teaching
        // preset reject almost everything before it had taught anything.
        { type: "biome_within", biomes: ["#minecraft:is_ocean"], within: 800 },
      ],
      score: [{ type: "biome_within", weight: 1, reference: 800 }],
    },
  },
};

/**
 * `specs/example.json`, minus the `world` block the browser derives, and
 * retuned around one idea: **a chain of settlements down the x = 0 meridian.**
 *
 * `x_range` is what enforces that, and it is worth knowing exactly what it
 * means: it is a *perpendicular* offset from the origin, applied to the
 * candidate grid before anything is measured. For a north or south location
 * that is a world-X offset, so `[-500, 500]` is "within 500 blocks of the
 * central axis". Absent, the core spreads candidates ±2000.
 *
 * Pinning it this tightly is also a cost decision, and a favourable one: three
 * lateral columns instead of seventeen means ~15 candidate sites per city
 * rather than ~85, so each seed's evaluation gets cheaper as the spec gets
 * fussier.
 */
const AXIS_BAND: [number, number] = [-500, 500];

/**
 * How close the sea must come to a capital for it to be a port. 400 blocks at a
 * 192-block coarse step is two cells — close enough that the water is at the
 * town rather than merely in the same region, which is what `within: 1200`
 * (nearly a kilometre away) actually meant.
 */
const PORT_REACH = 400;

const islandAndCities: Record<string, unknown> = {
  origin: { x: 0, z: 0 },
  scan: {
    radius: 12096, // 63 x 192: whole cells, so the origin is a sample point
    coarse_step: 192,
    fine_step: 16,
    water_mode: "auto",
    // No prefilter, for the reason spelled out in `teras.ts`: this Spawn also
    // leans on `island_feel`, and that is the one condition a sea-level
    // reading gets wrong. Measured over 80 seeds it rejected 26 and 19 of
    // those passed Spawn in the full pass — 26.4% of the hits, for a filter
    // worth about 8% of the time. The conditions that survive sea level
    // (`land_at`, `biome_within`) reject nothing here at all.
  },
  locations: {
    Spawn: {
      hard: true,
      // 500, not 800: the cities may sit 500 blocks off the axis, and a spawn
      // allowed to wander further than they can is not on the same line.
      at: { x: 0, z: 0, tolerance: 500 },
      constraints: [
        { type: "land_at", within: 400 },
        { type: "biome_within", biomes: ["#minecraft:is_ocean"], within: 600 },
        // Coastline density rather than a landmass cap: spawn feels ringed by
        // water, but a land bridge to the cities stays legal.
        {
          type: "island_feel",
          radius: 800,
          min_water_fraction: 0.35,
          max_water_fraction: 0.85,
          min_coastline: 600,
        },
      ],
      score: [
        { type: "island_feel", weight: 0.6 },
        { type: "biome_within", weight: 0.4, reference: 600 },
      ],
    },
    Narukami: {
      hard: true,
      discover: { direction: "north", distance: { min: 5000, max: 7000 }, x_range: AXIS_BAND, step: 500 },
      constraints: [
        { type: "buildable_area", radius: 1200, minimum: 100000 },
        { type: "coastline", radius: 1000, minimum: 500 },
        // The port: a real ocean, reaching the town itself, and lying outward
        // rather than back toward spawn.
        {
          type: "large_connected_ocean",
          within: PORT_REACH,
          minimum_area: 25000000,
          direction_bias: "north",
        },
      ],
      score: [
        { type: "coastline", weight: 0.3, reference: 4000 },
        { type: "buildable_area", weight: 0.7, reference: 400000 },
      ],
    },
    Gansolia: {
      hard: true,
      discover: { direction: "south", distance: { min: 5000, max: 7000 }, x_range: AXIS_BAND, step: 500 },
      constraints: [
        { type: "buildable_area", radius: 1200, minimum: 100000 },
        { type: "coastline", radius: 1000, minimum: 500 },
        {
          type: "large_connected_ocean",
          within: PORT_REACH,
          minimum_area: 25000000,
          direction_bias: "south",
        },
      ],
      score: [
        { type: "coastline", weight: 0.3, reference: 4000 },
        { type: "buildable_area", weight: 0.7, reference: 400000 },
      ],
    },
    "Pueblo Tulipán": {
      hard: false,
      weight: 0.4,
      // Moved off the northwest diagonal and onto the same meridian, in the gap
      // between spawn and the north capital, so the four sites read as one
      // chain rather than three points and an outlier.
      discover: {
        direction: "north",
        distance: { min: 2000, max: 4500 },
        x_range: AXIS_BAND,
        step: 500,
      },
      constraints: [
        { type: "biome_within", biomes: ["#minecraft:is_forest"], within: 500 },
        { type: "buildable_area", radius: 800, minimum: 40000 },
      ],
      score: [
        { type: "biome_within", weight: 0.6, reference: 500 },
        { type: "buildable_area", weight: 0.4, reference: 150000 },
      ],
    },
  },
};

export const PRESETS: readonly PresetDefinition[] = [
  { id: "ocean-spawn", label: "oceanSpawn", spec: oceanSpawn },
  { id: "island-and-cities", label: "islandAndCities", spec: islandAndCities },
  { id: "teras", label: "teras", spec: TERAS_SPEC },
];

export const DEFAULT_PRESET = PRESETS[0]!;
