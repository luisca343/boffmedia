"use client";

/**
 * SeedMap — the Leaflet map, wrapped so React never fights it.
 *
 * Leaflet owns its DOM subtree outright. React is therefore allowed to create
 * the container and nothing else: the map, the layers and every tile are made
 * in effects and torn down in their cleanups. The one rule that keeps this
 * honest is that no Leaflet object is ever put in React state — state changes
 * flow *into* Leaflet through imperative calls, never the other way.
 *
 * ## Why Leaflet is imported inside the effect
 *
 * Leaflet reads `window` at module scope, and `"use client"` does not mean
 * "browser only" — Next still server-renders client components for the initial
 * HTML, so a top-level `import "leaflet"` is a 500 before anything reaches a
 * browser. The obvious fix is `next/dynamic` with `ssr: false`, which this
 * package is not allowed to use: it also runs under Vite in the launcher and in
 * the Tauri shell. Importing inside the effect is the host-agnostic version of
 * the same idea — effects only ever run in a browser — and it keeps Leaflet and
 * its CSS out of the initial chunk as a bonus.
 */

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";

import type { BiomeLayer as BiomeLayerType } from "../_lib/BiomeLayer";
import type { Quality } from "../_lib/mapMath";
import type { SeedsPool } from "../_lib/pool";
import type { LocalWorld } from "../_lib/localWorld";
import type { BiomeStyler } from "../_lib/biomeColors";
import type { TileMode } from "../_lib/worker/seeds-api";
import type { WaterMode } from "../_core/types";

/**
 * Zoom is the base-2 exponent of pixels per block: -7 is 128 blocks/pixel, -1
 * is 2. Sampling cost per tile is flat — a tile is always the same number of
 * samples — so the range is bounded by what is *useful* to look at, not by what
 * is affordable.
 *
 * The floor is a legibility limit, not a performance one, and it was set by
 * looking at the result. Past about 128 blocks/pixel each pixel is a sample
 * further from its neighbour than most biome regions are wide, so adjacent
 * pixels stop being related and the map turns to salt-and-pepper — it is
 * aliasing, and no amount of sampling detail fixes it because the detail is
 * genuinely there. jacobsjo/mc-datapack-map stops at -6 for the same reason.
 */
const MIN_ZOOM = -7;
const MAX_ZOOM = -1;

export interface HoverInfo {
  x: number;
  z: number;
  biome: string;
  surfaceY: number;
  isWater: boolean;
}

/**
 * Tooltip chrome, as important-flagged utilities.
 *
 * `leaflet.css` is imported at runtime and therefore lands *after* Tailwind in
 * the cascade, so `.leaflet-tooltip`'s own white background and border beat a
 * plain utility class of equal specificity. `!` is the same escape the map
 * container already uses for `!bg-base`. The `before:` half recolours the
 * arrow, which is a pseudo-element and cannot be reached any other way.
 */
const TOOLTIP_CLASS =
  "!bg-panel !border !border-solid !border-line-2 !text-txt !font-mono !text-[11px] " +
  "!shadow-none before:!border-t-panel";

