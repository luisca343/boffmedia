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
        fallbackIcon: "Podium",
        fallbackIconColor: "text-primary-400",
        color: "from-primary-500 to-violet-600",
        features: ["meta", "speed", "tracker"],
        featured: true,
        isNew: false,
        popularity: "high",
        heroImage: "/img/games/pokemon/vgc.webp",
      },
      tools: [
        { key: "meta",            nameKey: "games.pokemon.tools.meta",            href: "/pokemon/vgc/meta",            sidebarIcon: "Podium" },
        { key: "speed", nameKey: "games.pokemon.tools.speed", href: "/pokemon/vgc/speed", sidebarIcon: "Speedometer" },
        { key: "tracker",         nameKey: "games.pokemon.tools.tracker",         href: "/pokemon/vgc/tracker",         sidebarIcon: "Notebook" },
      ],
    },
    {
      key: "tcgpocket",
      nameKey: "games.pokemon.categories.tcgpocket",
      href: "/pokemon/tcgpocket",
      // The whole category appears as a single card on the Pokemon landing page
      landing: {
        icon: "/img/games/tcgpocket-icon.webp",
        fallbackIcon: "Diamond",
        fallbackIconColor: "text-yellow-400",
        color: "from-yellow-300 to-yellow-500",
        features: ["gallery", "cardList", "battles"],
        featured: true,
        isNew: true,
        popularity: "high",
        heroImage: "/img/games/tcgpocket/hero.webp",
      },
      tools: [
        { key: "gallery", nameKey: "games.pokemon.tools.gallery", href: "/pokemon/tcgpocket/galeria", sidebarIcon: "Diamond" },
        { key: "cardList", nameKey: "games.pokemon.tools.cardList", href: "/pokemon/tcgpocket/cartas", sidebarIcon: "Zap" },
        { key: "battles", nameKey: "games.pokemon.tools.battles", href: "/pokemon/tcgpocket/combates", sidebarIcon: "SwordIcon" },
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
          sidebarIcon: "Star",
          landing: {
            icon: "/img/games/pmdsky-icon.webp",
            fallbackIcon: "Zap",
            fallbackIconColor: "text-secondary-400",
            color: "from-secondary-400 to-cyan-600",
            features: ["skyGenerator"],
            featured: false,
            isNew: false,
            popularity: "medium",
          },
        },
        {
          key: "pokedex",
          nameKey: "games.pokemon.tools.pokedex",
          href: "/pokemon/pokedex",
          sidebarIcon: "Gamepad",
          showInSidebar: false,
          landing: {
            icon: "/img/games/pokedex-icon.webp",
            fallbackIcon: "Database",
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
