import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import type { AbstractIntlMessages } from 'next-intl';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  validateLocale,
  getNamespacesForRoute,
  type SupportedLocale,
} from './config';

// Helper function for deep merging objects
interface DeepMergeable {
  [key: string]: any;
}

const deepMerge = <T extends DeepMergeable, S extends DeepMergeable>(
  target: T,
  source: S
): T & S => {
  const output = { ...target } as any;

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
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

// ============================================================================
// CACHING LAYER
// ============================================================================

interface CacheEntry {
  messages: AbstractIntlMessages;
  timestamp: number;
}

const messagesCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Get cached messages or null if not found/expired
 */
function getCachedMessages(
  locale: SupportedLocale,
  namespaces: readonly string[]
): AbstractIntlMessages | null {
  const cacheKey = `${locale}:${namespaces.join(',')}`;
  const cached = messagesCache.get(cacheKey);

  if (!cached) return null;

  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    messagesCache.delete(cacheKey);
    return null;
  }

  return cached.messages;
}

/**
 * Store messages in cache
 */
function setCachedMessages(
  locale: SupportedLocale,
  namespaces: readonly string[],
  messages: AbstractIntlMessages
): void {
  const cacheKey = `${locale}:${namespaces.join(',')}`;
  messagesCache.set(cacheKey, {
    messages,
    timestamp: Date.now(),
  });
}

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
      .map((lang) => {
        const [language, priority = '1.0'] = lang.trim().split(';q=');
        return {
          language: language.split('-')[0].toLowerCase(),
          priority: parseFloat(priority),
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

/**
 * Get the current pathname from headers
 */
const getPathname = async (): Promise<string> => {
  try {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '/';
    return pathname;
  } catch (error) {
    // During static generation, return default
    return '/';
  }
};

/**
 * Load messages for a specific locale and namespaces
 */
async function loadMessages(
  locale: SupportedLocale,
  namespaces: readonly string[]
): Promise<AbstractIntlMessages> {
  // Check cache first
  const cached = getCachedMessages(locale, namespaces);
  if (cached) {
    return cached;
  }

  // Load translations for the locale
  const imports = await Promise.all(
    namespaces.map((path) =>
      import(`../../locales/${locale}/${path}`).catch((err) => {
        console.warn(
          `Failed to load translation: ${path} for locale ${locale}`,
          err.message
        );
        return { default: {} };
      })
    )
  );

  // Deep merge all messages
  let messages: AbstractIntlMessages = {};
  imports.forEach((module) => {
    messages = deepMerge(messages, module.default);
  });

  // Cache the result
  setCachedMessages(locale, namespaces, messages);

  return messages;
}

export default getRequestConfig(async () => {
  // Determine locale with proper error handling
  const locale = await determineLocale();

  // Get current pathname to determine which namespaces to load
  const pathname = await getPathname();

  // Get route-specific namespaces
  const namespaces = getNamespacesForRoute(pathname);

  // Load translations for the current locale
  let messages = await loadMessages(locale, namespaces);

  // If current locale is not the default, load default locale as fallback
  if (locale !== DEFAULT_LOCALE) {
    const defaultMessages = await loadMessages(DEFAULT_LOCALE, namespaces);
    // Deep merge default messages with current locale messages (current locale takes precedence)
    messages = deepMerge(defaultMessages, messages);
  }

  return {
    locale,
    messages,
  };
});