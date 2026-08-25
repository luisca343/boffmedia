/**
 * paint.ts — turn a sampled tile into pixels.
 *
 * The CLI hand-rolls a PNG encoder over `node:zlib` because it has to write a
 * file. A browser does not: the canvas wants RGBA, so the encoder, the CRC
 * table and the deflate all disappear and we fill an `ImageData` buffer
 * directly.
 *
 * This runs on the main thread, and cheaply — a repaint is milliseconds against
 * seconds to sample. That is the whole reason `computeTile` hands back the grid
 * rather than pixels: changing the view mode, toggling hillshade or filtering
 * to one biome are all questions about *display*, and none of them are reasons
 * to ask the world anything again.
 */

import type { BiomeStyler, Rgb } from "./biomeColors";
import type { TileGrid, TileMode } from "./worker/seeds-api";

const OCEAN: Rgb = [24, 52, 110];
const SHALLOW: Rgb = [46, 92, 160];
const LAND: Rgb = [92, 130, 74];

/**
 * Hillshade: a light 20° above the horizon from the north-west, with the
 * surface gradient deciding how much of it a pixel catches. Light direction and
 * the 0.3–1.0 output range match jacobsjo/mc-datapack-map so the two render
 * comparable relief.
 *
 * The output is squashed into 0.3–1.0 rather than 0–1 deliberately. A pixel
 * facing away from the light is still *land*, and its biome colour is the
 * information the map exists to carry; letting shading drive it to black would
 * trade the thing being measured for the thing making it legible.
 *
 * ## Why the z-factor exists
 *
 * Textbook hillshade divides the rise by the horizontal run, and at these
 * scales that is correct and useless: at 128 blocks per sample a 20-block cliff
 * between neighbours is a 1.1° slope, which shades it by about 3% — measured,
 * and invisible. Terrain really is near-flat when you look at it from that far
 * away.
 *
 * So the run is a z-factor instead, which is the standard GIS answer to exactly
 * this (vertical exaggeration on a wide DEM). Tuned so a rise of roughly
 * `HILLSHADE_RELIEF` blocks between adjacent samples reads as a 45° face. It
 * makes shading a function of "how fast does height change from one sample to
 * the next" rather than of true slope, which is what you want from a map you
 * zoom: relief stays legible at every zoom instead of fading out as you pull
 * back.
 */
const ZENITH = (20.0 * Math.PI) / 180.0;
const AZIMUTH = (135.0 * Math.PI) / 180.0;

/** Blocks of rise between adjacent samples that should read as a 45° face. */
const HILLSHADE_RELIEF = 12;

export function hillshade(slopeX: number, slopeZ: number): number {
  // Both gradients are centred differences over two samples, so the factor of
  // two is folded into the constant rather than written out.
  const slope = Math.atan(Math.sqrt(slopeX * slopeX + slopeZ * slopeZ) / (2 * HILLSHADE_RELIEF));
  const aspect = slopeX === 0 ? (slopeZ < 0 ? Math.PI : 0) : Math.atan2(slopeZ, -slopeX);

  const shade =
    Math.cos(ZENITH) * Math.cos(slope) + Math.sin(ZENITH) * Math.sin(slope) * Math.cos(AZIMUTH - aspect);

  return Math.max(0, shade) * 0.7 + 0.3;
}

export interface PaintOptions {
  readonly mode: TileMode;
  readonly styler: BiomeStyler;
  /** Relief shading from the surface gradient. Free — the height is sampled anyway. */
  readonly hillshade?: boolean;
  /**
   * Pixels per sample. Greater than 1 when the tile was sampled below display
   * resolution; each sample then paints a solid `scale`×`scale` block.
   */
  readonly scale?: number;
  /**
   * When non-empty, only these biome ids keep their colour; everything else is
   * drawn washed out, so matches read against the surrounding world instead of
   * floating in an empty frame.
   */
  readonly highlight?: ReadonlySet<string>;
}

