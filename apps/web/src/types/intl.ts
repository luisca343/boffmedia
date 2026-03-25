import type { Messages, NamespaceKeys, NestedKeyOf } from 'next-intl';

// Define a type for namespaced translation function
export type NamespacedTranslations<TNamespace extends string> = {
  // Main translation function that returns the key prefixed by namespace
  <TKey extends string>(
    key: TKey,
    values?: Record<string, unknown>
  ): string;
  
  // Rich text translations 
  rich<TKey extends string>(
    key: TKey,
    values?: Record<string, unknown>
  ): React.ReactNode;
  
  // Markup translations
  markup<TKey extends string>(
    key: TKey,
    values?: Record<string, unknown>
  ): string;
  
  // Raw value access
  raw<TKey extends string>(
    key: TKey
  ): any;
  
  // Check if key exists
  has<TKey extends string>(
    key: TKey
  ): boolean;
};

// Helper type to represent the actual keys with namespace
export type TranslationKey<TNamespace extends string, TKey extends string> = `${TNamespace}.${TKey}`;