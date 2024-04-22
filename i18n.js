module.exports = {
  locales: ["es", "ca", "en"],
  defaultLocale: "es",
  pages: {
    "/smartrotom/pokedex": ["smartrotom/pokedex/common"],
    "/smartrotom/pokedex/*": ["smartrotom/pokedex/common"],
    "/smartrotom/pokedex/entrada/[[...params]]": ["smartrotom/pokedex/common", "smartrotom/pokedex/moves", "smartrotom/pokedex/spawns", "smartrotom/pokedex/forms"],
    "*": ["common"]
  },
  loadLocaleFrom: (lang, ns) =>
    import(`/public/locales/${lang}/${ns}.json`).then((m) => m.default),
};