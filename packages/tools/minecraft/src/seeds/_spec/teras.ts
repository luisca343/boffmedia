/**
 * teras.ts — the Teras world: a named settlement per biome family.
 *
 * Every selector below was checked against the bundles this tool actually
 * ships (`vanilla-1.21.1`, `terralith-2.6.2`) by expanding the merged tag graph,
 * not against recollection of what Terralith contains. That matters more here
 * than anywhere else in the tool: a biome id that is not in the stack makes
 * `biome_within` report *"no biome in the scan window matches"*, which is
 * indistinguishable from "this seed does not have one" — a typo would look
 * exactly like a rejected seed, for every seed, forever.
 *
 * ## Why tags rather than lists
 *
 * Terralith merges its own biomes into the vanilla tags, so `#minecraft:is_badlands`
 * already resolves to nine biomes across both packs, and `#terralith:reference/*`
 * gives curated families on top. Tags survive a Terralith update; a hand-copied
 * list of 130 ids does not. Where a tag misses something it should have caught,
 * the stray id is listed next to it with a note — that is the only reason any
 * literal id appears below.
 *
 * ## Two gaps in the constraint vocabulary, marked HERE rather than hidden
 *
 * 1. **Nothing measures how big a biome is.** "A big swamp", "a big forest" and
 *    "a big mountain" cannot be expressed: `biome_within` measures *distance to*
 *    a biome, never its extent. Where the request said "big", the closest honest
 *    proxy is used and labelled — `surface_height` for a mountain (high ground
 *    really is a mountain), `buildable_area` for a large settleable site (which
 *    measures contiguous LAND, not contiguous forest). A `biome_area` constraint
 *    would fix this properly and is a small, upstreamable addition to the core.
 * 2. **Two towns have no matching biome in this stack at all.** They are built
 *    with the nearest thing and flagged; see the notes on Yume and Hagane.
 */

/* -------------------------------------------------------------- selectors -- */

/**
 * Mesas. `#minecraft:is_badlands` already carries Terralith's bryce_canyon,
 * painted_mountains, red_oasis, savanna_badlands, snowy_badlands and white_mesa
 * alongside the three vanilla badlands.
 *
 * The two literals are the ones the tag genuinely misses: `ancient_sands` is
 * tagged as desert rather than badlands despite being on the wiki's mesa list,
 * and `warped_mesa` is in no family tag at all.
 */
const MESA = ["#minecraft:is_badlands", "terralith:ancient_sands", "terralith:warped_mesa"];

/**
 * Deserts. `#c:is_desert` is Terralith's own and covers ancient_sands,
 * desert_canyon, desert_oasis, desert_spires, lush_desert and sandstone_valley
 * — but NOT `minecraft:desert`, because vanilla ships no such tag. Hence both.
 */
const DESERT = ["minecraft:desert", "#c:is_desert", "terralith:gravel_desert"];

/** Mountains: 20 biomes across both packs, peaks and slopes included. */
const MOUNTAIN = ["#minecraft:is_mountain", "#terralith:cliffs"];

/** Swamps. Vanilla's two are untagged by `#c:is_swamp`, which is Terralith-only. */
const SWAMP = ["minecraft:swamp", "minecraft:mangrove_swamp", "#c:is_swamp"];

/**
 * Cold. `#c:is_snowy` and `#terralith:reference/temperature/frozen_all` are both
 * Terralith-only, so vanilla's own snowy biomes are named explicitly.
 */
const COLD = [
  "#c:is_snowy",
  "minecraft:snowy_plains",
  "minecraft:snowy_taiga",
  "minecraft:snowy_slopes",
  "minecraft:ice_spikes",
  "minecraft:frozen_peaks",
  "minecraft:frozen_river",
];

/** Forests: 18 biomes, and Terralith's lavender/sakura/moonlight groves are in it. */
const FOREST = ["#minecraft:is_forest", "#terralith:reference/forest", "terralith:forested_highlands"];

const SAVANNA = ["#minecraft:is_savanna"];

/** Plains. `#c:is_plains` is Terralith-only again, so vanilla's are named. */
const PLAINS = [
  "minecraft:plains",
  "minecraft:sunflower_plains",
  "minecraft:meadow",
  "#c:is_plains",
  "terralith:blooming_valley",
  "terralith:lush_valley",
];

const SAKURA = [
  "terralith:sakura_grove",
  "terralith:sakura_valley",
  "minecraft:cherry_grove",
  "terralith:snowy_cherry_grove",
];

const LAVENDER = ["terralith:lavender_forest", "terralith:lavender_valley"];

/** Blue-tinted canopies. Terralith's moonlight biomes are the only ones. */
const BLUE_TREES = ["terralith:moonlight_grove", "terralith:moonlight_valley"];

