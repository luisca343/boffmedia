import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from cookies or use default
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'es';
  
  // Define paths to import
  const paths = [
    'smartrotom/pokedex/abilities.json',
    'smartrotom/pokedex/common.json',
    'smartrotom/pokedex/forms.json',
    'smartrotom/pokedex/moves.json',
    'smartrotom/pokedex/spawns.json',
    'tools/pmdsky/common.json',
    'tools/pmdsky/dungeons.json',
    'tools/tcgpocket/common.json',
    'tools/mhwilds/mhwilds.json',
  ];
  
  // Import all translations
  const imports = await Promise.all(
    paths.map(path => import(`../../locales/${locale}/${path}`).catch(err => {
      console.error(`Failed to load translation: ${path}`, err);
      return { default: {} };
    }))
  );
  
  // Merge all translation objects
  const messages = imports.reduce((acc, module) => ({
    ...acc,
    ...module.default
  }), {});

  return {
    locale,
    messages
  };
});