export interface PaintedTile {
  readonly pixels: Uint8ClampedArray<ArrayBuffer>;
  /** Side length in pixels — `samples * scale`. */
  readonly size: number;
}

/**
 * Paint a tile as RGBA. Fully opaque — a tile is a complete picture of its
 * area, and a transparent pixel would read as "still loading".
 *
 * The buffer is pinned to `ArrayBuffer` rather than `ArrayBufferLike` because
 * `new ImageData()` will not take a possibly-shared one.
 */
export function paintTile(tile: TileGrid, opts: PaintOptions): PaintedTile {
  const { samples, seaLevel } = tile;
  const scale = Math.max(1, Math.round(opts.scale ?? 1));
  const stride = samples + 2;
  const size = samples * scale;
  const rgba = new Uint8ClampedArray(size * size * 4);

  // Resolved once per tile, then indexed by the same Uint16 the grid stores.
  // A map lookup per pixel is exactly the per-sample cost the bulk sampling
  // path exists to avoid.
  const styles = opts.styler.stylesFor(tile.palette);
  const filtering = !!opts.highlight?.size;

  for (let sz = 0; sz < samples; sz++) {
    for (let sx = 0; sx < samples; sx++) {
      const i = (sz + 1) * stride + (sx + 1);
      const isWater = tile.water[i] === 1;
      const y = tile.surfaceY[i]!;

      let r: number;
      let g: number;
      let b: number;

      if (opts.mode === "water") {
        [r, g, b] = isWater ? OCEAN : LAND;
      } else if (opts.mode === "terrain") {
        if (isWater) {
          // The depth ramp bottoms out 45 blocks below sea level: past that
          // every ocean is the same colour and the ramp only wastes range.
          const d = Math.min(1, Math.max(0, (seaLevel - y) / 45));
          r = SHALLOW[0] + (OCEAN[0] - SHALLOW[0]) * d;
          g = SHALLOW[1] + (OCEAN[1] - SHALLOW[1]) * d;
          b = SHALLOW[2] + (OCEAN[2] - SHALLOW[2]) * d;
        } else {
          const t = Math.min(1, Math.max(0, (y - seaLevel) / 130));
          r = 70 + t * 175;
          g = 120 + t * 110;
          b = 60 + t * 130;
        }
      } else {
        const style = styles[tile.biome[i]!];
        const c = style?.color ?? LAND;
        if (isWater) {
          // Water is pushed toward blue rather than replaced, so ocean
          // *variants* stay distinguishable instead of collapsing to one colour.
          r = c[0] * 0.55;
          g = c[1] * 0.6;
          b = c[2] * 0.85 + 40;
        } else {
          [r, g, b] = c;
        }
      }

      if (opts.hillshade && !isWater) {
        // Land only: the sampled "surface" under an ocean is the seabed, and
        // shading it would draw relief the player can never see.
        const shade = hillshade(
          tile.surfaceY[i + 1]! - tile.surfaceY[i - 1]!,
          tile.surfaceY[i + stride]! - tile.surfaceY[i - stride]!,
        );
        r *= shade;
        g *= shade;
        b *= shade;
      }

      if (filtering && !opts.highlight!.has(tile.palette[tile.biome[i]!] ?? "")) {
        // Washed toward its own luminance rather than dimmed to grey, so a
        // filtered map still reads as the same landscape underneath.
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = lum * 0.55 + 40;
        g = lum * 0.55 + 40;
        b = lum * 0.55 + 40;
      }

      // One sample fills a scale×scale block. The common case is scale === 1,
      // and the inner loops collapse to a single write there.
      for (let py = 0; py < scale; py++) {
        let o = ((sz * scale + py) * size + sx * scale) * 4;
        for (let px = 0; px < scale; px++) {
          rgba[o] = r;
          rgba[o + 1] = g;
          rgba[o + 2] = b;
          rgba[o + 3] = 255;
          o += 4;
        }
      }
    }
  }

  return { pixels: rgba, size };
}