/** Dark/roofed forest, with the mushroom biomes as the thematic alternative. */
const ROOFED = ["minecraft:dark_forest", "minecraft:mushroom_fields", "terralith:mirage_isles"];

const OCEAN = ["#minecraft:is_ocean"];

/**
 * NO TRUE MATCH IN THIS STACK. Terralith 2.6.2 has no ground-level autumn
 * forest: `skylands_autumn` is a floating island and unusable as a town site.
 * `snowy_maple_forest` is the only maple-coloured canopy and it is snowy;
 * `scarlet_mountains` is the only warm-toned one and it is a mountain.
 */
const AUTUMN_BEST_EFFORT = ["terralith:snowy_maple_forest", "terralith:scarlet_mountains"];

/**
 * NO TRUE MATCH EITHER. "Red leaves and grey trees" describes no Terralith
 * biome. `scarlet_mountains` supplies the red canopy; `ashen_savanna` is the
 * only ashen-grey wooded biome. Neither is a forest in the tag sense.
 */
const RED_GREY_BEST_EFFORT = ["terralith:scarlet_mountains", "terralith:ashen_savanna"];

/* -------------------------------------------------------------- builders -- */

/**
 * Every town sits in one half of the map, inside the ring the capitals occupy.
 *
 * `TOWN_REACH = 5000` keeps them clear of Narukami and Gansolia, which are
 * discovered between 5000 and 7000 — so the towns are always *before* the
 * capital on the way out from spawn, never past it.
 *
 * ## How wide the band is: as wide as it is deep
 *
 * A directional discover does not sweep a half-plane; it casts a ray and offsets
 * candidates perpendicular to it, so `x_range` alone decides how much of the
 * half is ever looked at. The core's default of ±2000 is far too narrow — "the
 * northern half" would mean a 4000-block corridor straight up the middle, and
 * biomes that plainly exist out on the flanks would report as missing.
 *
 * The band is therefore `±TOWN_REACH`, the same as its forward reach, written
 * from that constant so the two cannot drift apart. It was ±8000, and that was
 * too wide to keep the word "north" honest: against 5000 of reach the strip was
 * over three times wider than deep, so a town could sit 8064 east of spawn and
 * 576 north — a placement nobody would call northern. The reach itself cannot
 * grow to match, because the capitals start at 5000 and every town must be
 * *before* its capital on the way out.
 *
 * Measured over 40 seeds, squaring the band costs 7 points of placement —
 * 79.3% → 72.4% of 18 towns — and 48% of the sites it used to find sat beyond
 * the new edge. The towns that pay are the ones whose biome is rare enough to
 * have been found only out on a flank: Dento (−11), Sakura (−10), Iwa and
 * Shiroi (−8 each).
 *
 * ## Candidate spacing and the biome tolerance are ONE decision
 *
 * At `TOWN_STEP` apart the furthest any point can be from a candidate is that
 * step's diagonal, ~407 blocks. Widening the spacing without widening
 * `inBiome`'s tolerance leaves patches between candidates — measured, that was
 * the autumn family existing in 95% of seeds but placing in only 73%.
 *
 * Cost: 8 distance bands × 18 lateral columns = 144 candidates per town, so
 * ~2,600 candidate evaluations per seed across the 18 towns, all of them cheap
 * array lookups over a grid sampled once for the whole seed.
 */
const TOWN_REACH = 5000;

/**
 * Which half each town sits in, taken from the live 1.16.5 map rather than
 * chosen here. It is a record of where these towns already are, so it is not a
 * balancing knob and should not be "tidied" — the names are the map's.
 *
 * Note the two that fight their own half: Shiroi and Gaku both require sea to
 * the NORTH and both sit in the south, so their ocean has to lie back toward
 * spawn rather than out toward the map edge. That is what the live map does;
 * it is simply a harder thing to find than the mirrored arrangement would be.
 */

/**
 * The sampling grid's step, repeated here because every number below has to be
 * a multiple of it. See `half()`.
 */
const GRID_STEP = 192;

/** Round to whole cells, so a candidate lands exactly on a sample point. */
const cells = (n: number) => Math.round(n / GRID_STEP) * GRID_STEP;

const TOWN_STEP = cells(600); // 576

/**
 * A band in one half of the map, on the sampling lattice.
 *
 * **Every distance here is a whole number of grid cells, and that is the whole
 * point.** `nearestBiome` reads the cell nearest the candidate, but the site
 * reported to the user is the candidate itself. Off-lattice, those are two
 * different places up to ~136 blocks apart, and the tool ends up promising a
 * biome it never sampled — measured, that was Tulipán passing a forest test
 * while standing on snowy plains, and it accounted for essentially all of the
 * remaining mismatches once the tolerance was already 0.
 *
 * With the scan radius also a whole number of cells, the grid runs from
 * `-12096` in steps of 192, so every multiple of 192 is a sample point and each
 * candidate IS the cell that gets measured.
 */
