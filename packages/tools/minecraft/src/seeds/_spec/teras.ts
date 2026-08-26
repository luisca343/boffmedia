/**
 * teras.ts — the Teras world: eighteen settlements, one per Pokémon type.
 *
 * Teras is the Tera-type world: every pueblo IS one of the eighteen types, most
 * of them named after the type in Japanese (Mizu=Water, Denki=Electric,
 * Doku=Poison, Tsuchi=Ground, Iwa=Rock, Hagane=Steel, …). The biome families
 * below are chosen for the TYPE's look, not for the town's old description —
 * the type map itself is owner-fixed and must not be re-derived from the names
 * (Gaku=Psychic, Olivo=Normal and Yume=Dark all differ from the naive reading).
 *
 * Every selector was checked against the bundles this tool actually ships
 * (`vanilla-1.21.1`, `terralith-2.6.2`): a biome id that is not in the stack
 * makes `biome_within` report *"no biome in the scan window matches"* for every
 * seed, which is indistinguishable from a rejected seed.
 *
 * ## Selector lists are DISJOINT on purpose
 *
 * Two towns sharing a biome would compete for the same ground against the
 * `separation` constraint, so each biome id appears in exactly one list. That
 * is why family tags are mostly avoided here: `#minecraft:is_forest` carries
 * `dark_forest` (Yume's), `#terralith:reference/forest` carries the lavender,
 * sakura and moonlight groves (Lavanda's, Sakura's, Yume's), `#c:is_snowy`
 * would carry `snowy_cherry_grove` both ways. Where a tag is safe it is used;
 * everywhere else the ids are spelled out. `snowy_cherry_grove` is ceded to
 * Ice (Shiroi), `granite_cliffs` to Steel (Hagane), `frozen_peaks` to Ice.
 */

/* -------------------------------------------------------------- selectors -- */

/** Grass (Tulipán): lush green forest, flowers. No dark_forest (Dark's). */
const GRASS = [
  "minecraft:forest",
  "minecraft:birch_forest",
  "minecraft:flower_forest",
  "minecraft:old_growth_birch_forest",
  "terralith:blooming_valley",
  "terralith:blooming_plateau",
  "terralith:lush_valley",
  "terralith:forested_highlands",
];

/** Ground (Tsuchi): earth, canyons, badlands. Explicit — `#minecraft:is_badlands`
 * would drag in `red_oasis` (Fire's) and `painted_mountains` (Electric's). */
const GROUND = [
  "minecraft:badlands",
  "minecraft:wooded_badlands",
  "minecraft:eroded_badlands",
  "terralith:bryce_canyon",
  "terralith:sandstone_valley",
  "terralith:white_mesa",
  "terralith:warped_mesa",
  "terralith:ancient_sands",
];

/** Fire (Oasis): the red-hot desert with its oasis — the name wins over
 * volcanic drama, per the owner. */
const FIRE = [
  "terralith:red_oasis",
  "terralith:desert_oasis",
  "minecraft:desert",
  "terralith:desert_spires",
];

/** Rock (Iwa): bare stone heights. `frozen_peaks`→Ice, `granite_cliffs`→Steel. */
const ROCK = [
  "minecraft:stony_peaks",
  "minecraft:jagged_peaks",
  "terralith:rocky_mountains",
  "terralith:stony_spires",
  "terralith:yosemite_cliffs",
];

/** Poison (Doku): swamps. */
const POISON = ["minecraft:swamp", "minecraft:mangrove_swamp", "terralith:orchid_swamp"];

/** Ice (Shiroi): frozen world, ice spikes to glacial chasms. */
const ICE = [
  "minecraft:snowy_plains",
  "minecraft:snowy_taiga",
  "minecraft:snowy_slopes",
  "minecraft:ice_spikes",
  "minecraft:frozen_peaks",
  "minecraft:frozen_river",
  "minecraft:snowy_beach",
  "terralith:glacial_chasm",
  "terralith:frozen_cliffs",
  "terralith:snowy_shield",
  "terralith:wintry_forest",
  "terralith:wintry_lowlands",
  "terralith:siberian_taiga",
  "terralith:siberian_grove",
  "terralith:alpine_grove",
  "terralith:snowy_cherry_grove",
  "terralith:snowy_maple_forest",
];

