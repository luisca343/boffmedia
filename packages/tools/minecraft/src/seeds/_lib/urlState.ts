/**
 * urlState.ts — the view, as a link.
 *
 * Everything that decides what you are looking at lives in the URL hash: seed,
 * pack stack, position, zoom, view mode. So a link is a whole view, and a
 * reload puts you back where you were.
 *
 * The hash, not the query string, and that is the point rather than a style
 * choice: the fragment is never sent to the server, so a shared link cannot put
 * someone's pack list or seed into our access logs. It also means a change
 * costs nothing — no request, no re-render from the framework.
 *
 * Written with `replaceState`, so panning a map does not fill the back button
 * with a thousand entries the user never asked to navigate.
 */

import type { TileMode } from "./worker/seeds-api";
import type { Quality } from "./BiomeLayer";

export interface ViewState {
  seed: string;
  packs: string[];
  x: number;
  z: number;
  zoom: number;
  mode: TileMode;
  hillshade: boolean;
  grid: boolean;
  quality: Quality;
}

const MODES: TileMode[] = ["biome", "terrain", "water"];
const QUALITIES: Quality[] = ["full", "balanced", "fast"];

export function readViewState(defaults: ViewState): ViewState {
  if (typeof window === "undefined") return defaults;

  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return defaults;

  const p = new URLSearchParams(raw);
  const num = (key: string, fallback: number) => {
    const v = Number(p.get(key));
    return Number.isFinite(v) ? v : fallback;
  };

  const packs = p.get("packs")?.split(",").filter(Boolean);
  const mode = p.get("mode") as TileMode | null;
  const quality = p.get("q") as Quality | null;

  return {
    // Seeds are text: "0" and "glacier" are both valid, and both must survive a
    // round trip through the URL unchanged.
    seed: p.get("seed") ?? defaults.seed,
    packs: packs?.length ? packs : defaults.packs,
    x: num("x", defaults.x),
    z: num("z", defaults.z),
    zoom: num("zoom", defaults.zoom),
    mode: mode && MODES.includes(mode) ? mode : defaults.mode,
    hillshade: p.has("shade") ? p.get("shade") === "1" : defaults.hillshade,
    grid: p.has("grid") ? p.get("grid") === "1" : defaults.grid,
    quality: quality && QUALITIES.includes(quality) ? quality : defaults.quality,
  };
}

export function writeViewState(state: ViewState, defaults: ViewState): void {
  if (typeof window === "undefined") return;

  const p = new URLSearchParams();
  // Only what differs from the defaults, so the common case is a bare URL and a
  // shared link says exactly what the sender changed.
  if (state.seed !== defaults.seed) p.set("seed", state.seed);
  if (state.packs.join(",") !== defaults.packs.join(",")) p.set("packs", state.packs.join(","));
  if (Math.round(state.x) !== defaults.x) p.set("x", String(Math.round(state.x)));
  if (Math.round(state.z) !== defaults.z) p.set("z", String(Math.round(state.z)));
  if (state.zoom !== defaults.zoom) p.set("zoom", String(state.zoom));
  if (state.mode !== defaults.mode) p.set("mode", state.mode);
  if (state.hillshade !== defaults.hillshade) p.set("shade", state.hillshade ? "1" : "0");
  if (state.grid !== defaults.grid) p.set("grid", state.grid ? "1" : "0");
  if (state.quality !== defaults.quality) p.set("q", state.quality);

  const hash = p.toString();
  const url = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ""}`;
  window.history.replaceState(null, "", url);
}

/**
 * The teleport command for a point. Y is `~` rather than the sampled surface
 * height on purpose: the evaluator knows where the terrain surface is but not
 * what is standing on it, and a hardcoded Y would drop the player inside a tree
 * or a Terralith overhang. `~` keeps their current height, and the game's own
 * safe-landing handles the rest.
 */
export function teleportCommand(x: number, z: number): string {
  return `/tp @s ${Math.round(x)} ~ ${Math.round(z)}`;
}
