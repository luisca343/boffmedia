/**
 * Utility functions for translating Pokemon-related content
 */

/**
 * Converts a move name to its translation key format
 * @param moveName - The original move name
 * @returns The formatted translation key
 */
export function getMoveTranslationKey(moveName: string): string {
  return `attack_${moveName.toLowerCase().replaceAll(" ", "_")}`;
}

/**
 * Gets the translated move name using the translation function
 * @param moveName - The original move name
 * @param t - The translation function from next-intl
 * @returns The translated move name
 */
export function getTranslatedMoveName(moveName: string, t: (key: string) => string): string {
  return t(getMoveTranslationKey(moveName));
}

/**
 * Converts a biome name to its translation key format
 * @param biomeName - The original biome name
 * @returns The formatted translation key
 */
export function getBiomeTranslationKey(biomeName: string): string {
  return biomeName.replace(":", "_").replace(" ", "_");
}

/**
 * Gets the translated biome name using the translation function
 * @param biomeName - The original biome name
 * @param t - The translation function from next-intl
 * @returns The translated biome name, fallback to formatted original name if translation not found
 */
export function getTranslatedBiomeName(biomeName: string, t: (key: string) => string): string {
  const translationKey = getBiomeTranslationKey(biomeName);
  const translated = t(translationKey);
  
  // If translation is the same as the key, it means translation wasn't found
  // Return formatted original name as fallback
  if (translated === translationKey) {
    return biomeName.replace(/:/g, " ");
  }
  
  return translated;
}
