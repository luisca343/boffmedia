import { ASSET, staticAsset } from '@/lib/assets';
import type { GameEntry } from "./types";

export const pokemon: GameEntry = {
  slug: "pokemon",
  nameKey: "games.pokemon.name",

  // Sidebar
  icon: staticAsset(ASSET.boffmedia.img, "games/pokemon/icon.webp"),
  color: "from-yellow-400 to-red-500",
  bg: "bg-red-900",

  // Landing page
  logo: staticAsset(ASSET.boffmedia.img, "games/pokemon/logo.webp"),
  bannerImage: staticAsset(ASSET.boffmedia.img, "games/pokemon/banner.webp"),
  navHref: "/pokemon",

  externalLinks: [
    { key: "officialWebsite", href: "https://www.pokemon.com/es/", desc: "pokemon.com" },
    { key: "pokemonDatabase", href: "https://pokemondb.net/", desc: "Base de datos Pokémon" },
    { key: "bulbapedia", href: "https://bulbapedia.bulbagarden.net/", desc: "Wiki de Pokémon" },
  ],

  categories: [
    {
      key: "competitive",
      nameKey: "games.pokemon.categories.competitive",
      href: "/pokemon/teambuilder",
      landing: {
        icon: staticAsset(ASSET.boffmedia.img, "games/pokemon/vgc-icon2.webp"),
        fallbackIcon: "sword",
        fallbackIconColor: "text-primary-hover",
        color: "from-primary to-violet-600",
        features: ["teamBuilder", "battlesim", "damageCalc", "speed", "meta", "tracker"],
        featured: true,
        isNew: false,
        popularity: "high",
        heroImage: staticAsset(ASSET.boffmedia.img, "games/pokemon/vgc.webp"),
      },
      tools: [
        { key: "teambuilder", nameKey: "games.pokemon.tools.teambuilder", href: "/pokemon/teambuilder", sidebarIcon: "layers", bleed: true },
        { key: "battlesim", nameKey: "games.pokemon.tools.battlesim", href: "/pokemon/battlesim", sidebarIcon: "sword", bleed: true },
        { key: "damageCalc", nameKey: "games.pokemon.tools.damageCalc", href: "/pokemon/vgc/damage-calculator", sidebarIcon: "calc", bleed: true },
        { key: "speed",   nameKey: "games.pokemon.tools.speed",   href: "/pokemon/vgc/speed",   sidebarIcon: "bolt", bleed: true },
        { key: "meta",    nameKey: "games.pokemon.tools.meta",    href: "/pokemon/vgc/meta",    sidebarIcon: "chart", bleed: true },
        { key: "tracker", nameKey: "games.pokemon.tools.tracker", href: "/pokemon/vgc/tracker", sidebarIcon: "book", bleed: true },
      ],
    },
    {
      key: "tcgpocket",
      nameKey: "games.pokemon.categories.tcgpocket",
      href: "/pokemon/tcgpocket",
      // The whole category appears as a single card on the Pokemon landing page
      landing: {
        icon: staticAsset(ASSET.boffmedia.img, "games/tcgpocket/icon.webp"),
        fallbackIcon: "cards",
        fallbackIconColor: "text-yellow-400",
        color: "from-yellow-300 to-yellow-500",
        features: ["cardList", "collection", "packs", "battles"],
        featured: true,
        isNew: true,
        popularity: "high",
        heroImage: staticAsset(ASSET.boffmedia.img, "games/tcgpocket/hero.webp"),
      },
      // Full-bleed v3 tool — the whole subtree renders inside the section shell;
      // the rail entries mirror the app's internal tabs (Panel · Cartas · Colección · Sobres).
      tools: [
        { key: "tcgPanel",   nameKey: "games.pokemon.tools.tcgPanel",   href: "/pokemon/tcgpocket",          sidebarIcon: "home",  bleed: true },
        { key: "cardList",   nameKey: "games.pokemon.tools.cardList",   href: "/pokemon/tcgpocket/cartas",    sidebarIcon: "cards", bleed: true },
        { key: "collection", nameKey: "games.pokemon.tools.collection", href: "/pokemon/tcgpocket/coleccion", sidebarIcon: "grid",  bleed: true },
        { key: "packs",      nameKey: "games.pokemon.tools.packs",      href: "/pokemon/tcgpocket/sobres",    sidebarIcon: "inbox", bleed: true },
        { key: "battles",    nameKey: "games.pokemon.tools.battles",    href: "/pokemon/tcgpocket/combates", sidebarIcon: "sword", bleed: true },
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
          bleed: true,
          landing: {
            icon: staticAsset(ASSET.boffmedia.img, "games/pmdsky-icon.webp"),
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
            icon: staticAsset(ASSET.boffmedia.img, "games/pokedex-icon.webp"),
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
