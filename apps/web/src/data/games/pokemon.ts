import type { GameEntry } from "./types";

export const pokemon: GameEntry = {
  slug: "pokemon",
  nameKey: "games.pokemon.name",

  // Sidebar
  icon: "/img/games/pokemon/icon.webp",
  color: "from-yellow-400 to-red-500",
  bg: "bg-red-900",

  // Landing page
  logo: "/img/games/pokemon/logo.webp",
  bannerImage: "/img/games/pokemon/banner.webp",
  navHref: "/pokemon",

  externalLinks: [
    { key: "officialWebsite", href: "https://www.pokemon.com/es/", desc: "pokemon.com" },
    { key: "pokemonDatabase", href: "https://pokemondb.net/", desc: "Base de datos Pokémon" },
    { key: "bulbapedia", href: "https://bulbapedia.bulbagarden.net/", desc: "Wiki de Pokémon" },
  ],

  categories: [
    {
      key: "vgc",
      nameKey: "games.pokemon.categories.vgc",
      href: "/pokemon/vgc/meta",
      landing: {
        icon: "/img/games/pokemon/vgc-icon2.webp",
        fallbackIcon: "chart",
        fallbackIconColor: "text-primary-hover",
        color: "from-primary to-violet-600",
        features: ["meta", "speed", "tracker"],
        featured: true,
        isNew: false,
        popularity: "high",
        heroImage: "/img/games/pokemon/vgc.webp",
      },
      tools: [
        { key: "meta",    nameKey: "games.pokemon.tools.meta",    href: "/pokemon/vgc/meta",    sidebarIcon: "chart", bleed: true },
        { key: "speed",   nameKey: "games.pokemon.tools.speed",   href: "/pokemon/vgc/speed",   sidebarIcon: "bolt" },
        { key: "tracker", nameKey: "games.pokemon.tools.tracker", href: "/pokemon/vgc/tracker", sidebarIcon: "book", bleed: true },
        // Not in the sidebar or landing yet (v3 migration pending) — the entry
        // exists so the shell knows the route renders full-bleed.
        { key: "damageCalc", nameKey: "games.pokemon.tools.damageCalc", href: "/pokemon/vgc/damage-calculator", sidebarIcon: "calc", showInSidebar: false, bleed: true },
      ],
    },
    {
      key: "tcgpocket",
      nameKey: "games.pokemon.categories.tcgpocket",
      href: "/pokemon/tcgpocket",
      // The whole category appears as a single card on the Pokemon landing page
      landing: {
        icon: "/img/games/tcgpocket-icon.webp",
        fallbackIcon: "cards",
        fallbackIconColor: "text-yellow-400",
        color: "from-yellow-300 to-yellow-500",
        features: ["gallery", "cardList", "battles"],
        featured: true,
        isNew: true,
        popularity: "high",
        heroImage: "/img/games/tcgpocket/hero.webp",
      },
      tools: [
        { key: "gallery", nameKey: "games.pokemon.tools.gallery", href: "/pokemon/tcgpocket/galeria", sidebarIcon: "cards" },
        { key: "cardList", nameKey: "games.pokemon.tools.cardList", href: "/pokemon/tcgpocket/cartas", sidebarIcon: "zap" },
        { key: "battles", nameKey: "games.pokemon.tools.battles", href: "/pokemon/tcgpocket/combates", sidebarIcon: "sword" },
      ],
    },
    {
      key: "others",
      nameKey: "games.pokemon.categories.others",
      href: "/pokemon/pmdsky",
      tools: [
        {
          key: "pmdsky",
          nameKey: "games.pokemon.tools.skyGenerator",
          href: "/pokemon/pmdsky",
          sidebarIcon: "star",
          landing: {
            icon: "/img/games/pmdsky-icon.webp",
            fallbackIcon: "zap",
            fallbackIconColor: "text-secondary-hover",
            color: "from-secondary-hover to-cyan-600",
            features: ["skyGenerator"],
            featured: false,
            isNew: false,
            popularity: "medium",
          },
        },
        {
          key: "pokedex",
          nameKey: "games.pokemon.tools.pokedex",
          // The live Pokédex is SmartRotom's — /pokemon/pokedex has no route.
          href: "/smartrotom/pokedex",
          sidebarIcon: "gamepad",
          showInSidebar: false,
          landing: {
            icon: "/img/games/pokedex-icon.webp",
            fallbackIcon: "database",
            fallbackIconColor: "text-red-500",
            color: "from-red-500 to-rose-600",
            features: ["pokedex"],
            featured: false,
            isNew: false,
            popularity: "high",
          },
        },
      ],
    },
  ],
};
