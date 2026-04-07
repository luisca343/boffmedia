/**
 * Utilities for handling item names and descriptions using translation keys
 */

/**
 * Gets a localized item name using the translation function
 * 
 * @param t Translation function from next-intl
 * @param itemId The item identifier (can be in format "namespace:item_name")
 * @returns Localized item name
 */
export const getItemName = (t: (key: string) => string, itemId: string, itemType = ''): string => {
    try {
      if(itemType === "pokemon") {
        return t(`pokedex.pixelmon_${itemId.split(" ")[0].toLowerCase()}`);
      }
      const normalizedId = itemId.replace(":", ".");
      return t(`items.${normalizedId}_name`);
    } catch (error) {
      // Fallback: extract and format the item name from its ID
      const namePart = itemId.split(":").pop() || itemId;
      return namePart
        .split("_")
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
  };
  
  /**
   * Gets a localized item description using the translation function
   * 
   * @param t Translation function from next-intl
   * @param itemId The item identifier (can be in format "namespace:item_name")
   * @returns Localized item description
   */
  export const getItemDescription = (t: (key: string) => string, itemId: string): string => {
    try {
      // Convert item ID to the right format for translation keys
      const normalizedId = itemId.replace(":", ".");
      return t(`items.${normalizedId}_description`);
    } catch (error) {
      console.warn(`Translation not found for item description: ${itemId}`);
      // Return a generic description as fallback
      return "No hay información disponible para este objeto.";
    }
  };
  
  /**
   * Safely gets a translation with fallback
   * Use this when you need to handle translation key errors gracefully
   * 
   * @param t Translation function from next-intl
   * @param key The translation key to retrieve
   * @param fallback Fallback text if translation is missing
   * @returns The translated text or fallback
   */
  export const safeTranslate = (
    t: (key: string) => string, 
    key: string, 
    fallback: string
  ): string => {
    try {
      const translated = t(key);
      // Check for empty translation or if it's the same as the key (indicating no translation)
      return translated && translated !== key ? translated : fallback;
    } catch (error) {
      return fallback;
    }
  };

  /*
    * Gets a localized item rarity using the translation function
    * 
    * @param t Translation function from next-intl
    * @param rarity The item rarity (e.g., "common", "rare", "legendary")
    * @returns Localized item rarity
    */
  export const getItemRarity = (t: (key: string) => string, rarity: string): string => {
    try {
      return t(`items.rarity.${rarity.toLowerCase()}`);
    } catch (error) {
      console.warn(`Translation not found for item rarity: ${rarity}`);
      return rarity.charAt(0).toUpperCase() + rarity.slice(1);
    }
  }
    