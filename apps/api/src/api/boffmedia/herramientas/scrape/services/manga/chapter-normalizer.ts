// ---------------------------------------------------------------------------
// Chapter number normalisation and slug generation.
//
// Examples:
//   normalizeChapterNumber("Capítulo 35")    → 35
//   normalizeChapterNumber("Capítulo 34")    → 34
//   normalizeChapterNumber("Capítulo 33.50") → 33.5
//   normalizeChapterNumber("Chapter 1.5")    → 1.5
//   normalizeChapterNumber("Prólogo")        → null
//
//   chapterSlug(35,   "Capítulo 35")    → "chapter-0035"
//   chapterSlug(33.5, "Capítulo 33.50") → "chapter-0033-5"
//   chapterSlug(null, "Prólogo")        → "prologo"
// ---------------------------------------------------------------------------

/**
 * Extracts the first numeric value (integer or decimal) from a chapter title.
 * Returns null if no number can be found.
 */
export function normalizeChapterNumber(title: string): number | null {
  // Match the first sequence of digits optionally followed by a decimal part.
  const match = title.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(',', '.'));
}

/**
 * Produces a filesystem-safe, sort-stable slug for a chapter folder.
 * Numeric slugs are zero-padded to 4 digits so lexicographic sort equals
 * numeric sort up to chapter 9999.
 */
export function chapterSlug(number: number | null, title: string): string {
  if (number !== null) {
    const isWhole = Number.isInteger(number);
    const suffix = isWhole
      ? String(number).padStart(4, '0')
      : String(number).replace('.', '-');
    return `chapter-${suffix}`;
  }
  return slugify(title) || 'chapter-unknown';
}

/** Strips diacritics and special characters, produces a kebab-case slug. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
    .replace(/[^a-zA-Z0-9\s-]/g, '')   // keep alphanumerics, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}
