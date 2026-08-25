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

const blocks = (key: string, label: string, def: number, max = 20000): FieldSpec =>
  ({ key, kind: "blocks", label, def, min: 0, max, step: 50 });

const area = (key: string, label: string, def: number): FieldSpec =>
  ({ key, kind: "area", label, def, min: 0, step: 10000 });

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

/** Scorers the core knows. A score term is only offerable if its constraint is present. */
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
