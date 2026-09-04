/**
 * @boffmedia/pokemon-identity
 *
 * Canonical Pokemon identity mapping and type effectiveness calculations.
 *
 * This package provides:
 *
 * - **toID**: Showdown's canonical ID transformation (normalize to alphanumerics).
 * - **Resolved<T>**: Result type for identity mappings (always explicit ok/err).
 * - **Type effectiveness chart**: Gen 9 type matchups with calculations.
 *
 * No dependencies on Showdown's battle engine (`@pkmn/sim`) or large data
 * packages (`@pkmn/dex`). Safe for browser, desktop (Tauri v2), and server.
 */

export { toID } from './to-id';
export type { Resolved, OverrideKind, PixelmonRef } from './types';
export {
  TYPE_EFF,
  ALL_TYPES,
  effectiveness,
  getBestOffenseEff,
  type TypeName,
  type TypeEffectiveness,
} from './type-chart';
