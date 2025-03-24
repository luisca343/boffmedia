import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const locale = 'es';
 
  return {
    locale,
    messages: {
      ...(await import(`../../locales/${locale}/smartrotom/pokedex/abilities.json`)).default,
      ...(await import(`../../locales/${locale}/smartrotom/pokedex/common.json`)).default,
      ...(await import(`../../locales/${locale}/smartrotom/pokedex/forms.json`)).default,
      ...(await import(`../../locales/${locale}/smartrotom/pokedex/moves.json`)).default,
      ...(await import(`../../locales/${locale}/smartrotom/pokedex/spawns.json`)).default,
      ...(await import(`../../locales/${locale}/tools/pmdsky/common.json`)).default,
      ...(await import(`../../locales/${locale}/tools/pmdsky/dungeons.json`)).default,
      ...(await import(`../../locales/${locale}/tools/tcgpocket/common.json`)).default,
      
      ...(await import(`../../locales/${locale}/tools/mhwilds/mhwilds.json`)).default,
    }
  };
});