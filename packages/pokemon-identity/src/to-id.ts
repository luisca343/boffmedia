/**
 * Pokemon Showdown's canonical ID transformation.
 *
 * Matches Showdown's own `toID` exactly: lowercase alphanumerics only.
 * Used across the entire identity mapping pipeline to normalize names from
 * both Pixelmon and Showdown to a canonical form.
 */

/**
 * Transform a string to Showdown ID format: lowercase, alphanumerics only.
 *
 * @param s - The string to transform. Falsy values become empty string.
 * @returns The transformed ID.
 *
 * @example
 * toID("Pikachu") // "pikachu"
 * toID("Mr. Mime") // "mrmime"
 * toID("Type: Null") // "typenull"
 * toID(undefined) // ""
 */
export function toID(s: string | undefined | null): string {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}
