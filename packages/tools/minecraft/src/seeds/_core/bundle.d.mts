/**
 * `deflate` / `inflate` are injected so this module needs no fflate of its own:
 * the build script passes Node's, the browser passes fflate's.
 */
export declare function packBundle(
  files: Record<string, Uint8Array> | Map<string, Uint8Array>,
  deflate: (b: Uint8Array, o?: object) => Uint8Array,
): Uint8Array;

export declare function unpackBundle(
  bytes: Uint8Array,
  inflate: (b: Uint8Array) => Uint8Array,
): Map<string, Uint8Array>;
