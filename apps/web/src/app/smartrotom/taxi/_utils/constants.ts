/**
 * Fare model, for the estimate shown before boarding. **The server decides what is actually
 * charged** — `apps/api/src/api/smartrotom/taxi/fare.ts` recomputes it from the player's live
 * position, and `GET /smartrotom/taxi/config` serves these same numbers. Keep them in step, or
 * the quoted price and the charged price drift apart.
 */
export const MINIMUM_FARE = 100
export const PRICE_PER_BLOCK = 0.5

/** The player's in-world position only moves while they play, so poll gently. */
export const POSITION_REFRESH_INTERVAL = 5000

/**
 * Map zoom, in screen-pixels per world-block. The floor frames the whole world
 * (~13k blocks across); the ceiling stops the grid from turning into wallpaper.
 */
export const MIN_SCALE = 0.035
export const MAX_SCALE = 0.55
export const DEFAULT_SCALE = 0.09

/** One major grid cell, in blocks — also what the scale chip measures. */
export const GRID_CELL_BLOCKS = 500
