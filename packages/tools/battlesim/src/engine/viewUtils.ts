// Every scene measurement is authored against a 960px-wide field; the live
// canvas width scales them. That width used to be re-derived from
// `window.screen.width * 0.6` on every call, which is the physical monitor,
// not the box the canvas actually has — a half-width window, the fullscreen
// toggle and the launcher's narrower pane all laid sprites out for a canvas
// that did not exist. The width is now PUBLISHED by the React canvas (it
// measures its own box with a ResizeObserver, see `lib/battle-layout.tsx`)
// and read here by the engine, so React and the animation code agree.
// NO CAMBIAR SCALE_WIDTH.
export const SCALE_WIDTH = 960;
export const ASPECT_RATIO = 0.5625;
import { Battle } from "@pkmn/client";

let currentCanvasWidth = SCALE_WIDTH;
const listeners = new Set<(width: number) => void>();

/** Called by the canvas whenever its measured width changes. */
export function setCanvasWidth(width: number) {
  if (!(width > 0) || width === currentCanvasWidth) return;
  currentCanvasWidth = width;
  for (const fn of listeners) fn(width);
}

export function subscribeCanvasWidth(fn: (width: number) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export const positionsP1 = ["p1a", "p1b", "p1c", "p1d", "p1e"];
export const positionsP2 = ["p2a", "p2b", "p2c", "p2d", "p2e"];

export type Position = {
    top: number;
    left: number;
    x?: number;
    y?: number;
};

/**
 * The slot's box on the field, or `null` when the gametype has no authored
 * position for it.
 *
 * It used to answer `{ top: 2000, left: 0 }` — a coordinate 2000px below a
 * 540px field — so a typo'd slot code or an unsupported gametype did not fail,
 * it silently parked the sprite (and every popup aimed at it) off-screen.
 * Callers bail on `null` instead.
 */
export function getOffset(battle: Battle | null | undefined, position: string, scaleMulti: number = 1): Position | null {
    const gameType = String(battle?.gameType ?? 'singles').trim().toLowerCase() || 'singles';
    const img = getImageSize(scaleMulti);

    const positions: { [key: string]: { [key: string]: Position } } = {
        singles: {
            p1a: { top: 200 * scaleMulti - img / 2, left: 250 * scaleMulti + img / 2 },
            p2a: { top: 75 * scaleMulti - img / 2, left: 450 * scaleMulti + img / 2 }
        },
        doubles: {
            p1a: { top: 200 * scaleMulti - img / 2, left: 200 * scaleMulti + img / 2 },
            p1b: { top: 250 * scaleMulti - img / 2, left: 375 * scaleMulti + img / 2 },
            p2a: { top: 90 * scaleMulti - img / 2, left: 500 * scaleMulti + img / 2 },
            p2b: { top: 75 * scaleMulti - img / 2, left: 375 * scaleMulti + img / 2 }
        },
        triples: {
            p1a: { top: 200 * scaleMulti - img / 2, left: 100 * scaleMulti + img / 2 },
            p1b: { top: 200 * scaleMulti - img / 2, left: 275 * scaleMulti + img / 2 },
            p1c: { top: 275 * scaleMulti - img / 2, left: 375 * scaleMulti + img / 2 },
            p2a: { top: 85 * scaleMulti - img / 2, left: 480 * scaleMulti + img / 2 },
            p2b: { top: 100 * scaleMulti - img / 2, left: 400 * scaleMulti + img / 2 },
            p2c: { top: 75 * scaleMulti - img / 2, left: 350 * scaleMulti + img / 2 },
        },
        raid: {
            // 4v1
            p1a: { top: 200 * scaleMulti - img / 2, left: 150 * scaleMulti + img / 2 },
            p1b: { top: 225 * scaleMulti - img / 2, left: 240 * scaleMulti + img / 2 },
            p1c: { top: 250 * scaleMulti - img / 2, left: 330 * scaleMulti + img / 2 },
            p1d: { top: 275 * scaleMulti - img / 2, left: 420 * scaleMulti + img / 2 },

            p2a: { top: 120 * scaleMulti - img / 2, left: 375 * scaleMulti + img / 2 }
        },
        horde: {
            // 1v5
            p1a: { top: 200 * scaleMulti - img / 2, left: 250 * scaleMulti + img / 2 },

            p2a: { top: 85 * scaleMulti - img / 2, left: 300 * scaleMulti + img / 2 },
            p2b: { top: 75 * scaleMulti - img / 2, left: 350 * scaleMulti + img / 2 },
            p2c: { top: 100 * scaleMulti - img / 2, left: 400 * scaleMulti + img / 2 },
            p2d: { top: 85 * scaleMulti - img / 2, left: 450 * scaleMulti + img / 2 },
            p2e: { top: 115 * scaleMulti - img / 2, left: 500 * scaleMulti + img / 2 },
        }
    };
    return positions[gameType]?.[position] ?? null;
}

/** Sprite box (175 field units) at a scale; defaults to the live canvas scale. */
export function getImageSize(scaleMulti: number = getScaleMultiplier()) {
    return scaleMulti * 175;
}

export function getCanvasWidth() {
    return currentCanvasWidth;
}

export function getCanvasHeight() {
    return getCanvasWidth() * ASPECT_RATIO;
}

export function getScaleMultiplier() {
    return getCanvasWidth() / SCALE_WIDTH;
}
