/**
 * Minecraft block-model rendering types.
 *
 * This package implements the Minecraft asset chain
 * (`blockstates → model(+parent) → elements/faces/textures`) far enough to draw a
 * block with its real geometry, per-face textures, and biome tint — replacing the
 * old "single texture on a cube" approach in the 3D viewer.
 *
 * Pure data only: no THREE, no React. The compiler emits a {@link CompiledModel}
 * of plain typed arrays so the same output can come from the main thread (vanilla
 * CDN) or the worker (mod JARs) and cross the postMessage boundary unchanged.
 */

// ─── Raw asset shapes (as read from the JSON) ────────────────────────────────

/** A model spec referenced by a blockstate variant / multipart `apply`. */
export interface ModelRef {
  model: string;
  /** Whole-model rotation about the block centre, degrees (0/90/180/270). */
  x?: number;
  y?: number;
  /** Keep UVs world-aligned despite x/y rotation. (Deferred — see compiler.) */
  uvlock?: boolean;
  /**
   * Texture overrides declared beside the ref rather than on the model. Vanilla
   * has no such thing; Forge v1 relies on it — a modded block usually points
   * every variant at one shared model and varies only this map.
   */
  textures?: Record<string, string>;
}

/** A blockstate `when` predicate: `{ key: "a|b" }` (OR within a value) or `{ OR: [...] }`. */
export type MultipartWhen =
  | { OR: Array<Record<string, string>> }
  | { AND: Array<Record<string, string>> }
  | Record<string, string>;

export interface Blockstate {
  variants?: Record<string, ModelRef | ModelRef[]>;
  multipart?: Array<{ when?: MultipartWhen; apply: ModelRef | ModelRef[] }>;
}

export interface ModelFace {
  uv?: [number, number, number, number];
  texture: string;
  cullface?: string;
  rotation?: number;
  tintindex?: number;
}

export interface ModelElement {
  from: [number, number, number];
  to: [number, number, number];
  rotation?: {
    origin: [number, number, number];
    axis: "x" | "y" | "z";
    angle: number;
    rescale?: boolean;
  };
  faces: Partial<Record<"down" | "up" | "north" | "south" | "west" | "east", ModelFace>>;
}

export interface RawModel {
  parent?: string;
  textures?: Record<string, string>;
  elements?: ModelElement[];
}

// ─── Resolved / compiled shapes ───────────────────────────────────────────────

/** A model + its whole-model rotation, ready to compile (one for variants, ≥1 for multipart). */
export interface ModelInstance {
  model: RawModel;
  /** Merged + #ref-resolved texture map (variable → "ns:path"). */
  textures: Record<string, string>;
  x: number;
  y: number;
  uvlock: boolean;
}

/** One draw group of the compiled geometry — a contiguous index range + its style. */
export interface CompiledGroup {
  /** Texture variable's resolved ref ("ns:block/foo"); the UI turns it into a src. */
  textureRef: string | null;
  /** Hex tint when the face had `tintindex >= 0`, else null. */
  tint: string | null;
  /** Source element was planar (paper-thin) → render double-sided (cross plants…). */
  doubleSided: boolean;
  /** Index offset into {@link CompiledModel.indices}. */
  start: number;
  /** Number of indices in this group. */
  count: number;
}

/**
 * Fully baked geometry for one block state. Positions are already `1/16`-scaled,
 * `-0.5`-offset (cell centred on its integer coord, matching the instance matrix),
 * and rotated. Ready to drop into a THREE.BufferGeometry with material groups.
 */
export interface CompiledModel {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  groups: CompiledGroup[];
  /** No geometry produced (empty block-entity model, parse failure) → caller falls back. */
  empty: boolean;
}

// ─── Asset provider ───────────────────────────────────────────────────────────

/**
 * Source of model assets. One implementation reads the vanilla CDN mirror (main
 * thread), another reads a scanned mod JAR (worker). The resolver/compiler are
 * written against this interface so they don't care which.
 */
export interface AssetProvider {
  /** Load `assets/<ns>/blockstates/<name>.json`. `name` may be `ns:foo` or `foo`. */
  getBlockstate(name: string): Promise<Blockstate | null>;
  /** Load `assets/<ns>/models/<path>.json`. `ref` may be `ns:block/foo` or `block/foo`. */
  getModel(ref: string): Promise<RawModel | null>;
  /**
   * Resolve a texture ref ("ns:block/foo") to an ordered list of loadable srcs
   * (CDN URLs / data: URLs) — the loader tries them in order. Multiple entries let
   * a block fall back across version refs; a single source (mod JAR) returns one.
   */
  textureCandidates(ref: string): string[];
  /**
   * Rewrite a block id + states into the form this provider's asset tree uses,
   * before any blockstate is fetched. Only the pre-flattening CDN tree needs it
   * (see `legacy-compat.ts`); providers whose assets already match the loader's
   * modern ids omit it.
   */
  adaptStates?(blockId: string, states: Record<string, string>): {
    blockId: string;
    states: Record<string, string>;
  };
}