export interface SeedMapProps {
  /** Tooltip for the spawn marker — the only place spawn is named now. */
  spawnTitle?: string;
  /**
   * The engine is fetched, never passed.
   *
   * `SeedsPool` holds Comlink `Remote` proxies, and React 19's dev render
   * logger walks every prop looking for something to print. A proxy traps
   * `Symbol.toPrimitive` and hands back another proxy, so the walk dies with
   * "Cannot convert object to primitive value" and takes the render with it.
   * A function prop is opaque to that walk; `engineKey` is the primitive that
   * actually tells React when the engine changed.
   */
  getEngine: () => { pool: SeedsPool; local: LocalWorld } | null;
  engineKey: string;
  styler: BiomeStyler | null;
  mode: TileMode;
  hillshade: boolean;
  grid: boolean;
  quality: Quality;
  water?: WaterMode;
  highlight?: ReadonlySet<string>;
  spawn?: { x: number; z: number } | null;
  /**
   * Where the spec's locations actually resolved to on this seed. A discovered
   * location moves from seed to seed, so these are an OUTPUT of evaluation, not
   * an input the user positioned — which is exactly why they are worth drawing:
   * "north_city passed" means nothing until you can see where it landed.
   */
  sites?: readonly { name: string; x: number; z: number; pass: boolean }[];
  /**
   * Centre the map here. `n` is a nonce, not data: clicking the same site twice
   * must recentre both times, and an object compared by identity is the only
   * thing an effect can react to when the coordinates have not changed.
   */
  focus?: { x: number; z: number; n: number } | null;
  /** Bumped by the host to force a resample — a new seed or pack stack. */
  worldVersion: number;
  initialView: { x: number; z: number; zoom: number };
  onHover?: (info: HoverInfo | null) => void;
  onPick?: (x: number, z: number) => void;
  onViewChange?: (x: number, z: number, zoom: number) => void;
  className?: string;
}

