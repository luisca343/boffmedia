// ---------------------------------------------------------------------------
// Chapter number normalisation and filename generation.
//
// Examples:
//   normalizeChapterNumber("Capítulo 35")    → 35
//   normalizeChapterNumber("Capítulo 33.50") → 33.5
//   normalizeChapterNumber("Prólogo")        → null
//
//   chapterFilename(35,   "Capítulo 35")    → "35"
//   chapterFilename(8.5,  "Capítulo 8.5")  → "8.5"
//   chapterFilename(null, "Prólogo")        → "Prólogo"
//
//   sanitizeForFilesystem("La Razón: Hero") → "La Razón Hero"
// ---------------------------------------------------------------------------

/**
 * Extracts the first numeric value (integer or decimal) from a chapter title.
 * Returns null if no number can be found.
 */
export function normalizeChapterNumber(title: string): number | null {
  const match = title.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(',', '.'));
}

/**
 * Produces a clean filename (no extension) for a chapter file.
 * Numeric chapters use just the number: "35", "8.5".
 * Non-numeric chapters (prologues, specials) use the sanitized title.
 */
export function chapterFilename(number: number | null, title: string): string {
  if (number !== null) {
    return String(number);
  }
  return sanitizeForFilesystem(title) || 'unknown';
}

/**
 * Strips characters that are invalid in file/folder names on Windows and Unix,
 * but preserves accents, casing, and spaces — giving readable names.
 *
 * Invalid chars removed: \ / : * ? " < > |
 */
export function sanitizeForFilesystem(text: string): string {
  return text.replace(/[\\/:*?"<>|]/g, '').trim();
}
