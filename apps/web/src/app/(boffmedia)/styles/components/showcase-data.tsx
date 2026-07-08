import type { Notif } from "@/components/boffmedia/ui/navigation/NotifMenu"
import type { ToolCardData } from "@/components/boffmedia/ui/tools"
import type { EventLike, GameLike, AchievementLike } from "@/components/boffmedia/ui/events"
import type { LegalSection } from "@/components/boffmedia/ui/legal/LegalDoc"

// Index model + demo data for the Sistema showcase. Split out of page.tsx (§10).

export interface SecMeta {
  id: string
  label: string
}
export interface Chapter {
  name: string
  dom: string
  sections: SecMeta[]
}

export const CHAPTERS: Chapter[] = [
  {
    name: "Bases",
    dom: "Sistema",
    sections: [
      { id: "color", label: "Color" },
      { id: "tipografia", label: "Tipografía" },
      { id: "geometria", label: "Geometría" },
    ],
  },
  {
    name: "Primitivas",
    dom: "Sistema",
    sections: [
      { id: "botones", label: "Botones" },
      { id: "chips", label: "Chips y badges" },
      { id: "formularios", label: "Formularios" },
      { id: "seleccion", label: "Selección y rango" },
      { id: "navegacion", label: "Navegación" },
      { id: "navdrop", label: "Dropdown de nav" },
      { id: "navbar", label: "Sesión e idioma" },
      { id: "pie", label: "Pie de página" },
      { id: "acceso", label: "Acceso" },
      { id: "menus", label: "Menús y avisos" },
      { id: "indicadores", label: "Anillo y carga" },
      { id: "ayudas", label: "Tooltip y teclas" },
      { id: "scrollbar", label: "Scrollbar" },
    ],
  },
  {
    name: "Patrones",
    dom: "Sistema",
    sections: [
      { id: "paneles", label: "Paneles" },
      { id: "datos", label: "Datos" },
      { id: "estados", label: "Estados" },
    ],
  },
  {
    name: "Movimiento",
    dom: "Sistema",
    sections: [
      { id: "fxniveles", label: "Niveles de FX" },
      { id: "marquesina", label: "Marquesina" },
      { id: "contador", label: "Contador y decode" },
      { id: "interaccion", label: "Cursor e imán" },
    ],
  },
  {
    name: "Hub de herramientas",
    dom: "Herramientas",
    sections: [
      { id: "panelsec", label: "Panel de sección" },
      { id: "tarjetas", label: "Tarjeta de herramienta" },
      { id: "portadas", label: "Portada de juego" },
      { id: "banner", label: "Banner de juego" },
      { id: "destacada", label: "Destacada" },
      { id: "herovideo", label: "Hero con vídeo" },
      { id: "sidenav", label: "Sidebar colapsable" },
      { id: "externos", label: "Enlaces externos" },
    ],
  },
  {
    name: "Datos en vivo",
    dom: "Herramientas",
    sections: [
      { id: "dkpiezas", label: "Sprites y jugador" },
      { id: "dktabla", label: "Tabla de datos" },
      { id: "dkfiltros", label: "Filtros y búsqueda" },
      { id: "dkindicadores", label: "Indicadores" },
      { id: "dkgraficas", label: "Gráficas" },
      { id: "dkestadosvivo", label: "Carga y avisos" },
    ],
  },
  {
    name: "Juegos y Eventos",
    dom: "Plataforma",
    sections: [
      { id: "jgcover", label: "Portada de juego" },
      { id: "gamehero", label: "Cabecera de juego" },
      { id: "evcard", label: "Tarjeta de evento" },
      { id: "evstatus", label: "Estado y cuenta atrás" },
      { id: "evbanner", label: "Banner de evento" },
      { id: "evlogro", label: "Logro y progreso" },
      { id: "evlead", label: "Clasificación y podio" },
    ],
  },
  {
    name: "Perfil",
    dom: "Plataforma",
    sections: [
      { id: "pf-identidad", label: "Identidad" },
      { id: "pf-rango", label: "Rango y stats" },
      { id: "pf-vitrina", label: "Vitrina" },
      { id: "pf-actividad", label: "Actividad" },
      { id: "pf-vinculadas", label: "Cuenta y enlaces" },
      { id: "pf-torneo", label: "Torneo en curso" },
    ],
  },
  {
    name: "Legal",
    dom: "Plataforma",
    sections: [{ id: "doclegal", label: "Documento legal" }],
  },
]

export const DOMAIN_ORDER = ["Sistema", "Herramientas", "Plataforma"]
export const DOMAINS = DOMAIN_ORDER.map((name) => ({ name, chapters: CHAPTERS.filter((c) => c.dom === name) }))

