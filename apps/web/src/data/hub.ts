import type { GameData } from "@/components/boffmedia-v2/ui/games/game-card"

interface HubEntry {
  short: string
  tagline: string
  hue: number
  logoLabel: string
  featured: GameData["featured"]
}

export const hubConfig: Record<string, HubEntry> = {
  pokemon: {
    short: "PKMN",
    tagline: "Calculadoras, generadores y bases de datos",
    hue: 28,
    logoLabel: "P",
    featured: {
      title: "Calculadoras Pokémon",
      desc: "Herramientas de cálculo y análisis para Pokémon.",
      features: ["Daño", "Estadísticas", "Equipos"],
      href: "/pokemon",
      icon: "calc",
      image: "Pokémon herramientas",
      hue: 28,
    },
  },
  mhwilds: {
    short: "MHW",
    tagline: "Planificadores y generadores de builds",
    hue: 130,
    logoLabel: "M",
    featured: {
      title: "Planificador de Builds",
      desc: "Planifica y optimiza tus builds de Monster Hunter Wilds.",
      features: ["Armaduras", "Habilidades", "Decoraciones"],
      href: "/mhwilds",
      icon: "hammer",
      image: "MHWilds builds",
      hue: 130,
    },
  },
  otros: {
    short: "MISC",
    tagline: "Herramientas generales y recursos",
    hue: 200,
    logoLabel: "O",
    featured: {
      title: "Utilidades",
      desc: "Herramientas varias para la comunidad.",
      features: ["Sorteos", "Claves", "Recursos"],
      href: "/otros",
      icon: "grid",
      image: "Otras herramientas",
      hue: 200,
    },
  },
}
