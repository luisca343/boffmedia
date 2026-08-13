import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { messages as toolsMinecraftMessages } from '@boffmedia/tools-minecraft/catalog';
import { ALL_NAMESPACES } from './manifest.generated';
import { namespacesFor, PATHNAME_HEADER } from './scopes';

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

/** The pathname published by middleware; '' when it did not run (see namespacesFor). */
const requestPathname = async (): Promise<string> => {
  try {
    return (await headers()).get(PATHNAME_HEADER) ?? '';
  } catch {
    return '';
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
  const locale = await determineLocale();
  const paths = namespacesFor(await requestPathname(), ALL_NAMESPACES);

  const load = async (loc: SupportedLocale) => {
    const modules = await Promise.all(
      paths.map((path) =>
        import(`../../locales/${loc}/${path}`).catch((err) => {
          console.warn(`Failed to load translation: ${path} for locale ${loc}`, err.message);
          return { default: {} };
        }),
      ),
    );
    const fromFiles = modules.reduce<DeepMergeable>((acc, m) => deepMerge(acc, m.default), {});
    // Workspace tool packages own their own catalogs (plan §3: "Package-owned
    // es/en message catalogs; hosts merge them"). They are merged in
    // unconditionally rather than through the pathname scope manifest, which
    // only knows about files under locales/ — the payload is a few hundred keys.
    return deepMerge(fromFiles, toolsMinecraftMessages[loc] as DeepMergeable);
  };

  const messages = await load(locale);

  // A non-default locale merges on top of `es` so a missing key falls back rather
  // than rendering its own name.
  return {
    locale,
    messages:
      locale === DEFAULT_LOCALE ? messages : deepMerge(await load(DEFAULT_LOCALE), messages),
  };
});
