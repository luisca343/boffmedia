/**
 * vocabulary.ts — what the eleven constraint types look like as a form.
 *
 * This is the single description of the constraint vocabulary the UI is allowed
 * to hold. Every card, row and default reads from here, so adding a constraint
 * upstream means adding one entry rather than hunting through JSX.
 *
 * It deliberately describes *fields*, not widgets. A field says what it means
 * (blocks, blocks², a fraction, a biome selector) and the row decides how to
 * draw it — otherwise the vocabulary would start carrying layout opinions and
 * stop matching `_core/constraints.mjs`, which is the thing it has to track.
 *
 * The one rule encoded here that is not in the core: `landmass_area` offers no
 * `maximum`. The value it reports is a lower bound whenever the landmass runs
 * off the scan window (`TRUNCATED`), and the core silently fails such a test
 * rather than answering it. A field the user cannot use correctly should not
 * exist, so the form does not render one.
 */

/**
 * The four questions people actually arrive with: is there land and water where
 * I want it, is there room to build, are the right biomes nearby, and is the
 * ground flat enough.
 */
export const CONSTRAINT_GROUPS = ["water", "space", "biome", "relief"] as const;

export type ConstraintGroup = (typeof CONSTRAINT_GROUPS)[number];

/** A biome selector is a biome id (`minecraft:plains`) or a tag (`#minecraft:is_ocean`). */
export type FieldKind = "blocks" | "area" | "fraction" | "height" | "biomes" | "direction" | "location" | "flag";

export interface BandSpec {
  /** Soft-band lower threshold. Hard fail below min; score 1 at/beyond ideal. */
  min?: number;
  /** Soft-band lower ideal threshold. Linear interpolation between min and ideal. */
  ideal?: number;
  /** Soft-band upper ideal threshold. Linear interpolation between ideal_max and max. */
  ideal_max?: number;
  /** Soft-band upper threshold. Hard fail above max; score 1 at/below ideal_max. */
  max?: number;
}

export interface FieldSpec {
  /** Key in the emitted constraint JSON. Matches `_core/constraints.mjs`. */
  readonly key: string;
  readonly kind: FieldKind;
  /** Message key suffix under `spec.field.*`. */
  readonly label: string;
  readonly required?: boolean;
  readonly def?: number | string | boolean | string[];
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** Optional soft-band configuration for numeric constraints (blocks, area, height, fraction). */
  readonly band?: BandSpec;
}

export interface ConstraintSpec {
  readonly type: string;
  /** Message key suffix under `spec.constraint.*`. */
  readonly label: string;
  readonly fields: readonly FieldSpec[];
  /**
   * What the constraint's own `value` measures — which is NOT the first field's
   * unit. `biome_within` is configured with a biome list and reports a
   * *distance*; `island_feel` is configured with four numbers and reports a
   * water *fraction*. Formatting the verdict off the fields would print "0.35
   * blocks" and "600 blocks²" with equal confidence.
   */
  readonly valueKind: FieldKind | "count";
  /**
   * Which short list this appears in when adding a condition. Eleven types in
   * one dropdown is a list you read; four lists of three are lists you scan.
   */
  readonly group: ConstraintGroup;
  /** Safe inside the prefilter's small, height-free window. Mirrors `PREFILTER_SAFE`. */
  readonly prefilterSafe: boolean;
  /** Can be re-measured on a local fine grid for the winning site only. */
  readonly fineable?: boolean;
}

const blocks = (key: string, label: string, def: number, max = 20000, band?: BandSpec): FieldSpec =>
  ({ key, kind: "blocks", label, def, min: 0, max, step: 50, band });

const area = (key: string, label: string, def: number, band?: BandSpec): FieldSpec =>
  ({ key, kind: "area", label, def, min: 0, step: 10000, band });