const half = (direction: "north" | "south") => ({
  direction,
  distance: { min: TOWN_STEP, max: cells(TOWN_REACH) },
  x_range: [-cells(TOWN_REACH), cells(TOWN_REACH)],
  step: TOWN_STEP,
});

/**
 * The town must sit ON its biome, not merely near it.
 *
 * `within: 0` restricts `nearestBiome` to the candidate's own grid cell, so a
 * town that passes is standing in the biome rather than looking at it from
 * across a border. A tolerance was tried and is wrong: measured over 30 seeds,
 * `within: 800` placed 91% of towns but only **48% of them were actually in the
 * biome they were named for** — that is the Tulipán-on-snowy-plains report.
 * At 0 it is 69%, for 83% placement.
 *
 * The residual ~30% is sampling resolution and cannot be fixed here. The
 * constraint reads a 192-block grid, so it can promise "the cell at this site
 * is forest", never "this exact block is forest"; near a border the two differ.
 * Raising resolution barely helps and costs plenty — measured, a 96-block grid
 * bought 8 points for 3.3x the time — so the honest position is that a marker
 * locates a biome to about +/-150 blocks.
 */
const inBiome = (biomes: string[], within = 0) => ({ type: "biome_within", biomes, within });

/**
 * A named town in one half of the map — **optional, and scored**.
 *
 * Every pueblo is soft: it cannot reject a seed, it can only lower the score.
 * Demanding all eighteen at once made the spec unsatisfiable — 0 seeds in 100
 * cleared it — and a search that returns nothing cannot be told apart from a
 * search that is broken. What the hard requirements now gate is the shape of
 * the world (spawn, and the two capitals on the axis); the pueblos measure how
 * much of Teras that world already fits, so a seed with sixteen of them is
 * something to look at rather than another rejection.
 *
 * That makes `score` the thing being ranked. It is the weighted mean over all
 * 21 locations — three hard at weight 1, eighteen pueblos at weight 1 — so a
 * seed lands near `(spawn quality + capitals + pueblos placed) / 21`, and the
 * pueblos dominate it. `inBiome` uses `within: 0`, so a pueblo's biome term is
 * 1 or 0 and never a fraction.
 *
 * It is NOT exactly the count of pueblos that fitted, and the row in the
 * results list shows both for that reason. A pueblo is scored on the terms in
 * its `score` list, and it passes on all of its `constraints` — Olivo, say, is
 * scored on its biome but must also find two oceans, so it can score 1 and
 * still not fit. That is the ranking behaving: a pueblo standing in the right
 * biome and missing its ocean is closer to placeable by hand than one with no
 * such biome in its half at all.
 *
 * `weight: 1` because no pueblo outranks another. They are places on a map,
 * not priorities.
 */
function town(
  direction: "north" | "south",
  biomes: string[],
  extra: Record<string, unknown>[] = [],
) {
  return {
    hard: false,
    weight: 1,
    discover: half(direction),
    constraints: [inBiome(biomes), ...extra],
    score: [{ type: "biome_within", weight: 1, reference: 400 }],
  };
}

/* ------------------------------------------------------------------ spec -- */