/** Dark (Yume — dream turned nightmare): gloom and moonlight. */
const DARK = ["minecraft:dark_forest", "terralith:moonlight_grove", "terralith:moonlight_valley"];

/** Electric (Denki): the yellow biomes this stack actually has. */
const ELECTRIC = ["terralith:yellowstone", "terralith:painted_mountains"];

/** Normal (Olivo): ordinary, pleasant countryside. */
const NORMAL = [
  "minecraft:plains",
  "minecraft:sunflower_plains",
  "minecraft:meadow",
  "terralith:valley_clearing",
  "terralith:shield_clearing",
];

/** Fighting (Senshi): rugged savanna training grounds. Explicit — the merged
 * savanna tags would drag in `ashen_savanna` (Steel's). */
const FIGHTING = [
  "minecraft:savanna",
  "minecraft:savanna_plateau",
  "minecraft:windswept_savanna",
  "terralith:fractured_savanna",
  "terralith:savanna_slopes",
];

/** Bug (Kinoko — mushroom): fungus and dense jungle. */
const BUG = [
  "minecraft:mushroom_fields",
  "minecraft:jungle",
  "minecraft:bamboo_jungle",
  "minecraft:sparse_jungle",
  "terralith:tropical_jungle",
];

/** Flying (Takai — high): wind-swept heights and cloud forest. Skylands are
 * deliberately excluded: floating islands over void are no town ground. */
const FLYING = [
  "terralith:cloud_forest",
  "terralith:haze_mountain",
  "terralith:windswept_spires",
  "terralith:alpine_highlands",
  "minecraft:windswept_hills",
  "minecraft:windswept_forest",
];

/** Fairy (Sakura): cherry blossom. `snowy_cherry_grove` ceded to Ice. */
const FAIRY = ["terralith:sakura_grove", "terralith:sakura_valley", "minecraft:cherry_grove"];

/** Steel (Hagane): grey, metallic ground and wood. */
const STEEL = [
  "terralith:basalt_cliffs",
  "terralith:granite_cliffs",
  "terralith:ashen_savanna",
  "minecraft:windswept_gravelly_hills",
  "terralith:gravel_desert",
];

/** Dragon (Dento): the crystal hoard — amethyst and emerald heights, plus the
 * scarlet peaks (unclaimed by any other town; a dragon's mountain if anything
 * in the stack is). Added because Dento's corridor held a matching biome in
 * only 6 of 10 measured seeds — the thinnest list after Gaku's. */
const DRAGON = [
  "terralith:amethyst_canyon",
  "terralith:amethyst_rainforest",
  "terralith:emerald_peaks",
  "terralith:scarlet_mountains",
];

/** Psychic (Gaku): the one truly surreal biome in the stack. */
const PSYCHIC = ["terralith:mirage_isles"];

/** Water (Mizu): the harbour town stands in the sea itself. */
const OCEAN = ["#minecraft:is_ocean"];

/** Ghost (Lavanda): Lavender Town. */
const GHOST = ["terralith:lavender_forest", "terralith:lavender_valley"];

/* -------------------------------------------------------------- geometry --- */

/**
 * The sampling grid's step, repeated here because every distance below must be
 * a multiple of it: `nearestBiome` reads the cell nearest the candidate, but
 * the site reported to the user is the candidate itself. Off-lattice those are
 * two different places up to ~136 blocks apart — measured, that was Tulipán
 * passing a forest test while standing on snowy plains.
 */
const GRID_STEP = 192;

/** Round to whole cells, so a candidate lands exactly on a sample point. */
const cells = (n: number) => Math.round(n / GRID_STEP) * GRID_STEP;

/**
 * Towns stay inside the ring the capitals occupy: capitals are discovered
 * between 5000 and 7000, so every town is *before* its capital on the way out.
 * The lateral band equals the forward reach so "north" stays honest (a strip
 * wider than deep placed towns 8000 east that nobody would call northern).
 */
const TOWN_REACH = 5000;
const TOWN_STEP = cells(600); // 576

