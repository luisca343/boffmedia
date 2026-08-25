/**
 * model.ts — the spec as the editor holds it, and how it becomes core JSON.
 *
 * Two shapes, on purpose:
 *
 * - `UiSpec` is what the cards edit. Locations are an **array**, because a form
 *   needs stable order and a rename must not lose a card's position; the core's
 *   object-keyed form cannot express either.
 * - The core spec is what `_core/spec.mjs` reads. Locations are an object keyed
 *   by name, and there is a `world` section.
 *
 * The `world` section is never edited. It is *derived* from the pack picker at
 * serialisation time, because the enabled packs already are the datapack stack
 * — every worker has loaded exactly those bytes — and a second, hand-typed
 * answer to "which packs" could only ever disagree with the first. `mods` comes
 * from the same list: it gates the lithostitched-conditional copies of biome
 * files, so getting it wrong evaluates a world nobody is playing.
 *
 * `validateSpec` requires `world.datapacks` to be non-empty, which is why
 * serialisation attaches it even though the browser resolves no paths at all.
 */

import { CONSTRAINT_BY_TYPE, SCORER_REFERENCE } from "./vocabulary";

export type WaterModeName = "biome" | "preliminary" | "sea_level" | "auto" | "exact";

/** A constraint as edited: a type plus whatever fields that type declares. */
export interface UiConstraint {
  /** Stable across edits so React keys survive a type change. */
  readonly id: string;
  type: string;
  values: Record<string, number | string | boolean | string[]>;
}

export interface UiScoreTerm {
  type: string;
  weight: number;
  reference?: number;
}

export interface UiLocation {
  readonly id: string;
  name: string;
  hard: boolean;
  /** Only meaningful when `hard` is false. */
  weight: number;
  mode: "at" | "discover";
  at: { x: number; z: number; tolerance: number };
  discover: {
    /** Empty means "anywhere": the core rings the origin instead of casting a ray. */
    direction: string;
    min: number;
    max: number;
    step: number;
    /** Lateral spread across the direction. Empty means the core's default. */
    xRange: [number, number] | null;
  };
  constraints: UiConstraint[];
  score: UiScoreTerm[];
}

export interface UiScan {
  radius: number;
  coarseStep: number;
  fineStep: number;
  water: WaterModeName;
  prefilter: {
    enabled: boolean;
    radius: number;
    step: number;
    water: WaterModeName;
  };
}

export interface UiSpec {
  origin: { x: number; z: number };
  scan: UiScan;
  locations: UiLocation[];
}

/* ------------------------------------------------------------------ ids -- */

let counter = 0;

/**
 * Ids are per-session and never serialised. `crypto.randomUUID` is avoided
 * deliberately: this runs in the desktop shell's webview too, and a counter is
 * both sufficient for a React key and stable to read while debugging.
 */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/* ------------------------------------------------------------- defaults -- */

export function defaultConstraint(type: string): UiConstraint {
  const spec = CONSTRAINT_BY_TYPE.get(type);
  const values: UiConstraint["values"] = {};
  for (const f of spec?.fields ?? []) {
    if (f.def !== undefined) values[f.key] = Array.isArray(f.def) ? [...f.def] : f.def;
  }
  return { id: nextId("c"), type, values };
}

export function defaultLocation(name: string): UiLocation {
  return {
    id: nextId("loc"),
    name,
    hard: true,
    weight: 0.5,
    mode: "at",
    at: { x: 0, z: 0, tolerance: 800 },
    discover: { direction: "north", min: 2000, max: 5000, step: 500, xRange: null },
    constraints: [],
    score: [],
  };
}

export const DEFAULT_SCAN: UiScan = {
  // 63 x 192. A radius that is a whole number of cells is what puts the origin
  // itself on a sample point — see `snapToCells` below.
  radius: 12096,
  coarseStep: 192,
  fineStep: 16,
  water: "auto",
  prefilter: { enabled: true, radius: 1200, step: 64, water: "biome" },
};

/* ------------------------------------------------------ sampling lattice -- */

