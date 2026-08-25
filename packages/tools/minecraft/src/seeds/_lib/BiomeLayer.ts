/**
 * BiomeLayer.ts — the map itself, as a Leaflet tile layer.
 *
 * Leaflet does the part that is genuinely fiddly and entirely uninteresting:
 * which tiles are on screen, at what zoom, where they go as you drag, and when
 * to throw them away. What is left for us is `createTile` (ask the pool to
 * sample it, paint the answer) and `_removeTile` (tell the pool to forget it).
 *
 * ## Coordinates
 *
 * The CRS is `L.CRS.Simple`, so map units *are* Minecraft blocks and zoom Z
 * means 2^Z pixels per block — Z = -7 is 128 blocks/pixel. Latitude is negated
 * against world Z, because Leaflet's latitude increases upward and Minecraft's
 * Z increases south. That single sign is the only coordinate subtlety here, and
 * getting it backwards mirrors the world without ever looking broken.
 *
 * ## Repaint vs resample
 *
 * Sampled grids are kept per tile. Changing the view mode, hillshade or the
 * biome filter calls `repaint()`, which loops over cached typed arrays and
 * costs milliseconds. Only a new seed or pack stack throws the grids away.
 *
 * ## Progressive refinement
 *
 * A tile is asked for twice: once at a quarter of the sample density, which
 * lands ~16x sooner, and then at the requested quality. The coarse pass is
 * painted the moment it arrives and overwritten when the real one lands, so the
 * map is never blank while still ending up exact. It roughly doubles total
 * compute — the coarse pass is 1/16 of the fine one, so the overhead is about
 * 6% — in exchange for the screen filling in almost immediately.
 */

import * as L from "leaflet";

import { paintTile, type PaintOptions } from "./paint";
import type { SeedsPool } from "./pool";
import type { TileGrid, TileMode, TileRequest } from "./worker/seeds-api";
import { sampleIndex } from "./worker/seeds-api";
import type { BiomeStyler } from "./biomeColors";
import type { WaterMode } from "../_core/types";

import { QUALITY, type Quality } from "./mapMath";

/** World (x, z) → Leaflet LatLng. The negation is the north/south flip. */
export const worldToLatLng = (x: number, z: number): L.LatLngExpression => [-z, x];

/** Leaflet LatLng → world (x, z). */
export const latLngToWorld = (ll: L.LatLng): { x: number; z: number } => ({ x: ll.lng, z: -ll.lat });

export type { Quality };

/** Density of the first, throwaway pass. A quarter of the pixels in each axis. */
const PREVIEW_RESOLUTION = 1 / 4;

interface LiveTile {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  grid?: TileGrid;
  /** True while `grid` is the coarse preview and the real one is still coming. */
  preview: boolean;
  /** Blocks covered by the tile, for hover lookups. */
  x0: number;
  z0: number;
  span: number;
}

export interface BiomeLayerOptions extends L.GridLayerOptions {
  pool: SeedsPool;
  water?: WaterMode;
  quality?: Quality;
}

export interface HoverSample {
  readonly biome: string;
  readonly surfaceY: number;
  readonly isWater: boolean;
}

export class BiomeLayer extends L.GridLayer {
  private readonly pool: SeedsPool;
  private readonly water?: WaterMode;
  private quality: Quality;
  private readonly tiles = new Map<string, LiveTile>();

  private paint: PaintOptions;

  constructor(options: BiomeLayerOptions, paint: PaintOptions) {
    super(options);
    this.pool = options.pool;
    this.water = options.water;
    this.quality = options.quality ?? "balanced";
    this.paint = { hillshade: false, ...paint };
  }

  /**
   * Change how tiles are drawn without touching what was sampled. This is the
   * cheap path and the reason the worker returns grids: it is a repaint of data
   * already in hand, not a new question for the world.
   */
  setPaint(paint: PaintOptions): void {
    this.paint = paint;
    this.repaint();
  }