// Demo-only notifications — the real NotifMenu starts empty until an API exists.
export const DEMO_NOTIFS: Notif[] = [
  { id: 1, icon: "trophy", tone: "accent", text: "Tu equipo quedó 3.º en el Torneo Wingull 2.", time: "hace 2 min", read: false },
  { id: 2, icon: "gift", tone: "info", text: "Nuevo sorteo: clave de Steam disponible.", time: "hace 1 h", read: false },
  { id: 3, icon: "message", tone: "muted", text: "RotomChef respondió a tu hilo del foro.", time: "hace 3 h", read: false },
  { id: 4, icon: "star", tone: "muted", text: "Desbloqueaste el logro «Racha de 10».", time: "ayer", read: true },
]

// Demo data for the tool/platform chapters — showcase-only, mirrors real shapes.
export const DEMO_TOOLS: ToolCardData[] = [
  { key: "calc", title: "Calculadora de daño", desc: "Rangos exactos, KO y velocidad para VGC.", features: ["Dobles", "Regulación H"], icon: "target", href: "#", hueColor: "hsl(18 90% 55%)", isNew: true, popularity: "high", featured: true },
  { key: "tracker", title: "Tracker de partidas", desc: "Registra sesiones, ELO y estadísticas.", features: ["IndexedDB", "CSV"], icon: "trophy", href: "#", hueColor: "hsl(18 90% 55%)", popularity: "medium" },
  { key: "meta", title: "Meta VGC", desc: "Uso, divergencia y detalle por especie.", features: ["Smogon", "Limitless"], icon: "gamepad", href: "#", hueColor: "hsl(18 90% 55%)" },
]

// Showcase demo game — carries fields the games API lacks (short·events·players·hue). [deferred]
export const DEMO_GAME: GameLike = { id: 1, title: "Pokémon VGC", description: "Combates dobles oficiales de la comunidad.", icon: null, active: 1, createdAt: "2024-01-10", hue: "hsl(18 90% 55%)", short: "VGC", events: 12, players: 3400 }

// Showcase demo events — carry participants·organizer·hue for the full card. [deferred]
export const DEMO_EVENTS: EventLike[] = [
  { id: 1, title: "Copa Relámpago VGC", description: "Torneo dobles Regulación H, suizo + top cut.", gameName: "Pokémon VGC", startDate: "2026-07-20", status: "upcoming", type: "event", participants: 96, hue: "hsl(18 90% 55%)", organizer: { role: "coorg", name: "Liga VGC España", avatar: "L" } },
  { id: 2, title: "Liga Wingull · Jornada 3", description: "Serie semanal de la comunidad.", gameName: "Pokémon VGC", startDate: "2026-07-01", status: "active", type: "event", participants: 48, hue: "hsl(18 90% 55%)", organizer: { role: "boffmedia", name: "Boffmedia", avatar: "B" } },
  { id: 3, title: "Liga TCG Pocket · Temporada 2", description: "Liga mensual con puntuación acumulada y un sobre garantizado por participación.", gameName: "TCG Pocket", startDate: "2026-05-09", endDate: "2026-05-30", status: "completed", type: "server", participants: 147, hue: "hsl(265 60% 66%)", organizer: { role: "platform", name: "Smash Barcelona", avatar: "S" } },
]

// earned·globalPct·earnedDate are per-user progress the catalogue API lacks. [deferred]
export const DEMO_ACHS: AchievementLike[] = [
  { id: 1, name: "Campeón de la Copa", description: "Gana un torneo oficial.", points: 500, category: "competition", rarity: "gold", eventName: "Copa Relámpago", earned: true, earnedDate: "2026-06-16" },
  { id: 2, name: "Racha de 10", description: "Gana 10 combates seguidos.", points: 150, category: "challenge", rarity: "silver", itemType: "medal", earned: false, globalPct: 12 },
  { id: 3, name: "Primer combate", description: "Juega tu primera partida.", points: 10, category: "participation", rarity: "bronze", earned: false, globalPct: 68 },
]

export const DEMO_LEGAL: LegalSection[] = [
  { id: "l-intro", title: "Introducción", body: ["Demostración del componente LegalDoc: índice pegajoso con scroll-spy y secciones numeradas.", ["Texto de ejemplo, sin valor legal.", "El contenido real vive en las páginas de políticas.", "El índice resalta la sección visible."]] },
  { id: "l-datos", title: "Datos que tratamos", body: ["Solo se recoge lo imprescindible para prestar el servicio."] },
  { id: "l-derechos", title: "Tus derechos", body: ["Puedes solicitar acceso, rectificación o borrado de tus datos cuando quieras."] },
]

export const DEMO_SPRITE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='20' cy='20' r='15' fill='%23e8863b'/><circle cx='20' cy='20' r='15' fill='none' stroke='%23000' stroke-opacity='.25'/></svg>"
export const DEMO_TEAM = [
  { name: "Incineroar", src: DEMO_SPRITE },
  { name: "Rillaboom", src: DEMO_SPRITE },
  { name: "Flutter Mane", src: DEMO_SPRITE },
  { name: "Amoonguss", src: DEMO_SPRITE },
  { name: "Urshifu", src: DEMO_SPRITE },
  { name: "Landorus", src: DEMO_SPRITE },
]