/**
 * A constraint is measured at the nearest cell of the coarse grid — every
 * reader in `_core/geography.mjs` starts with `Math.round((x - x0) / step)` —
 * but the site a location reports is the CANDIDATE coordinate. Those are the
 * same point only when the candidate lands on a sample point; otherwise the
 * tool names a coordinate whose biome it never read, and the failure looks
 * exactly like "this seed is bad".
 *
 * The grid runs from `origin - radius` in steps of `coarseStep`, so the origin
 * is a sample point only when the radius is a whole number of cells. A radius
 * of 12000 against a 192 step puts every sample 96 blocks off on both axes —
 * not an edge effect, the whole grid.
 */
export const snapToCells = (n: number, step: number): number => Math.round(n / step) * step;

/** The grid a location's sites are measured on: where it starts, how coarse. */
export interface Lattice {
  origin: { x: number; z: number };
  step: number;
}

const coarseStepOf = (ui: UiSpec): number => Math.max(1, Math.round(ui.scan.coarseStep));

export const latticeOf = (ui: UiSpec): Lattice => ({ origin: ui.origin, step: coarseStepOf(ui) });

/** The four directions whose unit vector is axis-aligned. */
const CARDINAL = new Set(["north", "south", "east", "west"]);

/**
 * Can every candidate site for this location land on a sample point?
 *
 * Only axis-aligned geometry can. The core scales a diagonal band by 1/sqrt(2)
 * (`northeast` is `[1, -1]`, normalised), and both a ring search and the ring
 * around a pinned site place candidates at 45 degrees, so neither can be
 * snapped by choosing rounder numbers. Those locations are measured up to half
 * a cell from the coordinate shown, which the editor says out loud rather than
 * presenting the site as exact.
 */
export function latticeAligned(loc: UiLocation, lat: Lattice): boolean {
  const step = lat.step;
  const onGrid = (n: number) => snapToCells(n, step) === n;
  if (!onGrid(lat.origin.x) || !onGrid(lat.origin.z)) return false;

  if (loc.mode === "at") {
    // A tolerance under one cell never rings: the core's ring runs from
    // `max(grid.step, tolerance / 4)` up to `tolerance`, so it produces
    // nothing and the pinned point is the only candidate.
    if (Math.abs(loc.at.tolerance) >= step) return false;
    return onGrid(loc.at.x) && onGrid(loc.at.z);
  }
  return CARDINAL.has(loc.discover.direction);
}

/** Half a cell on the diagonal: the widest gap between a site and its sample. */
export const latticeDrift = (lat: Lattice): number => Math.round((lat.step / 2) * Math.SQRT2);

/**
 * The radius the scan actually runs at: the requested one rounded to whole
 * cells, and never below one. The editor shows this next to the input when it
 * differs, because a silently corrected number is how the original bug hid.
 */
export function effectiveRadius(ui: UiSpec): number {
  const step = coarseStepOf(ui);
  return Math.max(step, snapToCells(ui.scan.radius, step));
}

/* ---------------------------------------------------------- serialising -- */

/** Strip fields the core reads as "unset" rather than as a real bound. */
function cleanValues(type: string, values: UiConstraint["values"]): Record<string, unknown> {
  const spec = CONSTRAINT_BY_TYPE.get(type);
  const out: Record<string, unknown> = {};
  for (const f of spec?.fields ?? []) {
    const v = values[f.key];
    if (v === undefined || v === null) continue;
    // An empty selector list or an empty direction is "no opinion", and the
    // core treats a present-but-empty value differently from an absent one:
    // `biomes: []` matches nothing and fails, where absent means unconstrained.
    if (Array.isArray(v) && v.length === 0) continue;
    if (v === "") continue;
    if (f.kind === "flag" && v === false) continue;
    out[f.key] = v;
  }
  return out;
}

export interface CoreSpec {
  world: {
    minecraft_version: string;
    dimension: string;
    mods: string[];
    datapacks: { id: string; path: string }[];
  };
  origin: { x: number; z: number };
  scan: Record<string, unknown>;
  locations: Record<string, unknown>;
}

