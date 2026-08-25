/**
 * mapMath.ts — map arithmetic with no Leaflet in it.
 *
 * These live apart from `BiomeLayer` and `Graticule` for one hard reason: both
 * of those import Leaflet at module scope, and Leaflet reads `window` at module
 * scope. Anything that imports them is unrenderable on the server, so a tool
 * component that wanted nothing but `blocksPerPixel` would take the whole map
 * stack — and a 500 — with it.
 *
 * Everything here is a pure function of a number, so it costs nothing to import
 * anywhere.
 */

/** Blocks per pixel at a zoom level. Zoom is the exponent, so this is exact. */
export const blocksPerPixel = (zoom: number): number => 2 ** -zoom;

/**
 * Sampling density, as a fraction of the tile's pixels.
 *
 * This is the one knob that trades fidelity for speed, and it is quadratic:
 * "balanced" samples a quarter as many points as "full" and so costs a quarter
 * as much. What it costs you is spatial detail — at 4 blocks/pixel, "fast"
 * means one sample every 16 blocks, which will miss a narrow river.
 */
export const QUALITY = {
  full: 1,
  balanced: 1 / 2,
  fast: 1 / 4,
} as const;

export type Quality = keyof typeof QUALITY;

/**
 * Candidate grid spacings in blocks: a chunk, then doublings up to a region
 * grid and beyond. Powers of two times 16 because that is how Minecraft itself
 * is divided — a chunk is 16, a region is 512 — and a grid on any other
 * multiple would be lying about where the seams are.
 */
const SPACINGS = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

/** Aim for a grid line roughly every this many pixels. */
const TARGET_PIXELS = 140;

/**
 * Grid spacing for a zoom level, so the grid stays about the same density on
 * screen. A fixed 512-block grid is a useful landmark at a few thousand blocks
 * and an unreadable hatch at a hundred thousand.
 */
export function gridSpacingFor(blocksPerPixelValue: number): number {
  const want = blocksPerPixelValue * TARGET_PIXELS;
  return SPACINGS.find((s) => s >= want) ?? SPACINGS[SPACINGS.length - 1]!;
}