export function SeedMap({
  getEngine,
  engineKey,
  styler,
  mode,
  hillshade,
  grid,
  quality,
  water,
  highlight,
  spawn,
  spawnTitle,
  sites,
  focus,
  worldVersion,
  initialView,
  onHover,
  onPick,
  onViewChange,
  className,
}: SeedMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<BiomeLayerType | null>(null);
  const graticuleRef = useRef<Leaflet.Layer | null>(null);
  const spawnRef = useRef<Leaflet.Marker | null>(null);
  const siteRefs = useRef<Leaflet.Marker[]>([]);
  const [ready, setReady] = useState(false);

  // Read inside Leaflet callbacks, which outlive any single render and would
  // otherwise capture stale props.
  const cb = useRef({ onHover, onPick, onViewChange, getEngine });
  cb.current = { onHover, onPick, onViewChange, getEngine };
  const paintRef = useRef({ mode, styler, hillshade, highlight });
  paintRef.current = { mode, styler, hillshade, highlight };
  const viewRef = useRef(initialView);
  const spawnTitleRef = useRef(spawnTitle);
  spawnTitleRef.current = spawnTitle;

  useEffect(() => {
    const container = containerRef.current;
    const pool = getEngine()?.pool;
    if (!container || !pool) return;

    let map: Leaflet.Map | null = null;
    // The effect can be torn down before the dynamic import resolves — React
    // strict mode does exactly that on every mount. Without this guard we would
    // build a map into a container that is already gone.
    let cancelled = false;

    void (async () => {
      const [L, { BiomeLayer, latLngToWorld, worldToLatLng }, { Graticule }] = await Promise.all([
        import("leaflet"),
        import("../_lib/BiomeLayer"),
        import("../_lib/Graticule"),
        // @ts-ignore — a stylesheet is not a module TypeScript can resolve, but
        // every bundler this package runs under turns it into a <link>. It has
        // to be `@ts-ignore` and not `@ts-expect-error`: apps/desktop builds
        // with Vite, whose client types DO declare `*.css`, so there the error
        // does not occur and `expect-error` would itself fail. One directive
        // cannot be "expected" in two hosts and absent in a third.
        import("leaflet/dist/leaflet.css"),
      ]);
      if (cancelled) return;

      const view = viewRef.current;
      map = L.map(container, {
        // Map units are Minecraft blocks. Simple is the only CRS that means
        // that; anything geographic would bend a flat world onto a globe.
        crs: L.CRS.Simple,
        center: worldToLatLng(view.x, view.z),
        zoom: view.zoom,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        attributionControl: false,
        // Sampling a tile costs seconds, so momentum panning would queue a
        // screenful of work the user has already flown past.
        inertia: false,
        // Whole zoom levels only. A fractional zoom would make every tile a new
        // sampling job at a spacing nothing else shares, so the cache would miss
        // on every gesture and zooming back out would re-derive the world.
        zoomSnap: 1,
      });
      mapRef.current = map;

      const layer = new BiomeLayer(
        {
          pool,
          water,
          quality,
          tileSize: 256,
          noWrap: true,
          keepBuffer: 2,
          // These repeat the map's zoom range on purpose, and leaving them off
          // is silent and total: `GridLayer._pruneTiles` tests the zoom against
          // the *layer's* own minZoom, which defaults to 0. At any negative
          // zoom every prune therefore called `_removeAllTiles`, so tiles were
          // sampled, painted and wiped before a frame was drawn — no error, no
          // warning, just an empty map.
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          // Don't queue work for zoom levels the user is flying through, and
          // don't start sampling mid-drag. Tiles cost seconds; anything
          // requested during a gesture is usually obsolete before it runs.
          updateWhenZooming: false,
          updateWhenIdle: true,
        },
        { ...paintRef.current, styler: paintRef.current.styler! },
      );
      layer.addTo(map);
      layerRef.current = layer;

      const graticule = new Graticule();
      if (grid) graticule.addTo(map);
      graticuleRef.current = graticule;

      const reportView = () => {
        if (!map) return;
        const c = latLngToWorld(map.getCenter());
        // Tells the queue what to sample first, so a pan fills the middle of
        // the screen before the corners.
        pool.setFocus(c.x, c.z);
        cb.current.onViewChange?.(c.x, c.z, map.getZoom());
      };
      map.on("moveend zoomend", reportView);
      reportView();

      map.on("mousemove", (ev: Leaflet.LeafletMouseEvent) => {
        const { x, z } = latLngToWorld(ev.latlng);
        // Exact, synchronously, on the main thread — the whole reason
        // `LocalWorld` exists. Falls back to the painted tile until it is
        // built, so the readout is never empty just because the extra
        // evaluator is still loading.
        const s = cb.current.getEngine()?.local.sampleAt(x, z) ?? layerRef.current?.sampleAt(x, z) ?? null;
        cb.current.onHover?.(s ? { x: Math.round(x), z: Math.round(z), ...s } : null);
      });
      map.on("mouseout", () => cb.current.onHover?.(null));

      map.on("click", (ev: Leaflet.LeafletMouseEvent) => {
        const { x, z } = latLngToWorld(ev.latlng);
        cb.current.onPick?.(Math.round(x), Math.round(z));
      });

      setReady(true);
    })();

    return () => {
      cancelled = true;
      setReady(false);
      layerRef.current = null;
      graticuleRef.current = null;
      spawnRef.current = null;
      // `map.remove()` drops the layers with the map, so these are dangling
      // references rather than leaked markers — but a stale array would make
      // the next site effect call `removeLayer` on a destroyed map.
      siteRefs.current = [];
      mapRef.current = null;
      map?.remove();
    };
    // `water` is a sampling input, so changing it has to rebuild the layer;
    // everything else is display and goes through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getEngine is read
    // through the ref above; `engineKey` is what actually changes.
  }, [engineKey, water]);

  // Display-only changes: repaint from the grids already sampled. Milliseconds.
  useEffect(() => {
    if (!ready || !styler) return;
    layerRef.current?.setPaint({ mode, styler, hillshade, highlight });
  }, [ready, mode, styler, hillshade, highlight]);

  // Sampling density is not display-only — it is a different question.
  useEffect(() => {
    if (!ready) return;
    layerRef.current?.setQuality(quality);
  }, [ready, quality]);

  useEffect(() => {
    const map = mapRef.current;
    const graticule = graticuleRef.current;
    if (!ready || !map || !graticule) return;
    if (grid) graticule.addTo(map);
    else map.removeLayer(graticule);
  }, [ready, grid]);

  // The spawn marker. Rebuilt rather than moved, because it appears and
  // disappears with the seed and Leaflet has no cheap "maybe move" call.
  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    void import("leaflet").then((L) => {
      const map = mapRef.current;
      if (cancelled || !map) return;
      if (spawnRef.current) {
        map.removeLayer(spawnRef.current);
        spawnRef.current = null;
      }
      if (!spawn) return;

      // Styled inline rather than via a class: `leaflet-div-icon` ships its own
      // white background and border, and a package that fought those from a
      // stylesheet would need that stylesheet loaded in all three hosts.
      //
      // A ring rather than a filled dot, so the biome underneath stays visible —
      // the point of marking spawn is to see what is *at* spawn. The dark outer
      // stroke is what keeps it findable over both a bright desert and a deep
      // ocean; a single-colour marker disappears into one or the other.
      const icon = L.divIcon({
        className: "",
        html:
          '<span aria-hidden="true" style="display:block;width:18px;height:18px;box-sizing:border-box;' +
          "border:3px solid #fff;border-radius:50%;" +
          "box-shadow:0 0 0 2px rgba(0,0,0,.7), inset 0 0 0 2px rgba(0,0,0,.7);" +
          'background:transparent"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      // `interactive: true` is what makes the label reachable at all:
      // `.leaflet-marker-icon` is `pointer-events: none` in leaflet.css unless
      // it also carries `.leaflet-interactive`, so the `title` this marker used
      // to pass could never fire a tooltip — it was dead the whole time.
      spawnRef.current = L.marker([-spawn.z, spawn.x], { icon, interactive: true })
        .bindTooltip(spawnTitleRef.current ?? "", {
          direction: "top",
          offset: [0, -10],
          className: TOOLTIP_CLASS,
        })
        .addTo(map);
    });

    return () => {
      cancelled = true;
    };
  }, [ready, spawn]);

  // The spec's resolved sites. Same rebuild-don't-move approach as spawn, and
  // for a stronger reason: the whole set changes together on every
  // re-evaluation, so there is never a case where moving one would be cheaper.
  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    void import("leaflet").then((L) => {
      const map = mapRef.current;
      if (cancelled || !map) return;

      for (const marker of siteRefs.current) map.removeLayer(marker);
      siteRefs.current = [];
      if (!sites?.length) return;

      for (const site of sites) {
        // Square, so it never reads as another spawn ring, and coloured by
        // verdict: a failing site is the one you are trying to find, so it has
        // to be visible rather than hidden until it passes.
        const colour = site.pass ? "#6ee7a8" : "#f87171";
        const icon = L.divIcon({
          className: "",
          html:
            '<span aria-hidden="true" style="display:block;width:14px;height:14px;box-sizing:border-box;' +
            `border:3px solid ${colour};` +
            'box-shadow:0 0 0 2px rgba(0,0,0,.7), inset 0 0 0 1px rgba(0,0,0,.7);' +
            'background:transparent"></span>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const marker = L.marker([-site.z, site.x], { icon, interactive: true })
          .bindTooltip(site.name, {
            direction: "top",
            offset: [0, -8],
            className: TOOLTIP_CLASS,
          })
          // An interactive marker swallows the map click underneath it, so the
          // click is forwarded rather than lost — and pinning the site's own
          // coordinates is a better answer than the pixel the cursor happened
          // to be on.
          .on("click", () => cb.current.onPick?.(site.x, site.z))
          .addTo(map);
        siteRefs.current.push(marker);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ready, sites]);

  // Recentre on a site the user asked to see. `setView` rather than `flyTo`:
  // the animation would fire a stream of `moveend`s, each one re-prioritising
  // the tile queue toward a position the user is only passing through.
  useEffect(() => {
    if (!ready || !focus) return;
    const map = mapRef.current;
    if (!map) return;
    map.setView([-focus.z, focus.x], map.getZoom());
  }, [ready, focus]);

  // A new seed or stack invalidates the samples themselves. Seconds.
  useEffect(() => {
    if (!ready || worldVersion === 0) return;
    getEngine()?.pool.invalidate();
    layerRef.current?.redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see getEngine above.
  }, [ready, worldVersion, engineKey]);

  return <div ref={containerRef} className={className} />;
}