  /** Change sampling density. This one *does* resample — it is a new question. */
  setQuality(quality: Quality): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.redraw();
  }

  repaint(): void {
    for (const tile of this.tiles.values()) {
      if (tile.grid) this.draw(tile, tile.grid);
    }
  }

  /**
   * What is under a world coordinate, from the grid already on screen.
   *
   * Used for the crosshair readout rather than the hover tooltip: the tooltip
   * wants the *exact* biome and gets it from the main-thread evaluator, but
   * this agrees with the pixel being pointed at, which is the right answer when
   * the two differ.
   */
  sampleAt(x: number, z: number): HoverSample | null {
    for (const tile of this.tiles.values()) {
      if (!tile.grid) continue;
      if (x < tile.x0 || z < tile.z0 || x >= tile.x0 + tile.span || z >= tile.z0 + tile.span) continue;

      const g = tile.grid;
      const sx = Math.min(g.samples - 1, Math.max(0, Math.floor((x - g.x0) / g.step)));
      const sz = Math.min(g.samples - 1, Math.max(0, Math.floor((z - g.z0) / g.step)));
      const i = sampleIndex(g.samples, sx, sz);
      return {
        biome: g.palette[g.biome[i]!] ?? "minecraft:plains",
        surfaceY: g.surfaceY[i]!,
        isWater: g.water[i] === 1,
      };
    }
    return null;
  }

  private draw(tile: LiveTile, grid: TileGrid): void {
    const displaySize = this.getTileSize().x;
    const { pixels, size } = paintTile(grid, { ...this.paint, scale: displaySize / grid.samples });
    tile.canvas.width = size;
    tile.canvas.height = size;
    tile.ctx.putImageData(new ImageData(pixels, size, size), 0, 0);
  }

  protected createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const displaySize = this.getTileSize().x;
    const canvas = L.DomUtil.create("canvas", "leaflet-tile") as HTMLCanvasElement;
    canvas.width = canvas.height = displaySize;
    // Every sample is a real measurement; smoothing would invent terrain
    // between them and make a coarse map look more certain than it is.
    canvas.style.imageRendering = "pixelated";

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      done(new Error("2D canvas is unavailable."), canvas);
      return canvas;
    }

    // `_tileCoordsToKey` is Leaflet-internal but declared in @types/leaflet,
    // and it is the same key `_removeTile` will hand back — so the pool's
    // cancel and Leaflet's eviction always agree on what a tile is called.
    const key: string = this._tileCoordsToKey(coords);
    const bounds = this.tileWorldBounds(coords);

    const tile: LiveTile = {
      canvas,
      ctx,
      preview: false,
      x0: bounds.x0,
      z0: bounds.z0,
      span: bounds.span,
    };
    this.tiles.set(key, tile);

    // The coarse pass. Deliberately not awaited before the fine one is queued:
    // both sit in the pool's queue together and the cheap one simply finishes
    // first. Its result is thrown away as soon as the real grid lands.
    void this.pool
      .requestTile(`${key}#preview`, this.request(bounds, displaySize, PREVIEW_RESOLUTION))
      .then((grid) => {
        if (!grid || !this.tiles.has(key) || tile.grid) return;
        tile.preview = true;
        tile.grid = grid;
        this.draw(tile, grid);
      })
      .catch(() => {
        /* A failed preview is not worth reporting; the real pass will say so. */
      });

    this.pool
      .requestTile(key, this.request(bounds, displaySize, QUALITY[this.quality]))
      .then((grid) => {
        // Cancelled or stale. Leaflet still needs `done()` or it keeps the tile
        // marked loading forever and never asks for it again.
        if (!grid || !this.tiles.has(key)) {
          done(undefined, canvas);
          return;
        }
        tile.preview = false;
        tile.grid = grid;
        this.draw(tile, grid);
        done(undefined, canvas);
      })
      .catch((err) => done(err instanceof Error ? err : new Error(String(err)), canvas));

    return canvas;
  }

  /** The world-space square a tile covers. */
  private tileWorldBounds(coords: L.Coords): { x0: number; z0: number; span: number } {
    // @ts-expect-error _tileCoordsToBounds is Leaflet-internal but stable.
    const bounds: L.LatLngBounds = this._tileCoordsToBounds(coords);
    const west = bounds.getWest();
    const north = bounds.getNorth();
    // North is the *smallest* world Z, and latitude is negated, so the tile's
    // top-left in world space is (west, -north).
    return { x0: west, z0: -north, span: bounds.getEast() - west };
  }

  private request(
    bounds: { x0: number; z0: number; span: number },
    displaySize: number,
    resolution: number,
  ): TileRequest {
    const samples = Math.max(8, Math.round(displaySize * resolution));
    return {
      x0: bounds.x0,
      z0: bounds.z0,
      samples,
      // Derived from the tile's own extent rather than from the zoom, so a
      // fractional zoom cannot silently desynchronise the sampled area from the
      // painted one.
      step: bounds.span / samples,
      water: this.water,
    };
  }

  protected _removeTile(key: string): void {
    this.pool.cancelTile(key);
    this.pool.cancelTile(`${key}#preview`);
    this.tiles.delete(key);
    // @ts-expect-error calling through to the prototype implementation.
    L.GridLayer.prototype._removeTile.call(this, key);
  }
}
