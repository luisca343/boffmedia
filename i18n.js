/**
 * Legacy i18n configuration for compatibility
 * The source of truth is now src/i18n/config.ts
 * 
 * Note: This file is kept for backward compatibility with any
 * legacy code that may still reference it. New code should import
 * from src/i18n/config.ts instead.
 */

const { SUPPORTED_LOCALES, DEFAULT_LOCALE } = require('./src/i18n/config.ts');

module.exports = {
  locales: [...SUPPORTED_LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  pages: {
    // These mappings are now handled by src/i18n/config.ts
    // Kept here for backward compatibility
    "/smartrotom/pokedex/entrada/[[...params]]": ["smartrotom/pokedex/common", "smartrotom/pokedex/moves", "smartrotom/pokedex/spawns", "smartrotom/pokedex/forms"],
    "/battlesim/replay": ["smartrotom/pokedex/common"],
    "/smartrotom/pokedex": ["smartrotom/pokedex/forms"],
    "/smartrotom/pokedex/spawns": ["smartrotom/pokedex/forms"],
    "/smartrotom/pokedex/localizacion/[id]": ["smartrotom/pokedex/spawns","smartrotom/pokedex/forms"],
    "/smartrotom/pokedex/movimientos/[id]": ["smartrotom/pokedex/common", "smartrotom/pokedex/moves"],
    "/smartrotom/pokedex/movimientos": ["smartrotom/pokedex/common", "smartrotom/pokedex/moves"],
    "/smartrotom/pokedex/localizacion": ["smartrotom/pokedex/spawns"],
    "/smartrotom/pasaporte": ["smartrotom/pokedex/moves", "smartrotom/pokedex/forms", "smartrotom/pokedex/abilities", "smartrotom/pokedex/common"],
    "/battlesim/replay/[name]": ["smartrotom/pokedex/common"],
    "/smartrotom/arcade/squirdle": ["smartrotom/pokedex/common", "smartrotom/pokedex/forms"],
    "/(boffmedia)/herramientas/pokemon/pmdsky": ["tools/pmdsky/dungeons", "tools/pmdsky/common"],
  },
  loadLocaleFrom: (lang, ns) =>
    import(`/locales/${lang}/${ns}.json`).then((m) => m.default),
};