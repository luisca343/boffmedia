import type { Pack, PackMode } from "./types";

export declare const WORLDGEN_CATEGORIES: readonly string[];
export declare const AUDIT_CATEGORIES: readonly string[];
/** Exact-match files kept for display (biome colours, structure icons). */
export declare const DATA_FILES: readonly string[];

/** The pack filter itself, shared with the bundle builder so the two cannot drift. */
export declare function wanted(rel: string, mode: PackMode): boolean;

/** A pack from .zip/.jar bytes — Modrinth's CDN, or a `File` the user dragged in. */
export declare function packFromZip(
  bytes: Uint8Array,
  name: string,
  opts?: { mode?: PackMode; kind?: string; source?: string },
): Pack;

/** A pack from an already-flat file map. */
export declare function packFromFiles(
  entries: Map<string, Uint8Array> | Record<string, Uint8Array>,
  name: string,
  opts?: { mode?: PackMode; kind?: string; source?: string },
): Pack;

/** A pack from a curated bundle. The only way a browser can load *vanilla*. */
export declare function packFromBundle(
  bytes: Uint8Array,
  name: string,
  opts?: { mode?: PackMode; source?: string },
): Pack;

/** Packs stacked low -> high priority; later packs override earlier ones. */
export declare class PackStack {
  constructor(packs: Pack[]);
  readonly packs: Pack[];
  has(rel: string): boolean;
  /** Every winning path in the stack, for whole-path matching. */
  paths(): IterableIterator<string>;
  raw(rel: string): Uint8Array | undefined;
  text(rel: string): string | undefined;
  json(rel: string): unknown;
  providerOf(rel: string): string | undefined;
  ids(category: string): Map<string, string>;
  contributors(category: string): Map<string, string[]>;
}
