module.exports = {
  locales: ["es", "ca", "en"],
  defaultLocale: "es",
  pages: {
    "smartrotom/pokedex": ["smartrotom/pokedex/common"],
    "smartrotom/pokedex/*": ["smartrotom/pokedex/common"],
    "*": ["common", "smartrotom/pokedex/common"]
  },
  loadLocaleFrom: (lang, ns) =>
    import(`/public/locales/${lang}/${ns}.json`).then((m) => m.default),
};