const half = (direction: "north" | "south") => ({
  direction,
  distance: { min: TOWN_STEP, max: cells(TOWN_REACH) },
  x_range: [-cells(TOWN_REACH), cells(TOWN_REACH)],
  step: TOWN_STEP,
});

/**
 * The town must sit ON its biome, not merely near it. `within: 0` restricts the
 * check to the candidate's own cell — measured, `within: 800` placed 91% of
 * towns but only 48% actually stood in their biome.
 */
const inBiome = (biomes: string[], within = 0) => ({ type: "biome_within", biomes, within });

/* --------------------------------------------------------- placement kit --- */

/**
 * Every pueblo carries the same placement-quality kit on top of its biome:
 *
 *   separation       ≥750 to every already-placed settlement (hard floor for
 *                    THIS candidate — a closer site loses to a farther one),
 *                    full score from 1500 up. The control run measured the old
 *                    engine putting settlements on IDENTICAL coordinates
 *                    (minPairwiseSeparation p50 = 0); this is the cure.
 *   distance_to      ≥750 from the RESOLVED Spawn (not the origin), ideal 1500+.
 *   reachability     the town must share a landmass with its hemisphere capital
 *                    and the walk there must not detour beyond 2.5× the straight
 *                    line (full score ≤1.4×).
 *   water_access     a river, lake or coast within 800 blocks — settlements
 *                    exist because of water. Graded, closer is better.
 *   corridor_lateral graded pull toward the spawn→capital axis: full score
 *                    within ±1536, fading to the ±4992 band edge. Never rejects.
 *   buildable_area   a settle-able footprint. Rough-terrain types (mountain,
 *                    mesa, cliffs, peaks) tolerate half the footprint of the
 *                    lowland ones; the harbour has none.
 *
 * All of it is SOFT in the seed sense — a pueblo can only lower the score —
 * but each constraint's floor steers which candidate the pueblo takes, which
 * is what makes the placement logical instead of first-hit-wins.
 */
const SEP = { type: "separation", minimum: 750 };
const NEAR_SPAWN = { type: "distance_to", location: "Spawn", minimum: 750 };
const reach = (capital: string) => ({ type: "reachability", location: capital, max_detour: 2.5 });
const WATER = { type: "water_access", acceptable: 800 };
const corridor = (axis: "north" | "south") => ({
  type: "corridor_lateral",
  axis,
  inner_band: cells(1500), // 1536
  outer_band: cells(TOWN_REACH), // 4992
});
const footprint = (minimum: number) => ({ type: "buildable_area", radius: 800, minimum });

/** The shared score kit: what "well placed" means, weighted. */
const townScore = () => [
  { type: "biome_within", weight: 0.4, reference: 400 },
  { type: "separation", weight: 0.2, band: { min: 750, ideal: 1500 } },
  { type: "distance_to", weight: 0.1, band: { min: 750, ideal: 1500 } },
  { type: "water_access", weight: 0.1, acceptable: 800 },
  { type: "corridor_lateral", weight: 0.1, inner_band: cells(1500), outer_band: cells(TOWN_REACH) },
  { type: "reachability", weight: 0.1 },
];

/**
 * A pueblo: soft, weight 1 (no pueblo outranks another), biome identity hard
 * within its own placement, full placement kit.
 * `ground` is the buildable_area floor — 40000 for lowland types, 20000 for
 * rough-terrain ones (Rock, Flying, Dragon, Steel, Ground).
 */
function town(
  direction: "north" | "south",
  capital: string,
  biomes: string[],
  ground: number,
  extra: Record<string, unknown>[] = [],
) {
  return {
    hard: false,
    weight: 1,
    discover: half(direction),
    constraints: [
      inBiome(biomes),
      SEP,
      NEAR_SPAWN,
      reach(capital),
      WATER,
      corridor(direction),
      footprint(ground),
      ...extra,
    ],
    score: townScore(),
  };
}

/* ------------------------------------------------------------------ spec -- */

