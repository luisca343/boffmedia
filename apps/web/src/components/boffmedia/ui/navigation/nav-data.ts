export interface NavItem {
  label: string
  href: string
  icon?: string
}

export interface NavGroup {
  name: string
  href?: string
  items: NavItem[]
}

export interface NavSection {
  title: string
  href: string
  hue?: number
  groups?: NavGroup[]
  items: NavItem[]
}

export interface NavEntry {
  label: string
  route: string
  menu?: "tools" | "comunidad"
}

export const PRIMARY_NAV: NavEntry[] = [
  { label: "Inicio", route: "/" },
  { label: "Herramientas", route: "/herramientas", menu: "tools" },
  { label: "Comunidad", route: "/comunidad", menu: "comunidad" },
]

export const TOOLS_SECTIONS: NavSection[] = [
  {
    title: "Pokémon",
    href: "/herramientas/pokemon",
    hue: 22,
    groups: [
      {
        name: "Competitivo",
        href: "/herramientas/pokemon/competitivo",
        items: [
          { label: "Calculadora de daño", href: "/herramientas/pokemon/calc", icon: "calc" },
          { label: "Meta VGC", href: "/herramientas/pokemon/vgc-meta", icon: "chart" },
          { label: "Torneos VGC", href: "/herramientas/pokemon/torneos", icon: "trophy" },
          { label: "Tracker de partidas", href: "/herramientas/pokemon/tracker", icon: "target" },
        ],
      },
      {
        name: "TCG Pocket",
        href: "/herramientas/pokemon/tcgp",
        items: [
          { label: "Catálogo de cartas", href: "/herramientas/pokemon/tcgp/catalogo", icon: "cards" },
          { label: "Battlesim", href: "/herramientas/pokemon/battlesim", icon: "sword" },
        ],
      },
    ],
    items: [],
  },
  {
    title: "Minecraft",
    href: "/herramientas/minecraft",
    hue: 130,
    groups: [
      {
        name: "Mundos",
        items: [
          { label: "Schematic Compat", href: "/herramientas/minecraft/schematic", icon: "layers" },
          { label: "Claves y sorteos", href: "/herramientas/minecraft/keys", icon: "key" },
        ],
      },
    ],
    items: [],
  },
  {
    title: "Monster Hunter",
    href: "/herramientas/mh",
    hue: 280,
    groups: [
      {
        name: "Cacería",
        items: [
          { label: "Planificador de builds", href: "/herramientas/mh/planner", icon: "sliders" },
          { label: "Bestiario", href: "/herramientas/mh/bestiario", icon: "paw" },
          { label: "Árbol de armas", href: "/herramientas/mh/armas", icon: "tree" },
        ],
      },
    ],
    items: [],
  },
]

export const COMUNIDAD_SECTIONS: NavSection[] = [
  {
    title: "Competición",
    href: "/clasificacion",
    items: [
      { label: "Juegos", href: "/juegos", icon: "gamepad" },
      { label: "Clasificación", href: "/clasificacion", icon: "chart" },
    ],
  },
  {
    title: "Participa",
    href: "/eventos",
    items: [
      { label: "Eventos", href: "/eventos", icon: "trophy" },
      { label: "Sorteos", href: "/sorteos", icon: "gift" },
    ],
  },
  {
    title: "Contenido",
    href: "/blog",
    items: [
      { label: "Blog", href: "/blog", icon: "book" },
      { label: "Foro", href: "/foro", icon: "message" },
    ],
  },
]

export interface FooterLink {
  route?: string
  href?: string
  label: string
  external?: boolean
}

export const FOOTER_COLS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Explorar",
    links: [
      { route: "/eventos", label: "Eventos" },
      { route: "/juegos", label: "Juegos" },
      { route: "/herramientas", label: "Herramientas" },
      { route: "/clasificacion", label: "Clasificación" },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { route: "/comunidad", label: "Comunidad" },
      { route: "/foro", label: "Foro" },
      { route: "/blog", label: "Blog" },
      { href: "https://discord.gg/TWqjNHQz7d", label: "Discord", external: true },
    ],
  },
  {
    title: "Sistema",
    links: [
      { route: "/styles/components", label: "Componentes" },
      { route: "/perfil", label: "Mi perfil" },
      { route: "/admin", label: "Admin" },
      { route: "/privacidad", label: "Privacidad" },
    ],
  },
]

export const FOOTER_SOCIAL: { icon: string; label: string; href: string }[] = [
  { icon: "discord", label: "Discord", href: "https://discord.gg/TWqjNHQz7d" },
  { icon: "message", label: "Foro", href: "/foro" },
  { icon: "book", label: "Blog", href: "/blog" },
  { icon: "globe", label: "Web", href: "/" },
]