/**
 * Can the prefilter honestly judge this location?
 *
 * Only if EVERY candidate site it could use falls inside the prefilter window.
 * `prefilterSeed` clips the candidate list to that window, so a location that
 * reaches beyond it is judged on whichever fragment happens to fall inside —
 * and rejects seeds the full evaluation would have accepted.
 *
 * This is not hypothetical. Deriving the list from "every hard location" took
 * the Teras preset from 143 survivors in 200 seeds to **zero**: its towns range
 * 5000 blocks out, the prefilter window is 1200, and the two or three candidates
 * that landed inside it never happened to sit in the right biome. The search
 * then reported "1000 of 1000 checked, 0 fully evaluated" — a filter that
 * rejects everything looks exactly like a fast search.
 *
 * Two further conditions, both about not throwing away good seeds:
 *
 * - **Hard only.** A soft location cannot reject a seed in the full pass, so
 *   letting it reject one here would lose seeds the spec would have kept.
 * - **At least one prefilter-safe condition.** A location whose conditions all
 *   need height or geography contributes nothing to a height-free window; the
 *   core skips it anyway, and including it is noise.
 */
function prefilterable(loc: UiLocation, ui: UiSpec): boolean {
  if (!loc.hard || !loc.name.trim()) return false;

  const radius = ui.scan.prefilter.radius;
  const reach = (v: number) => Math.abs(v);

  if (loc.mode === "at") {
    // The core clips with a box, not a circle, so compare per axis.
    const tol = Math.abs(loc.at.tolerance);
    if (reach(loc.at.x - ui.origin.x) + tol > radius) return false;
    if (reach(loc.at.z - ui.origin.z) + tol > radius) return false;
  } else {
    // Worst case is the far end of the band plus the full lateral offset; a
    // ring search (no direction) has no lateral term. The core's own default
    // when `x_range` is absent is ±2000, so that is what absent costs.
    const lateral = loc.discover.direction
      ? (loc.discover.xRange
          ? Math.max(Math.abs(loc.discover.xRange[0]), Math.abs(loc.discover.xRange[1]))
          : 2000)
      : 0;
    // Additive on purpose, and deliberately loose for the cardinals. Half the
    // vocabulary's directions are diagonal, and the core scales those by
    // 1/sqrt(2), which spends the band AND the lateral offset on both axes at
    // once: a northeast band reaching 1200 with 1200 of lateral lands ~1697
    // from the origin, outside a 1200 window. Splitting this into a per-axis
    // test — `max <= radius && lateral <= radius` — is exact for north/south/
    // east/west and admits exactly the diagonal bands whose candidates leave
    // the window, which is the bug this function exists to prevent. Tighten it
    // only per direction, never in general.
    if (Math.abs(loc.discover.max) + lateral > radius) return false;
  }

  return loc.constraints.some((c) => CONSTRAINT_BY_TYPE.get(c.type)?.prefilterSafe);
}

/**
 * The browser spec the evaluator actually runs. `packIds` must be the enabled
 * stack in load order — vanilla first — exactly as handed to `loadStack`.
 */