export const TERAS_SPEC: Record<string, unknown> = {
  origin: { x: 0, z: 0 },
  scan: {
    radius: 12096, // 63 x 192 — see GRID_STEP below
    coarse_step: 192,
    fine_step: 16,
    water_mode: "auto",
    /*
     * NO PREFILTER, and it is not an oversight. Only Spawn is even eligible —
     * the window is a disc around the origin and every town below may be 11k
     * out — and Spawn cannot be prefiltered honestly:
     *
     * Measured over 100 seeds (`prefilter: { radius: 1200, step: 64,
     * water_mode: "biome", locations: ["Spawn"] }`, 88 of them passing Spawn
     * in the full pass):
     *
     *   variant                pass   Spawn hits lost   ms/seed
     *   all three constraints   70         19 (21.6%)      26
     *   island_feel only        70         19 (21.6%)      26
     *   biome_within only      100          0               26
     *   land_at only           100          0               26
     *   all three, water auto   90          1 (1.1%)       119
     *
     * Every rejection came from `island_feel`, and `island_feel` is exactly
     * what a sea-level reading gets wrong: its water fraction and coastline
     * come off a land mask built from biomes at y=63 rather than from the
     * surface. The constraints that survive sea level reject nothing at all,
     * so narrowing the list buys a filter that costs 26 ms and refuses no
     * seed. Against a full evaluation of ~1081 ms/seed, the fast filter moves
     * time-per-hit from ~1081 ms to ~999 ms — 8%, for one hit in five.
     *
     * A prefilter still earns its place on a spec whose spawn test is a rare
     * BIOME near the origin, which is what `oceanSpawn` and `islandAndCities`
     * do. It cannot earn it here.
     */
  },

  locations: {
    /* ---- the original three, unchanged ------------------------------- */

    Spawn: {
      hard: true,
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

    Narukami: {
      hard: true,
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
      ],
      score: [
        { type: "coastline", weight: 0.3, reference: 4000 },
        { type: "buildable_area", weight: 0.7, reference: 400000 },
      ],
    },

    Gansolia: {
      hard: true,
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
      ],
      score: [
        { type: "coastline", weight: 0.3, reference: 4000 },
        { type: "buildable_area", weight: 0.7, reference: 400000 },
      ],
    },

    /* ---- the biome towns --------------------------------------------- */

    // Any forest, anywhere, large, with water. "Large" is `buildable_area`,
    // which measures contiguous LAND rather than contiguous forest — the
    // closest the vocabulary can get. "Water" is coastline: any shoreline
    // within 600 blocks, so a lake or river counts, not only an ocean.
    "Pueblo Tulipán": {
      // Soft like every other pueblo — see `town()`. Written out rather than
      // built because it scores on buildable area as well as its biome.
      hard: false,
      weight: 1,
      discover: half("north"),
      constraints: [
        inBiome(FOREST, 0),
        { type: "buildable_area", radius: 800, minimum: 60000 },
        { type: "coastline", radius: 600, minimum: 150 },
      ],
      score: [
        { type: "buildable_area", weight: 0.6, reference: 200000 },
        { type: "biome_within", weight: 0.4, reference: 400 },
      ],
    },

    "Pueblo Tsuchi": town("south", MESA),
    "Pueblo Oasis": town("north", DESERT),

    // "A big mountain": `surface_height` is the honest proxy, and it is a
    // proxy this file invented — the requirement was a mountain, not a height.
    // Measured over 40 seeds with the town confined to the southern half:
    // y>=140 failed 70% of seeds, y>=120 failed 45%, and the mountain biome
    // alone failed 0%. 120 keeps the site meaningfully high while leaving the
    // yield usable; raise it toward 140 for drama, drop the condition entirely
    // if the search comes back empty.
    "Pueblo Iwa": town("north", MOUNTAIN, [{ type: "surface_height", minimum: 120 }]),

    // "A big swamp": no size measure exists, so this is only "a swamp".
    "Pueblo Doku": town("north", SWAMP),

    // Cold, with sea to the north.
    "Pueblo Shiroi": town("south", COLD, [
      { type: "large_connected_ocean", within: 1200, minimum_area: 4000000, direction_bias: "north" },
    ]),

    "Pueblo Yume": town("north", AUTUMN_BEST_EFFORT),

    // Deliberately unconstrained: no Terralith biome has yellow canopies, and
    // the request was to leave it open rather than approximate it.
    "Pueblo Denki": {
      // Soft like every other pueblo — see `town()`. Written out because it
      // asks for no biome at all, only dry land.
      hard: false,
      weight: 1,
      discover: half("north"),
      constraints: [{ type: "land_at", within: 200 }],
      score: [],
    },

    // Mountainous, with sea to the west AND to the south — two separate ocean
    // tests, because `direction_bias` takes one bearing.
    "Pueblo Olivo": town("south", MOUNTAIN, [
      { type: "large_connected_ocean", within: 1500, minimum_area: 4000000, direction_bias: "west" },
      { type: "large_connected_ocean", within: 1500, minimum_area: 4000000, direction_bias: "south" },
    ]),

    "Pueblo Senshi": town("south", SAVANNA),
    "Pueblo Kinoko": town("north", ROOFED),
    "Pueblo Takai": town("south", PLAINS),
    "Pueblo Sakura": town("north", SAKURA),
    "Pueblo Hagane": town("north", RED_GREY_BEST_EFFORT),
    "Pueblo Dento": town("south", BLUE_TREES),

    // Plains with a sea reachable to the north. Same shape as Shiroi: the town
    // is discovered anywhere, and the ocean test carries the bearing — the two
    // are independent, so this is "plains that happen to face north onto water"
    // rather than "plains in the north".
    "Pueblo Gaku": town("south", PLAINS, [
      { type: "large_connected_ocean", within: 1200, minimum_area: 4000000, direction_bias: "north" },
    ]),

    // On the ocean, so it can be a harbour: in an ocean biome with real
    // shoreline beside it rather than out in open water.
    "Pueblo Mizu": town("south", OCEAN, [{ type: "coastline", radius: 800, minimum: 300 }]),

    "Pueblo Lavanda": town("south", LAVENDER),
  },
};
