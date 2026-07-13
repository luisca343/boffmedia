/** Fare model — mirrors the server's. Changing these changes what players are charged. */
export const MINIMUM_FARE = 100
export const PRICE_PER_BLOCK = 0.5

/** The StarBank account fares are paid into. */
export const TAXI_SERVICE_ACCOUNT = 0

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
