module.exports = {
  locales: ["es", "ca", "en"],
  defaultLocale: "es",
  pages: {
    "/smartrotom/pokedex/entrada/[[...params]]": ["smartrotom/pokedex/common", "smartrotom/pokedex/moves", "smartrotom/pokedex/spawns", "smartrotom/pokedex/forms"],
    "/battlesim/replay": ["smartrotom/pokedex/common"],
    "/smartrotom/pokedex": ["smartrotom/pokedex/forms"],
    "/smartrotom/pokedex/spawns": ["smartrotom/pokedex/forms"],
    "/smartrotom/pokedex/localizacion/[id]": ["smartrotom/pokedex/spawns","smartrotom/pokedex/forms"],
    "/smartrotom/pokedex/localizacion": ["smartrotom/pokedex/spawns"],
    "/smartrotom/pasaporte": ["smartrotom/pokedex/moves", "smartrotom/pokedex/forms"],
  },
  loadLocaleFrom: (lang, ns) =>
    import(`/locales/${lang}/${ns}.json`).then((m) => m.default),
};