import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

// Supported locales
const SUPPORTED_LOCALES = ['en', 'es'] as const;
const DEFAULT_LOCALE = 'es';

type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Helper function for deep merging objects
interface DeepMergeable {
  [key: string]: any;
}

const deepMerge = <T extends DeepMergeable, S extends DeepMergeable>(target: T, source: S): T & S => {
  const output = { ...target } as any;
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output as T & S;
};

const isObject = (item: unknown): item is Record<string, any> => {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Validate and normalize locale
 */
const validateLocale = (locale: string | undefined): SupportedLocale => {
  if (!locale) return DEFAULT_LOCALE;
  
  const normalizedLocale = locale.toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.includes(normalizedLocale as SupportedLocale) 
    ? normalizedLocale as SupportedLocale 
    : DEFAULT_LOCALE;
};

/**
 * Get locale from Accept-Language header with fallback
 */
const getLocaleFromHeaders = async (): Promise<SupportedLocale> => {
  try {
    const headersList = await headers();
    const acceptLanguage = headersList.get('Accept-Language') || '';
    
    // Parse Accept-Language header
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [language, priority = '1.0'] = lang.trim().split(';q=');
        return { 
          language: language.split('-')[0].toLowerCase(), 
          priority: parseFloat(priority) 
        };
      })
      .sort((a, b) => b.priority - a.priority);
    
    // Return first supported language
    for (const { language } of languages) {
      if (SUPPORTED_LOCALES.includes(language as SupportedLocale)) {
        return language as SupportedLocale;
      }
    }
  } catch (error) {
    // During static generation, headers are not available - use default locale
    // This is expected behavior and not an error
  }
  
  return DEFAULT_LOCALE;
};

/**
 * Get locale from cookies with fallback
 */
const getLocaleFromCookies = async (): Promise<SupportedLocale | null> => {
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
    return localeCookie ? validateLocale(localeCookie) : null;
  } catch (error) {
    // During static generation, cookies are not available - this is expected
    // Return null to fall back to default locale
    return null;
  }
};

/**
 * Determine the current locale
 */
const determineLocale = async (): Promise<SupportedLocale> => {
  // Try to get locale from cookie first (user preference)
  const cookieLocale = await getLocaleFromCookies();
  if (cookieLocale) return cookieLocale;
  
  // Fallback to Accept-Language header
  const headerLocale = await getLocaleFromHeaders();
  return headerLocale;
};

export default getRequestConfig(async () => {
  // Determine locale with proper error handling
  const locale = await determineLocale();
  
  // Define paths to import
  const paths = [
    'boffmedia.json',
    'battlesim.json',
    'nav.json',
    'auth.json',
    'profile.json',
    'leaderboard.json',
    'events.json',
    'items.json',
    'tools/games.json',
    'tools/hub.json',
    'tools/mhwilds.json',
    'tools/pokemon.json',
    'tools/vgc.json',
    'smartrotom/pokedex/abilities.json',
    'smartrotom/pokedex/common.json',
    'smartrotom/pokedex/forms.json',
    'smartrotom/pokedex/moves.json',
    'smartrotom/pokedex/spawns.json',
    'tools/pmdsky/common.json',
    'tools/pmdsky/dungeons.json',
    'tools/tcgpocket/common.json',
    'tools/otros.json',
    'common.json',
    'twitch.json',
    'youtube.json',
  ];
  
  // Load translations for the current locale
  const imports = await Promise.all(
    paths.map(path => 
      import(`../../locales/${locale}/${path}`)
        .catch(err => {
          console.warn(`Failed to load translation: ${path} for locale ${locale}`, err.message);
          return { default: {} };
        })
    )
  );
  
  // Deep merge current locale messages
  let currentLocaleMessages = {};
  imports.forEach(module => {
    currentLocaleMessages = deepMerge(currentLocaleMessages, module.default);
  });

  // If current locale is not the default, load default locale as fallback
  let messages = currentLocaleMessages;
  
  if (locale !== DEFAULT_LOCALE) {
    // Load default locale translations
    const defaultImports = await Promise.all(
      paths.map(path => 
        import(`../../locales/${DEFAULT_LOCALE}/${path}`)
          .catch(err => {
            console.warn(`Failed to load translation: ${path} for default locale ${DEFAULT_LOCALE}`, err.message);
            return { default: {} };
          })
      )
    );
    
    // Deep merge default locale messages
    let defaultMessages = {};
    defaultImports.forEach(module => {
      defaultMessages = deepMerge(defaultMessages, module.default);
    });
    
    // Deep merge default messages with current locale messages (current locale takes precedence)
    messages = deepMerge(defaultMessages, currentLocaleMessages);
  }

  return {
    locale,
    messages,
  };
});