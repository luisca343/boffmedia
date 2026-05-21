export interface FormStandardization {
  /**
   * Mapping of raw form names to standardized display names
   * Example: 'paldean_combat' -> 'Paldea-Combat'
   */
  displayNames: { [key: string]: string };

  /**
   * Mapping of raw form names to standardized ID segments
   * Example: 'paldean_combat' -> 'paldeacombat'
   */
  idSegments: { [key: string]: string };
}

/**
 * Standardized form mappings for both display names and ID segments
 */
export const formStandardization: FormStandardization = {
  displayNames: {
    alola: 'Alola',
    alolan: 'Alola',
    galar: 'Galar',
    galarian: 'Galar',
    hisui: 'Hisui',
    hisuian: 'Hisui',
    paldea: 'Paldea',
    paldean: 'Paldea',
    ramalbun: 'RamAlbun',
    terasmega: 'Teras-Mega',
    omnitrixgmax: 'Omnitrix-Gmax',
    paldean_combat: 'Paldea-Combat',
    paldean_blaze: 'Paldea-Blaze',
    paldean_aqua: 'Paldea-Aqua',
  },
  idSegments: {
    alola: 'alola',
    alolan: 'alola',
    galar: 'galar',
    galarian: 'galar',
    hisui: 'hisui',
    hisuian: 'hisui',
    paldea: 'paldea',
    paldean: 'paldea',
    ramalbun: 'ramalbun',
    terasmega: 'terasmega',
    omnitrixgmax: 'omnitrixgmax',
    paldean_combat: 'paldeacombat',
    paldean_blaze: 'paldeablaze',
    paldean_aqua: 'paldeaaqua',
  },
};

/**
 * Standardizes a form name for display
 * Example: 'paldean_combat' -> 'Paldea-Combat'
 */
export function standardizeFormDisplayName(formName: string): string {
  const lowerForm = formName.toLowerCase();

  // Check if form name is in the mapping
  if (formStandardization.displayNames[lowerForm]) {
    return formStandardization.displayNames[lowerForm];
  }

  // Default: capitalize first letter
  return formName.charAt(0).toUpperCase() + formName.slice(1).toLowerCase();
}

/**
 * Standardizes a form name for use in IDs
 * Example: 'paldean_combat' -> 'paldeacombat'
 */
export function standardizeFormIdSegment(formName: string): string {
  const lowerForm = formName.toLowerCase();

  // Check if form name is in the mapping
  if (formStandardization.idSegments[lowerForm]) {
    return formStandardization.idSegments[lowerForm];
  }

  // Default: lowercase with no special characters
  return lowerForm.replace(/[^a-z0-9]/g, '');
}