export const TERAS_SPEC: Record<string, unknown> = {
  origin: { x: 0, z: 0 },
  scan: {
    radius: 12096, // 63 × 192 — whole cells, so the origin is a sample point
    coarse_step: 192,
    fine_step: 16,
    water_mode: "auto",
    /**
     * Placement engine flags (absent = legacy behaviour, so old specs are
     * untouched): soft locations resolve rarest-biome-first, so the towns with
     * two or three matching biomes in the whole stack claim their ground before
     * Plains-class towns that fit anywhere; and the best 3 coarse candidates
     * are carried into the fine phase instead of only the single winner.
     */
    resolution_order: "rarity",
    fine_top_k: 3,
    /**
     * Placement v2.1 (audit follow-up, both flag-gated so old specs keep bit
     * parity):
     * - score_gating: an unplaced town contributes 0 to the seed score — the
     *   aggregate finally rewards towns EXISTING (it used to give a missing
     *   town most of its soft credit, which is why score barely correlated
     *   with placed count) — and dependency constraints only see locations
     *   that actually placed, so nobody measures a walk to a phantom capital.
     * - candidate_source: towns take their candidates from the matching biome
     *   cells inside their corridor instead of a blind 576-step lattice. The
     *   lattice was the binding constraint: most towns' biomes stood in the
     *   corridor in ~9 of 10 seeds while the lattice hit them far less often.
     */
    score_gating: "placed",
    candidate_source: "biome",
    /*
     * NO PREFILTER, still: only Spawn is eligible (the window is a disc around
     * the origin) and Spawn's island_feel cannot be prefiltered honestly — its
     * water fraction comes off a sea-level mask. Measured on the v1 spec:
     * every prefilter rejection came from island_feel and cost 21.6% of real
     * hits to save 8% of time. Revisit with `exclude_constraints` if the test
     * button says otherwise.
     */
  },

  locations: {
    /* ---- the hard shape of the world: spawn island + two capitals -------- */

    Spawn: {
      hard: true,
      weight: 3,
      at: { x: 0, z: 0, tolerance: cells(500) },
      constraints: [
        { type: "land_at", within: 400 },
        { type: "biome_within", biomes: OCEAN, within: 600 },
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

    /**
     * The capitals keep their hard floors (a capital without its port or its
     * footprint is not a capital) and gain graded upside: a bigger footprint,
     * a longer shore and flatter ground now score higher instead of merely
     * passing. Flatness is a fine-grid term, so only seeds that already pass
     * the coarse floors pay for it.
     */
    Narukami: {
      hard: true,
      weight: 3,
      discover: {
        direction: "north",
        distance: { min: cells(5000), max: cells(7000) },
        x_range: [-cells(500), cells(500)],
        step: cells(500),
      },
      constraints: [
        { type: "buildable_area", radius: 1200, minimum: 100000 },
        { type: "coastline", radius: 1000, minimum: 500 },
        { type: "large_connected_ocean", within: 400, minimum_area: 25000000, direction_bias: "north" },
        { type: "separation", minimum: 750 },
        { type: "terrain_flatness", radius: 500, fine: true },
      ],
      score: [
        { type: "buildable_area", weight: 0.4, reference: 300000 },
        { type: "coastline", weight: 0.2, reference: 2000 },
        { type: "terrain_flatness", weight: 0.2, reference: 4 },
        { type: "separation", weight: 0.1, band: { min: 750, ideal: 1500 } },
        { type: "large_connected_ocean", weight: 0.1, reference: 50000000 },
      ],
    },

    Gansolia: {
      hard: true,
      weight: 3,
      discover: {
        direction: "south",
        distance: { min: cells(5000), max: cells(7000) },
        x_range: [-cells(500), cells(500)],
        step: cells(500),
      },
      constraints: [
        { type: "buildable_area", radius: 1200, minimum: 100000 },
        { type: "coastline", radius: 1000, minimum: 500 },
        { type: "large_connected_ocean", within: 400, minimum_area: 25000000, direction_bias: "south" },
        { type: "separation", minimum: 750 },
        { type: "terrain_flatness", radius: 500, fine: true },
      ],
      score: [
        { type: "buildable_area", weight: 0.4, reference: 300000 },
        { type: "coastline", weight: 0.2, reference: 2000 },
        { type: "terrain_flatness", weight: 0.2, reference: 4 },
        { type: "separation", weight: 0.1, band: { min: 750, ideal: 1500 } },
        { type: "large_connected_ocean", weight: 0.1, reference: 50000000 },
      ],
    },

    /* ---- the eighteen types ---------------------------------------------
     * Halves are the live map's, not a balancing knob: nine north (reaching
     * Narukami), nine south (reaching Gansolia). */

    "Pueblo Tulipán": town("north", "Narukami", GRASS, 40000),
    "Pueblo Oasis": town("north", "Narukami", FIRE, 40000),
    "Pueblo Iwa": town("north", "Narukami", ROCK, 20000, [
      // A rock town on LOW stone is not Iwa: y≥120 really is a mountain here.
      { type: "surface_height", minimum: 120 },
    ]),
    "Pueblo Doku": town("north", "Narukami", POISON, 40000),
    "Pueblo Yume": town("north", "Narukami", DARK, 40000),
    "Pueblo Denki": town("north", "Narukami", ELECTRIC, 40000),
    "Pueblo Kinoko": town("north", "Narukami", BUG, 40000),
    "Pueblo Sakura": town("north", "Narukami", FAIRY, 40000),
    "Pueblo Hagane": town("north", "Narukami", STEEL, 20000),

    "Pueblo Tsuchi": town("south", "Gansolia", GROUND, 20000),
    // Ice keeps its live-map quirk: the sea lies back toward spawn, not out.
    "Pueblo Shiroi": town("south", "Gansolia", ICE, 40000, [
      { type: "large_connected_ocean", within: 1200, minimum_area: 4000000, direction_bias: "north" },
    ]),
    "Pueblo Olivo": town("south", "Gansolia", NORMAL, 40000),
    "Pueblo Senshi": town("south", "Gansolia", FIGHTING, 40000),
    "Pueblo Takai": town("south", "Gansolia", FLYING, 20000),
    "Pueblo Dento": town("south", "Gansolia", DRAGON, 20000),

    /**
     * The Psychic town lives on the mirage isles — actual islands, so the
     * land-walk-to-capital rule that binds every other town cannot apply (the
     * audit measured Gaku placing in 0% of passing seeds under the full kit:
     * mirage_isles almost never generated inside the 5 km corridor, and when
     * it did it was never Gansolia's landmass). Like the harbour, Gaku is
     * reached by boat: no reachability, no corridor, and the whole south half
     * of the scan to find its one biome in. The footprint asks only for the
     * isle itself to be real ground.
     */
    "Pueblo Gaku": {
      hard: false,
      weight: 1,
      discover: {
        direction: "south",
        distance: { min: TOWN_STEP, max: cells(11500) }, // 11520 — near the scan edge
        x_range: [-cells(11500), cells(11500)],
        step: TOWN_STEP,
      },
      constraints: [inBiome(PSYCHIC), SEP, NEAR_SPAWN, footprint(10000)],
      score: [
        { type: "biome_within", weight: 0.5, reference: 400 },
        { type: "separation", weight: 0.25, band: { min: 750, ideal: 1500 } },
        { type: "distance_to", weight: 0.15, band: { min: 750, ideal: 1500 } },
        { type: "buildable_area", weight: 0.1, reference: 100000 },
      ],
    },

    "Pueblo Lavanda": town("south", "Gansolia", GHOST, 40000),

    /**
     * The harbour stands IN the sea with a real shoreline beside it, so the
     * land kit does not apply: no footprint, no land walk to the capital, no
     * water_access (it IS the water). Separation and spawn distance still do.
     */
    "Pueblo Mizu": {
      hard: false,
      weight: 1,
      discover: half("south"),
      constraints: [
        inBiome(OCEAN),
        { type: "coastline", radius: 800, minimum: 300 },
        SEP,
        NEAR_SPAWN,
        corridor("south"),
      ],
      score: [
        { type: "biome_within", weight: 0.35, reference: 400 },
        { type: "separation", weight: 0.25, band: { min: 750, ideal: 1500 } },
        { type: "distance_to", weight: 0.15, band: { min: 750, ideal: 1500 } },
        { type: "coastline", weight: 0.15, reference: 2000 },
        { type: "corridor_lateral", weight: 0.1, inner_band: cells(1500), outer_band: cells(TOWN_REACH) },
      ],
    },
  },
};
