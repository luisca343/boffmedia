import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

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

// Get system locale from Accept-Language header
const getSystemLocale = (): string => {
  const headersList = headers();
  const acceptLanguage = headersList.get('Accept-Language') || '';
  
  // Parse the Accept-Language header to get the preferred language
  const languages = acceptLanguage.split(',')
    .map(lang => {
      const [language, priority = '1.0'] = lang.trim().split(';q=');
      return { language: language.split('-')[0], priority: parseFloat(priority) };
    })
    .sort((a, b) => b.priority - a.priority);
  
  // If we have a preferred language, use it
  if (languages.length > 0) {
    return languages[0].language;
  }
  
  // Fallback to 'en' if no language preference is detected
  return 'en';
};

export default getRequestConfig(async () => {
  // Get locale from cookies or use system locale
  const cookieStore = cookies();
  const systemLocale = getSystemLocale();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || systemLocale;
  const defaultLocale = 'en';
  
  // Define paths to import
  const paths = [
    'boffmedia.json',
    'nav.json',
    'items.json',
    'youtube.json',
    'tools/games.json',
    'tools/mhwilds.json',
    'tools/pokemon.json',
    'smartrotom/pokedex/abilities.json',
    'smartrotom/pokedex/common.json',
    'smartrotom/pokedex/forms.json',
    'smartrotom/pokedex/moves.json',
    'smartrotom/pokedex/spawns.json',
    'tools/pmdsky/common.json',
    'tools/pmdsky/dungeons.json',
    'tools/tcgpocket/common.json',
  ];
  
  // Load translations for the current locale
  const imports = await Promise.all(
    paths.map(path => import(`../../locales/${locale}/${path}`).catch(err => {
      console.error(`Failed to load translation: ${path} for locale ${locale}`, err);
      return { default: {} };
    }))
  );
  
  // Deep merge current locale messages
  let currentLocaleMessages = {};
  imports.forEach(module => {
    currentLocaleMessages = deepMerge(currentLocaleMessages, module.default);
  });

  // If current locale is not the default, load default locale as fallback
  let messages = currentLocaleMessages;
  
  if (locale !== defaultLocale) {
    // Load default locale translations
    const defaultImports = await Promise.all(
      paths.map(path => import(`../../locales/${defaultLocale}/${path}`).catch(err => {
        console.error(`Failed to load translation: ${path} for default locale ${defaultLocale}`, err);
        return { default: {} };
      }))
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
    messages
  };
});