export const CONSTRAINT_SPECS: readonly ConstraintSpec[] = [
  {
    type: "land_at",
    group: "water",
    valueKind: "blocks",
    label: "landAt",
    prefilterSafe: true,
    fields: [blocks("within", "within", 400, 5000)],
  },
  {
    type: "biome_within",
    group: "biome",
    valueKind: "blocks",
    label: "biomeWithin",
    prefilterSafe: true,
    fields: [
      { key: "biomes", kind: "biomes", label: "biomes", required: true, def: [] },
      { key: "within", kind: "blocks", label: "within", def: 600, min: 0, max: 20000, step: 50 },
      // Distinct from `biomes` on purpose: `biomes` is the family that must be
      // nearby, `require_any` is the specific one that must be present in it.
      // The example spec wants "an ocean, and specifically a warm one".
      { key: "require_any", kind: "biomes", label: "requireAny", def: [] },
    ],
  },
  {
    type: "buildable_area",
    group: "space",
    valueKind: "area",
    label: "buildableArea",
    prefilterSafe: true,
    fields: [blocks("radius", "radius", 1200, 10000), area("minimum", "minimum", 100000)],
  },
  {
    type: "coastline",
    group: "water",
    valueKind: "blocks",
    label: "coastline",
    prefilterSafe: true,
    fields: [blocks("radius", "radius", 1000, 10000), blocks("minimum", "minimum", 500, 100000)],
  },
  {
    type: "island_feel",
    group: "water",
    valueKind: "fraction",
    label: "islandFeel",
    prefilterSafe: true,
    fields: [
      blocks("radius", "radius", 800, 10000),
      { key: "min_water_fraction", kind: "fraction", label: "minWater", def: 0.35, min: 0, max: 1, step: 0.05 },
      { key: "max_water_fraction", kind: "fraction", label: "maxWater", def: 0.85, min: 0, max: 1, step: 0.05 },
      blocks("min_coastline", "minCoastline", 600, 100000),
    ],
  },
  {
    type: "landmass_area",
    group: "space",
    valueKind: "area",
    label: "landmassArea",
    prefilterSafe: false,
    // `minimum` only — see the file header. A maximum on a TRUNCATED lower
    // bound is unsound, and the core refuses it rather than guessing.
    fields: [area("minimum", "minimum", 1000000)],
  },
  {
    type: "large_connected_ocean",
    group: "water",
    valueKind: "area",
    label: "largeConnectedOcean",
    prefilterSafe: false,
    fields: [
      blocks("within", "within", 1200, 20000),
      area("minimum_area", "minimumArea", 25000000),
      { key: "direction_bias", kind: "direction", label: "directionBias", def: "" },
    ],
  },
  {
    type: "land_connected_to",
    group: "space",
    valueKind: "count",
    label: "landConnectedTo",
    prefilterSafe: false,
    fields: [{ key: "location", kind: "location", label: "location", required: true, def: "" }],
  },
  {
    type: "terrain_flatness",
    group: "relief",
    valueKind: "fraction",
    label: "terrainFlatness",
    prefilterSafe: false,
    fineable: true,
    fields: [
      blocks("radius", "radius", 400, 10000),
      // Blocks of rise per 16 blocks travelled — normalised by the core so the
      // number means the same on a 192-block coarse grid and a 16-block fine one.
      { key: "maximum", kind: "fraction", label: "maximumFlatness", def: 2.5, min: 0, max: 20, step: 0.1 },
      { key: "fine", kind: "flag", label: "fine", def: false },
    ],
  },
  {
    type: "distance_to_open_ocean",
    group: "water",
    valueKind: "blocks",
    label: "distanceToOpenOcean",
    prefilterSafe: false,
    fields: [blocks("minimum", "minimum", 0), blocks("maximum", "maximum", 4000)],
  },
  {
    type: "surface_height",
    group: "relief",
    valueKind: "height",
    label: "surfaceHeight",
    prefilterSafe: false,
    fields: [
      { key: "minimum", kind: "height", label: "minimum", def: 63, min: -64, max: 320, step: 1 },
      { key: "maximum", kind: "height", label: "maximum", def: 200, min: -64, max: 320, step: 1 },
    ],
  },
  // No `band` metadata on `minimum`: the engine reads these as plain numbers
  // (the hard floor), and bands live on SCORE terms, which the engine reads
  // via `c.band`. Band metadata here made the row render a band editor that
  // hid the real value and stored an object the engine compared as NaN — the
  // constraint then failed every candidate.
  {
    type: "separation",
    group: "space",
    valueKind: "blocks",
    label: "separation",
    prefilterSafe: false,
    fields: [blocks("minimum", "minimum", 750, 20000)],
  },
  {
    type: "distance_to",
    group: "space",
    valueKind: "blocks",
    label: "distanceTo",
    prefilterSafe: false,
    fields: [
      { key: "location", kind: "location", label: "location", required: true, def: "" },
      blocks("minimum", "minimum", 750, 20000),
    ],
  },
  {
    type: "reachability",
    group: "space",
    valueKind: "count",
    label: "reachability",
    prefilterSafe: false,
    fields: [
      { key: "location", kind: "location", label: "location", required: true, def: "" },
      { key: "ideal_detour", kind: "fraction", label: "idealDetour", def: 1.4, min: 1, max: 5, step: 0.1 },
      { key: "max_detour", kind: "fraction", label: "maxDetour", def: 2.5, min: 1, max: 5, step: 0.1 },
    ],
  },
  {
    type: "water_access",
    group: "water",
    valueKind: "blocks",
    label: "waterAccess",
    prefilterSafe: false,
    fineable: true,
    // `acceptable` is the field the engine actually reads (the previous
    // `ideal` field edited a key nothing consumed).
    fields: [blocks("acceptable", "acceptable", 800, 5000)],
  },
  {
    type: "corridor_lateral",
    group: "space",
    valueKind: "blocks",
    label: "corridorLateral",
    prefilterSafe: false,
    fields: [
      { key: "axis", kind: "direction", label: "axis", def: "north" },
      blocks("inner_band", "innerBand", 1500, 10000),
      blocks("outer_band", "outerBand", 5000, 20000),
    ],
  },
];

