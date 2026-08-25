/**
 * Graticule.ts — coordinate grid over the world.
 *
 * jacobsjo/mc-datapack-map has one of these too, adapted from
 * Leaflet.SimpleGraticule and Leaflet.AutoGraticule (both BSD-2). This is a
 * fresh implementation rather than a port of a port: what it has to do is draw
 * lines on a multiple and label them, and inheriting two layers of third-party
 * licensing for eighty lines of arithmetic is a poor trade.
 *
 * The spacing is chosen from the zoom so the grid stays roughly the same
 * density on screen — a fixed 512-block grid is a useful landmark when you are
 * looking at a few thousand blocks and an unreadable hatch when you are looking
 * at a hundred thousand. Spacings are powers of two times 16, because that is
 * how Minecraft itself is divided (a chunk is 16, a region is 512) and a grid
 * on any other multiple would be lying about where the seams are.
 */

import * as L from "leaflet";

import { gridSpacingFor } from "./mapMath";

export interface GraticuleOptions {
  /** Line colour. Defaults to something that survives both map themes. */
  color?: string;
  opacity?: number;
  /** Draw coordinate labels along the top and left edges. */
  labels?: boolean;
}

/**
 * Resolved form. Spelled out rather than `Required<GraticuleOptions>` because
 * these are *our* options only — extending `L.LayerOptions` would drag `pane`
 * and `attribution` into the required set, and this layer sets neither.
 */
interface ResolvedOptions {
  color: string;
  opacity: number;
  labels: boolean;
}

export class Graticule extends L.Layer {
  private container: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private opts: ResolvedOptions;

  constructor(options: GraticuleOptions = {}) {
    super();
    this.opts = {
      color: options.color ?? "rgba(255, 255, 255, 0.28)",
      opacity: options.opacity ?? 1,
      labels: options.labels ?? true,
    };
  }

  onAdd(map: L.Map): this {
    this.container = L.DomUtil.create("div", "leaflet-graticule") as HTMLDivElement;
    // The grid is decoration over a map you drag; it must never eat a gesture.
    this.container.style.pointerEvents = "none";
    this.container.style.position = "absolute";
    this.container.style.inset = "0";

    this.canvas = L.DomUtil.create("canvas", "", this.container) as HTMLCanvasElement;
    this.canvas.style.position = "absolute";
    this.canvas.style.inset = "0";

    map.getPanes().overlayPane?.appendChild(this.container);
    map.on("move zoom viewreset resize", this.redraw, this);
    this.redraw();
    return this;
  }

  onRemove(map: L.Map): this {
    map.off("move zoom viewreset resize", this.redraw, this);
    this.container?.remove();
    this.container = null;
    this.canvas = null;
    return this;
  }

  private redraw = (): void => {
    const map = this._map;
    const canvas = this.canvas;
    const container = this.container;
    if (!map || !canvas || !container) return;

    // The overlay pane is transformed as the map pans; undo that so the canvas
    // stays glued to the viewport and we can draw in plain screen pixels.
    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(container, topLeft);

    const size = map.getSize();
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.x, size.y);

    const bpp = 2 ** -map.getZoom();
    const spacing = gridSpacingFor(bpp);

    const bounds = map.getBounds();
    const west = bounds.getWest();
    const east = bounds.getEast();
    // Latitude is negated against world Z, so the northern edge is min Z.
    const north = -bounds.getNorth();
    const south = -bounds.getSouth();

    ctx.strokeStyle = this.opts.color;
    ctx.globalAlpha = this.opts.opacity;
    ctx.lineWidth = 1;
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = this.opts.color;
    ctx.textBaseline = "top";

    ctx.beginPath();

    for (let x = Math.ceil(west / spacing) * spacing; x <= east; x += spacing) {
      // +0.5 puts the stroke on a pixel centre; without it a 1px line
      // straddles two device pixels and renders as a 2px blur.
      const px = Math.round(map.latLngToContainerPoint([0, x]).x) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, size.y);
      if (this.opts.labels) ctx.fillText(String(x), px + 3, 3);
    }

    for (let z = Math.ceil(north / spacing) * spacing; z <= south; z += spacing) {
      const py = Math.round(map.latLngToContainerPoint([-z, 0]).y) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(size.x, py);
      if (this.opts.labels) ctx.fillText(String(z), 3, py + 3);
    }

    ctx.stroke();
  };
}
