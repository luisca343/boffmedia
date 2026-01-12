/**
 * Shared i18n configuration
 * Single source of truth for locales and namespace mappings
 */

export const SUPPORTED_LOCALES = ['en', 'es', 'ca'] as const;
export const DEFAULT_LOCALE = 'es';

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Global namespaces that should be loaded on every page
 */
export const GLOBAL_NAMESPACES = [
  'common.json',
  'nav.json',
  'boffmedia.json',
] as const;

/**
 * Page-specific namespace mappings
 * Maps route patterns to their required translation namespaces
 */
export const PAGE_NAMESPACES: Record<string, readonly string[]> = {
  // SmartRotom Pokedex
  '/smartrotom/pokedex/entrada': [
    'smartrotom/pokedex/common.json',
    'smartrotom/pokedex/moves.json',
    'smartrotom/pokedex/spawns.json',
    'smartrotom/pokedex/forms.json',
  ],
  '/battlesim/replay': ['smartrotom/pokedex/common.json'],
  '/smartrotom/pokedex': ['smartrotom/pokedex/forms.json'],
  '/smartrotom/pokedex/spawns': ['smartrotom/pokedex/forms.json'],
  '/smartrotom/pokedex/localizacion': [
    'smartrotom/pokedex/spawns.json',
    'smartrotom/pokedex/forms.json',
  ],
  '/smartrotom/pokedex/movimientos': [
    'smartrotom/pokedex/common.json',
    'smartrotom/pokedex/moves.json',
  ],
  '/smartrotom/pasaporte': [
    'smartrotom/pokedex/moves.json',
    'smartrotom/pokedex/forms.json',
    'smartrotom/pokedex/abilities.json',
    'smartrotom/pokedex/common.json',
  ],
  '/smartrotom/arcade/squirdle': [
    'smartrotom/pokedex/common.json',
    'smartrotom/pokedex/forms.json',
  ],

  // Tools
  '/herramientas/pokemon/pmdsky': [
    'tools/pmdsky/dungeons.json',
    'tools/pmdsky/common.json',
  ],
  '/herramientas/pokemon': [
    'tools/pokemon.json',
    'tools/tcgpocket/common.json',
  ],
  '/herramientas/mhwilds': [
    'tools/mhwilds.json',
  ],
  '/herramientas': [
    'tools/games.json',
  ],

  // Default fallback with all namespaces (for routes not explicitly mapped)
  '*': [
    'items.json',
    'twitch.json',
    'youtube.json',
    'tools/games.json',
    'tools/mhwilds.json',
    'tools/pokemon.json',
    'tools/pmdsky/common.json',
    'tools/pmdsky/dungeons.json',
    'tools/tcgpocket/common.json',
    'smartrotom/pokedex/abilities.json',
    'smartrotom/pokedex/common.json',
    'smartrotom/pokedex/forms.json',
    'smartrotom/pokedex/moves.json',
    'smartrotom/pokedex/spawns.json',
  ],
} as const;

/**
 * Get namespaces for a specific route
 * Returns global namespaces + page-specific namespaces
 */
export function getNamespacesForRoute(pathname: string): readonly string[] {
  // Always include global namespaces
  const namespaces = [...GLOBAL_NAMESPACES];

  // Find matching page-specific namespaces
  for (const [pattern, pageNamespaces] of Object.entries(PAGE_NAMESPACES)) {
    if (pattern === '*') continue; // Handle wildcard last

    // Simple pattern matching (can be enhanced with path-to-regexp if needed)
    if (pathname.startsWith(pattern)) {
      namespaces.push(...pageNamespaces);
      return namespaces;
    }
  }

  // Fallback to wildcard if no specific route matched
  if (PAGE_NAMESPACES['*']) {
    namespaces.push(...PAGE_NAMESPACES['*']);
  }

  return namespaces;
}

/**
 * Validate and normalize locale
 */
export function validateLocale(locale: string | undefined): SupportedLocale {
  if (!locale) return DEFAULT_LOCALE;

  const normalizedLocale = locale.toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.includes(normalizedLocale as SupportedLocale)
    ? (normalizedLocale as SupportedLocale)
    : DEFAULT_LOCALE;
}