export const CONSTRAINT_BY_TYPE: ReadonlyMap<string, ConstraintSpec> = new Map(
  CONSTRAINT_SPECS.map((c) => [c.type, c]),
);

/** The vocabulary split into its four short lists, in declaration order. */
export const CONSTRAINTS_BY_GROUP: readonly {
  group: ConstraintGroup;
  items: readonly ConstraintSpec[];
}[] = CONSTRAINT_GROUPS.map((group) => ({
  group,
  items: CONSTRAINT_SPECS.filter((c) => c.group === group),
}));

export const DIRECTIONS = [
  "north", "south", "east", "west",
  "northeast", "northwest", "southeast", "southwest",
] as const;

export type Direction = (typeof DIRECTIONS)[number];

/**
 * Scorers the core knows. A score term is only offerable if its constraint is present.
 *
 * These are DEPRECATED in favor of soft-band specifications on individual fields.
 * Use bandFromReference() to convert a SCORER_REFERENCE value to an equivalent
 * BandSpec for backward compatibility with existing specs.
 */
export const SCORER_REFERENCE: Readonly<Record<string, number>> = {
  terrain_flatness: 4,
  coastline: 4000,
  buildable_area: 400000,
  island_feel: 1,
  large_connected_ocean: 50000000,
  distance_to_open_ocean: 4000,
  biome_within: 2000,
  land_at: 500,
  landmass_area: 4000000,
  surface_height: 1,
  land_connected_to: 1,
};

/**
 * Convert a SCORER_REFERENCE value to an equivalent soft-band spec.
 * For backward compatibility: treats reference as the "ideal" point.
 *
 * @param reference The SCORER_REFERENCE value (ideal distance/height/count)
 * @returns BandSpec with min=0, ideal=reference (achieves 1.0 score)
 */
export function bandFromReference(reference: number): BandSpec {
  return { min: 0, ideal: reference };
}