export function toCoreSpec(
  ui: UiSpec,
  packIds: readonly string[],
  opts: { minecraftVersion?: string } = {},
): CoreSpec {
  const locations: Record<string, unknown> = {};
  const coarse = coarseStepOf(ui);

  for (const loc of ui.locations) {
    const name = loc.name.trim();
    if (!name) continue;

    const entry: Record<string, unknown> = { hard: loc.hard };
    if (!loc.hard) entry.weight = loc.weight;

    if (loc.mode === "at") {
      entry.at = { x: loc.at.x, z: loc.at.z, tolerance: loc.at.tolerance };
    } else {
      // Rounded to whole cells so each candidate IS the cell that gets
      // measured. Only for the cardinals: a diagonal band scales by 1/sqrt(2),
      // so no choice of numbers puts its candidates on the grid, and rounding
      // them would move the band while fixing nothing. `latticeAligned` is
      // what tells the user about the ones that cannot be fixed.
      const cardinal = CARDINAL.has(loc.discover.direction);
      const cell = (n: number) => (cardinal ? snapToCells(n, coarse) : n);
      const d: Record<string, unknown> = {
        distance: { min: cell(loc.discover.min), max: cell(loc.discover.max) },
        // The core walks the band with `r += step`, so a zero step never
        // terminates — it would hang the worker rather than fail.
        step: Math.max(cardinal ? coarse : 1, cell(loc.discover.step)),
      };
      // Omitted entirely when empty. `directionVector` returns null for an
      // unknown direction and the core then rings the origin, which is what
      // "anywhere" means — but writing `direction: ""` would rely on that
      // fallback rather than asking for it.
      if (loc.discover.direction) d.direction = loc.discover.direction;
      // Lateral banding is perpendicular to a direction, so it means nothing
      // without one; the core ignores it for ring searches either way.
      if (loc.discover.xRange && loc.discover.direction) {
        d.x_range = [cell(loc.discover.xRange[0]), cell(loc.discover.xRange[1])];
      }
      entry.discover = d;
    }

    entry.constraints = loc.constraints.map((c) => ({ type: c.type, ...cleanValues(c.type, c.values) }));

    if (loc.score.length) {
      entry.score = loc.score.map((s) => ({
        type: s.type,
        weight: s.weight,
        reference: s.reference ?? SCORER_REFERENCE[s.type],
      }));
    }

    locations[name] = entry;
  }

  const scan: Record<string, unknown> = {
    // Whole cells, so the origin is a sample point and every snapped band
    // above lands on one. `effectiveRadius` shows the user what this became.
    radius: effectiveRadius(ui),
    coarse_step: coarse,
    fine_step: ui.scan.fineStep,
    water_mode: ui.scan.water,
  };
  if (ui.scan.prefilter.enabled) {
    const names = ui.locations.filter((l) => prefilterable(l, ui)).map((l) => l.name.trim());
    // No eligible location means no prefilter at all, rather than an empty one:
    // an empty `locations` list still makes `prefilterSeed` build its grid for
    // every seed and then decide nothing.
    if (names.length) {
      scan.prefilter = {
        radius: ui.scan.prefilter.radius,
        step: ui.scan.prefilter.step,
        water_mode: ui.scan.prefilter.water,
        locations: names,
      };
    }
  }

  return {
    // Paths are inert here — the browser fetches curated bundles by id and
    // never resolves a path. They exist because `validateSpec` requires a
    // non-empty `datapacks`, and because an exported spec should still say
    // which stack produced it.
    world: {
      minecraft_version: opts.minecraftVersion ?? "1.21.1",
      dimension: "minecraft:overworld",
      mods: [...packIds],
      datapacks: packIds.map((id) => ({ id, path: `bundle:${id}` })),
    },
    origin: { ...ui.origin },
    scan,
    locations,
  };
}

/**
 * What must be identical for a `Session` to stay valid. Everything the coarse
 * grid depends on and nothing a constraint threshold can touch — that split is
 * the entire reason tuning a slider costs milliseconds.
 */
export function scanHash(ui: UiSpec): string {
  const s = ui.scan;
  // The snapped radius and step, because those are what the grid is built
  // from: two radii that round to the same lattice describe the same grid and
  // must share a session rather than rebuild it.
  return [ui.origin.x, ui.origin.z, effectiveRadius(ui), coarseStepOf(ui), s.fineStep, s.water].join("|");
}

/* -------------------------------------------------------------- parsing -- */

/**
 * Constraint fields an imported spec carries that the editor cannot hold,
 * as `Location: type.field` strings.
 *
 * `cleanValues` writes back only what the vocabulary declares, so anything
 * else is dropped the moment the editor re-serialises — quietly changing what
 * the spec asks for. `landmass_area.maximum` is the live example: the core
 * honours it, the editor deliberately does not offer it because a maximum on
 * a truncated lower bound is unsound, and an import carrying one would start
 * accepting the very seeds it was written to reject. Dropping it is right;
 * dropping it in silence is not.
 */
