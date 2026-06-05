export interface ToolData {
  title: string
  desc: string
  icon: string
  features: string[]
  href: string
  popularity?: "high" | "medium"
  soon?: boolean
  isNew?: boolean
}

export interface CategoryData {
  name: string
  href?: string
  tools: { name: string; href: string; icon: string; badge?: string }[]
}

export interface FeaturedToolData {
  title: string
  isNew?: boolean
  desc: string
  features: string[]
  href: string
  icon: string
  image: string
  hue?: number
}

export interface GameData {
  slug: string
  name: string
  short: string
  tagline: string
  hue: number
  logoLabel: string
  hero: {
    prefix: string
    highlight: string
    subtitle: string
  }
  categories: CategoryData[]
  featured: FeaturedToolData
  tools: ToolData[]
  external: { title: string; desc: string; href: string }[]
}

export const GAMES: Record<string, GameData> = {
  mhwilds: {
    slug: "mhwilds",
    name: "Monster Hunter Wilds",
    short: "MH Wilds",
    tagline: "Planificadores y generadores de builds para cazar mejor.",
    hue: 152,
    logoLabel: "MHW",
    hero: {
      prefix: "Herramientas para",
      highlight: "Monster Hunter Wilds",
      subtitle:
        "Optimiza tu equipo, compara armas y planifica cada cacería con datos siempre actualizados.",
    },
    categories: [
      {
        name: "Build Planner",
        href: "#/herramientas/mhwilds/builds",
        tools: [
          {
            name: "Planificador",
            href: "#/herramientas/mhwilds/builds/planner",
            icon: "sword",
            badge: "new",
          },
          {
            name: "Árbol de armas",
            href: "#/herramientas/mhwilds/tree",
            icon: "tree",
          },
        ],
      },
      {
        name: "Base de datos",
        tools: [
          {
            name: "Bestiario",
            href: "#/herramientas/mhwilds/monsters",
            icon: "axe",
            badge: "soon",
          },
          {
            name: "Decoraciones",
            href: "#/herramientas/mhwilds/decorations",
            icon: "puzzle",
            badge: "soon",
          },
        ],
      },
    ],
    featured: {
      title: "Planificador de Builds",
      isNew: true,
      desc: "Construye y optimiza sets completos: armadura, decoraciones, talismán y arma. Calcula habilidades, resistencias y afilado en tiempo real.",
      features: [
        "Optimizador de habilidades",
        "Calculadora de daño",
        "Comparador de sets",
      ],
      href: "#/herramientas/mhwilds/builds/planner",
      icon: "sword",
      image: "Hero · Gemma / Build Planner",
      hue: 152,
    },
    tools: [
      {
        title: "Árbol de armas",
        desc: "Navega los árboles de mejora de las 14 armas con materiales y stats.",
        icon: "tree",
        features: ["Árboles", "Comparación", "Stats"],
        href: "#/herramientas/mhwilds/tree",
        popularity: "high",
      },
      {
        title: "Bestiario",
        desc: "Debilidades, materiales y localizaciones de cada monstruo.",
        icon: "axe",
        features: ["Debilidades", "Materiales", "Mapas"],
        href: "#/herramientas/mhwilds/monsters",
        popularity: "medium",
        soon: true,
      },
      {
        title: "Decoraciones",
        desc: "Busca y filtra decoraciones por habilidad y nivel.",
        icon: "puzzle",
        features: ["Búsqueda", "Filtros", "Sets"],
        href: "#/herramientas/mhwilds/decorations",
        popularity: "medium",
        soon: true,
      },
    ],
    external: [
      { title: "Web oficial", desc: "monsterhunter.com", href: "#" },
      { title: "r/MonsterHunter", desc: "Comunidad de Reddit", href: "#" },
      { title: "Fandom Wiki", desc: "Wiki de MH Wilds", href: "#" },
      { title: "YouTube", desc: "Guías y gameplay", href: "#" },
    ],
  },

  pokemon: {
    slug: "pokemon",
    name: "Pokémon",
    short: "Pokémon",
    tagline: "Calculadoras, generadores y bases de datos competitivas.",
    hue: 28,
    logoLabel: "PKM",
    hero: {
      prefix: "Herramientas para",
      highlight: "Pokémon",
      subtitle:
        "Desde el cálculo de daño VGC hasta el meta de TCG Pocket — todo lo competitivo en un solo sitio.",
    },
    categories: [
      {
        name: "TCG Pocket",
        href: "#/herramientas/pokemon/tcgpocket",
        tools: [
          {
            name: "Galería",
            href: "#/herramientas/pokemon/tcgpocket/galeria",
            icon: "cards",
          },
          {
            name: "Lista de cartas",
            href: "#/herramientas/pokemon/tcgpocket/cartas",
            icon: "list",
          },
          {
            name: "Combates",
            href: "#/herramientas/pokemon/tcgpocket/combates",
            icon: "sword",
          },
        ],
      },
      {
        name: "Competitivo",
        tools: [
          {
            name: "Calculadora de daño",
            href: "#/herramientas/pokemon/calc",
            icon: "calc",
            badge: "new",
          },
          {
            name: "VGC Tracker",
            href: "#/herramientas/pokemon/tracker",
            icon: "chart",
          },
          {
            name: "Mundo Misterioso",
            href: "#/herramientas/pokemon/pmdsky",
            icon: "star",
          },
        ],
      },
    ],
    featured: {
      title: "Calculadora de Daño",
      isNew: true,
      desc: "El calculador de daño más completo para VGC y singles: sets, objetos, campos, clima y condiciones. Comparte cálculos con un enlace.",
      features: ["VGC y singles", "Campos y clima", "Enlaces para compartir"],
      href: "#/herramientas/pokemon/calc",
      icon: "calc",
      image: "Hero · Calculadora de Daño",
      hue: 28,
    },
    tools: [
      {
        title: "VGC Game Tracker",
        desc: "Registra partidas, equipos y resultados de torneo en tiempo real.",
        icon: "chart",
        features: ["Partidas", "Equipos", "Stats"],
        href: "#/herramientas/pokemon/tracker",
        popularity: "high",
      },
      {
        title: "TCG Pocket",
        desc: "Constructor de mazos y análisis del meta actual.",
        icon: "cards",
        features: ["Mazos", "Meta", "Galería"],
        href: "#/herramientas/pokemon/tcgpocket",
        popularity: "high",
        isNew: true,
      },
      {
        title: "Mundo Misterioso",
        desc: "Herramientas para PMD: generador de semillas y rutas.",
        icon: "star",
        features: ["Semillas", "Rutas", "Misiones"],
        href: "#/herramientas/pokemon/pmdsky",
        popularity: "medium",
      },
    ],
    external: [
      { title: "Pokémon.com", desc: "Web oficial", href: "#" },
      { title: "Smogon", desc: "Recurso competitivo", href: "#" },
      { title: "Pikalytics", desc: "Estadísticas VGC", href: "#" },
      { title: "Bulbapedia", desc: "Enciclopedia", href: "#" },
    ],
  },

  otros: {
    slug: "otros",
    name: "Otros",
    short: "Otros",
    tagline: "Herramientas generales y recursos para la comunidad.",
    hue: 200,
    logoLabel: "MISC",
    hero: {
      prefix: "Herramientas",
      highlight: "generales",
      subtitle:
        "Sorteos, claves de Steam y utilidades varias creadas por y para la comunidad.",
    },
    categories: [
      {
        name: "Comunidad",
        tools: [
          {
            name: "Sorteos",
            href: "#/herramientas/otros/sorteos",
            icon: "trophy",
          },
          {
            name: "Claves de Steam",
            href: "#/herramientas/otros/keys",
            icon: "bookmark",
          },
        ],
      },
    ],
    featured: {
      title: "Claves de Steam",
      isNew: false,
      desc: "Gestiona y consulta el estado de tus claves de Steam, con datos enriquecidos directamente desde la tienda.",
      features: ["Estado en vivo", "Datos de Steam", "Exportar"],
      href: "#/herramientas/otros/keys",
      icon: "bookmark",
      image: "Hero · Claves de Steam",
      hue: 200,
    },
    tools: [
      {
        title: "Sorteos",
        desc: "Crea y participa en sorteos de la comunidad de forma transparente.",
        icon: "trophy",
        features: ["Crear", "Participar", "Historial"],
        href: "#/herramientas/otros/sorteos",
        popularity: "medium",
      },
    ],
    external: [
      { title: "Discord", desc: "Únete al servidor", href: "#" },
      { title: "Estado", desc: "Status de servicios", href: "#" },
    ],
  },
}

export const GAMES_ORDER = ["pokemon", "mhwilds", "otros"]