export function unsupportedFields(core: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const [name, raw] of Object.entries((core.locations ?? {}) as Record<string, unknown>)) {
    const cs = ((raw as Record<string, unknown>)?.constraints ?? []) as Record<string, unknown>[];
    for (const c of cs) {
      const spec = typeof c.type === "string" ? CONSTRAINT_BY_TYPE.get(c.type) : undefined;
      if (!spec) continue;
      const known = new Set(spec.fields.map((f) => f.key));
      for (const key of Object.keys(c)) {
        if (key === "type" || key === "//" || known.has(key)) continue;
        out.push(`${name}: ${c.type as string}.${key}`);
      }
    }
  }
  return out;
}

const asNum = (v: unknown, fallback: number): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

/** Read a core spec (an imported file, or a preset) back into the editor's shape. */
export function fromCoreSpec(core: Record<string, unknown>): UiSpec {
  const origin = (core.origin ?? {}) as { x?: number; z?: number };
  const scan = (core.scan ?? {}) as Record<string, unknown>;
  const pf = (scan.prefilter ?? null) as Record<string, unknown> | null;

  const locations: UiLocation[] = [];
  for (const [name, raw] of Object.entries((core.locations ?? {}) as Record<string, unknown>)) {
    const loc = raw as Record<string, unknown>;
    const base = defaultLocation(name);
    const at = loc.at as { x?: number; z?: number; tolerance?: number } | undefined;
    const disc = loc.discover as Record<string, unknown> | undefined;
    const dist = (disc?.distance ?? {}) as { min?: number; max?: number };
    const xr = disc?.x_range as [number, number] | undefined;

    locations.push({
      ...base,
      hard: loc.hard !== false,
      weight: asNum(loc.weight, 0.5),
      mode: at ? "at" : "discover",
      at: at
        ? { x: asNum(at.x, 0), z: asNum(at.z, 0), tolerance: asNum(at.tolerance, 0) }
        : base.at,
      discover: disc
        ? {
            // Absent stays absent: coercing it to a compass point would turn
            // "anywhere" into "north" on the first round trip through the UI.
            direction: typeof disc.direction === "string" ? disc.direction : "",
            min: asNum(dist.min, 0),
            max: asNum(dist.max, 5000),
            step: asNum(disc.step, 500),
            xRange: Array.isArray(xr) && xr.length === 2 ? [xr[0]!, xr[1]!] : null,
          }
        : base.discover,
      constraints: ((loc.constraints ?? []) as Record<string, unknown>[])
        // A `//` annotation key rides along in the worked example; it is a
        // comment, not a constraint, and `type` is what tells them apart.
        .filter((c) => typeof c.type === "string" && CONSTRAINT_BY_TYPE.has(c.type as string))
        .map((c) => {
          const { type, ...rest } = c as { type: string } & Record<string, unknown>;
          const out = defaultConstraint(type);
          for (const [k, v] of Object.entries(rest)) {
            if (k === "//") continue;
            out.values[k] = v as number | string | boolean | string[];
          }
          return out;
        }),
      score: ((loc.score ?? []) as Record<string, unknown>[])
        .filter((s) => typeof s.type === "string")
        .map((s) => ({
          type: s.type as string,
          weight: asNum(s.weight, 0.5),
          reference: typeof s.reference === "number" ? s.reference : undefined,
        })),
    });
  }

  return {
    origin: { x: asNum(origin.x, 0), z: asNum(origin.z, 0) },
    scan: {
      radius: asNum(scan.radius, DEFAULT_SCAN.radius),
      coarseStep: asNum(scan.coarse_step, DEFAULT_SCAN.coarseStep),
      fineStep: asNum(scan.fine_step, DEFAULT_SCAN.fineStep),
      water: (scan.water_mode as WaterModeName) ?? DEFAULT_SCAN.water,
      prefilter: {
        enabled: !!pf,
        radius: asNum(pf?.radius, DEFAULT_SCAN.prefilter.radius),
        step: asNum(pf?.step, DEFAULT_SCAN.prefilter.step),
        water: (pf?.water_mode as WaterModeName) ?? DEFAULT_SCAN.prefilter.water,
      },
    },
    locations,
  };
}
