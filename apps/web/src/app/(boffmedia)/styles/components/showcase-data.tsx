import type { Notif } from "@/components/boffmedia/ui/navigation/NotifMenu"
import type { ToolCardData } from "@/components/boffmedia/ui/tools"
import type { EventLike, GameLike, AchievementLike, PlayerLike } from "@/components/boffmedia/ui/events"
import type { LegalSection } from "@/components/boffmedia/ui/legal/LegalDoc"
import type { AvMember, AvPipeStage } from "@/app/(boffmedia)/admin/_components/ui/av-data"

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
      { id: "cinetica", label: "Palabra cinética" },
      { id: "contador", label: "Contador y decode" },
      { id: "interaccion", label: "Cursor e imán" },
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
    name: "Torneos",
    dom: "Plataforma",
    sections: [
      { id: "tncompetidor", label: "Competidor y formato" },
      { id: "tncuadros", label: "Cuadros de eliminación" },
      { id: "tngrupos", label: "Grupos, liga y crosstable" },
      { id: "tnlibre", label: "Clasificación libre" },
      { id: "tnradial", label: "Cuadro radial" },
      { id: "tnpartida", label: "Partida en directo" },
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
    name: "Admin",
    dom: "Plataforma",
    sections: [
      { id: "admkpi", label: "KPI y métricas" },
      { id: "admstatus", label: "Estado y pipeline" },
      { id: "admrow", label: "Filas y miembros" },
      { id: "admtable", label: "Tabla y datos" },
      { id: "admchart", label: "Gráficas y barras" },
      { id: "admpanel", label: "Panel y cabecera" },
      { id: "admfeedback", label: "Avisos y diálogo" },
    ],
  },
  {
    name: "Comunidad",
    dom: "Plataforma",
    sections: [
      { id: "cmcard", label: "Tarjeta de artículo" },
      { id: "cmauthor", label: "Autoría y etiquetas" },
      { id: "cmprose", label: "Cuerpo de artículo" },
      { id: "cmcat", label: "Categoría del foro" },
      { id: "cmthread", label: "Hilo del foro" },
      { id: "cmvote", label: "Voto y miembros" },
    ],
  },
  {
    name: "Legal",
    dom: "Plataforma",
    sections: [
      { id: "doclegal", label: "Documento legal" },
      { id: "doccontrols", label: "Control de datos" },
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
    name: "Sorteos",
    dom: "Herramientas",
    sections: [
      { id: "srtstatus", label: "Estado y organizador" },
      { id: "srtcard", label: "Tarjeta de sorteo" },
      { id: "srtfeat", label: "Sorteo destacado" },
      { id: "srtprize", label: "Escaparate de premio" },
      { id: "srtreqs", label: "Requisitos y pasos" },
      { id: "srtdraw", label: "Sorteo y ganador" },
    ],
  },
  {
    name: "Sorteo rápido",
    dom: "Herramientas",
    sections: [
      { id: "srqspin", label: "Ruleta del sorteo" },
      { id: "srqrow", label: "Fila de participante" },
      { id: "srqreveal", label: "Ganadores y semilla" },
    ],
  },
  {
    name: "Calendario",
    dom: "Herramientas",
    sections: [
      { id: "lzatoms", label: "Plataforma y seguimiento" },
      { id: "lzbanner", label: "Tarjeta banner" },
      { id: "lzcover", label: "Póster de estreno" },
      { id: "lzcard", label: "Fila de estreno" },
      { id: "lzgroup", label: "Separador de fecha" },
      { id: "lzmonth", label: "Rejilla de mes" },
      { id: "lzweek", label: "Tira de la semana" },
      { id: "lztime", label: "Línea de tiempo" },
    ],
  },
  {
    name: "Catálogo",
    dom: "Herramientas",
    sections: [
      { id: "ctatoms", label: "Nota, estado y registro" },
      { id: "ctcover", label: "Carátula y tarjeta" },
      { id: "ctdist", label: "Distribución y listas" },
    ],
  },
  {
    name: "Claves de Steam",
    dom: "Herramientas",
    sections: [
      { id: "kvatoms", label: "Estado, arte y valoración" },
      { id: "kvsections", label: "Ficha de Steam" },
      { id: "kvcard", label: "Tarjeta de juego" },
    ],
  },
  {
    name: "Calculadora",
    dom: "Pokémon",
    sections: [
      { id: "cxentradas", label: "Entradas de cálculo" },
      { id: "cxstats", label: "Stats y salud" },
      { id: "cxresultado", label: "Veredicto y rangos" },
      { id: "cxpiezas", label: "Piezas de Pokémon" },
    ],
  },
  {
    name: "Datos en vivo",
    dom: "Pokémon",
    sections: [
      { id: "dkpiezas", label: "Sprites y jugador" },
      { id: "dktabla", label: "Tabla de datos" },
      { id: "dkfiltros", label: "Filtros y búsqueda" },
      { id: "dkindicadores", label: "Indicadores" },
      { id: "dkgraficas", label: "Gráficas" },
      { id: "dkrondas", label: "Rondas y cuadro" },
      { id: "dkestadosvivo", label: "Carga, vacío y avisos" },
    ],
  },
  {
    name: "Battlesim",
    dom: "Pokémon",
    sections: [
      { id: "bxidentidad", label: "Identidad de combate" },
      { id: "bxplacas", label: "Placas y salud" },
      { id: "bxmando", label: "Consola de mando" },
      { id: "bxmarcador", label: "Marcador y ritmo" },
      { id: "bxregistro", label: "Registro y equipo" },
      { id: "bxmenu", label: "Menú de juego y constructor" },
    ],
  },
  {
    name: "TCG Pocket",
    dom: "Pokémon",
    sections: [
      { id: "tgcarta", label: "Cara de carta y rejilla" },
      { id: "tgdatos", label: "Progreso, anillo y estadísticas" },
      { id: "tgsobres", label: "Sobre y probabilidades" },
    ],
  },
  {
    name: "Wonder Mail",
    dom: "Pokémon",
    sections: [
      { id: "wmforms", label: "Selección y grupos de opciones" },
      { id: "wmreveal", label: "Revelación progresiva y avisos" },
      { id: "wmcode", label: "Bloque de código" },
    ],
  },
  {
    name: "Planificador",
    dom: "Monster Hunter",
    sections: [
      { id: "mhequip", label: "Equipo y selector" },
      { id: "mhstats", label: "Stats, afilado y resistencias" },
      { id: "mhskills", label: "Habilidades y bonus" },
      { id: "mhtreepieces", label: "Nodo de árbol y materiales" },
    ],
  },
  {
    name: "Bestiario",
    dom: "Monster Hunter",
    sections: [
      { id: "mbroster", label: "Roster y amenaza" },
      { id: "mbweak", label: "Debilidades e hitzones" },
      { id: "mbdrops", label: "Botín y roturas" },
      { id: "mbstrat", label: "Estrategia y pestañas" },
    ],
  },
  {
    name: "Herramientas MH",
    dom: "Monster Hunter",
    sections: [
      { id: "mhshellnav", label: "Chasis unificado" },
      { id: "mhshelldmg", label: "Laboratorio de daño" },
      { id: "mhshellhunt", label: "Lista de caza" },
    ],
  },
  {
    name: "Armería",
    dom: "Monster Hunter",
    sections: [
      { id: "mhdbsets", label: "Catálogo de armadura" },
      { id: "mhdbskills", label: "Habilidades y fuentes" },
      { id: "mhdbweapons", label: "Armas y afilado" },
      { id: "mhdbtype", label: "Datos por tipo de arma" },
    ],
  },
  {
    name: "Schematic Compat",
    dom: "Otros juegos",
    sections: [
      { id: "schflujo", label: "Pasos y medidor" },
      { id: "schentorno", label: "Entornos y carga" },
      { id: "schdiff", label: "Diff y filtros" },
      { id: "schmapeo", label: "Filas de mapeo" },
      { id: "schvista", label: "Vista 3D e inspección" },
      { id: "schexport", label: "Lote y exportación" },
    ],
  },
  {
    name: "Mewgenics",
    dom: "Otros juegos",
    sections: [
      { id: "mewpapel", label: "Papel y fichas" },
      { id: "mewprimitivas", label: "Búsqueda, datos y filtros" },
      { id: "mewatoms", label: "Tesela y rareza" },
      { id: "meweffects", label: "Efectos y estadísticas" },
      { id: "mewpopover", label: "Ficha al vuelo" },
    ],
  },
]

export const DOMAIN_ORDER = ["Sistema", "Plataforma", "Herramientas", "Pokémon", "Monster Hunter", "Otros juegos"]
export const DOMAINS = DOMAIN_ORDER.map((name) => ({ name, chapters: CHAPTERS.filter((c) => c.dom === name) })).filter(
  (d) => d.chapters.length > 0,
)

// Demo-only notifications — the real NotifMenu starts empty until an API exists.
export const DEMO_NOTIFS: Notif[] = [
  { id: 1, icon: "trophy", tone: "accent", text: "Tu equipo quedó 3.º en el Torneo Wingull 2.", time: "hace 2 min", read: false },
  { id: 2, icon: "gift", tone: "info", text: "Nuevo sorteo: clave de Steam disponible.", time: "hace 1 h", read: false },
  { id: 3, icon: "message", tone: "muted", text: "RotomChef respondió a tu hilo del foro.", time: "hace 3 h", read: false },
  { id: 4, icon: "star", tone: "muted", text: "Desbloqueaste el logro «Racha de 10».", time: "ayer", read: true },
]

// Demo data for the tool/platform chapters — showcase-only, mirrors real shapes.
export const DEMO_TOOLS: ToolCardData[] = [
  { key: "calc", cat: "Pokémon VGC", title: "Calculadora de daño", desc: "Rangos exactos, KO y velocidad para VGC.", features: ["Dobles", "Regulación H"], icon: "target", href: "#", hueColor: "hsl(18 90% 55%)", isNew: true, popularity: "high", featured: true },
  { key: "tracker", cat: "Pokémon VGC", title: "Tracker de partidas", desc: "Registra sesiones, ELO y estadísticas.", features: ["IndexedDB", "CSV"], icon: "trophy", href: "#", hueColor: "hsl(18 90% 55%)", popularity: "high" },
  { key: "meta", cat: "Pokémon VGC", title: "Meta VGC", desc: "Uso, divergencia y detalle por especie.", features: ["Smogon", "Limitless"], icon: "gamepad", href: "#", hueColor: "hsl(18 90% 55%)" },
  { key: "builder", cat: "Pokémon VGC", title: "Constructor de equipos", desc: "Arma, valida y exporta equipos completos.", features: ["Showdown", "Export"], icon: "layers", href: "#", hueColor: "hsl(18 90% 55%)", soon: true },
]

// Showcase demo game — carries fields the games API lacks (short·events·players·hue). [deferred]
export const DEMO_GAME: GameLike = { id: 1, title: "Pokémon VGC", description: "Combates dobles oficiales de la comunidad.", icon: null, createdAt: "2024-01-10", hue: "hsl(18 90% 55%)", short: "VGC", events: 12, players: 3400 }

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

// Leaderboard rows for Podium/LeaderTable/PlayerLine/ParticipantStack.
// The ranking API doesn't exist yet — these are demo-only. [deferred]
export const DEMO_TOP: PlayerLike[] = [
  { userId: 1, nickname: "RotomChef", avatar: "R", totalPoints: 4820, medalCount: 9, achievementCount: 31, gameShort: "VGC", hue: 18 },
  { userId: 2, nickname: "EnderQueen", avatar: "E", totalPoints: 4510, medalCount: 7, achievementCount: 28, gameShort: "MC", hue: 130 },
  { userId: 3, nickname: "TeraBlast", avatar: "T", totalPoints: 4180, medalCount: 6, achievementCount: 26, gameShort: "VGC", hue: 18 },
  { userId: 4, nickname: "PixelMiner", avatar: "P", totalPoints: 3990, medalCount: 8, achievementCount: 24, gameShort: "MC", hue: 130 },
  { userId: 5, nickname: "RathalosX", avatar: "R", totalPoints: 3760, medalCount: 5, achievementCount: 22, gameShort: "MH", hue: 28 },
  { userId: 6, nickname: "FalseSwipe", avatar: "F", totalPoints: 3540, medalCount: 4, achievementCount: 21, gameShort: "VGC", hue: 18 },
  { userId: 7, nickname: "CreeperPunk", avatar: "C", totalPoints: 3380, medalCount: 5, achievementCount: 19, gameShort: "MC", hue: 130 },
  { userId: 8, nickname: "CardSharp", avatar: "C", totalPoints: 3150, medalCount: 3, achievementCount: 18, gameShort: "TCGP", hue: 265 },
  { userId: 9, nickname: "SmashLord", avatar: "S", totalPoints: 2980, medalCount: 4, achievementCount: 17, gameShort: "SSBU", hue: 350 },
]

// Admin AI-dashboard demos — the ML pipeline/telemetry board isn't in the real
// admin API; it's an aspirational control-room fed by demo data. [deferred]
export const DEMO_PIPELINE: AvPipeStage[] = [
  { key: "ai-replays", name: "Replays", icon: "database", meta: "2.5M SV", state: "done" },
  { key: "ai-pretrain", name: "Pre-entreno", icon: "layers", meta: "v2 · 68%", state: "active" },
  { key: "ai-finetune", name: "Fine-tuning", icon: "sliders", meta: "Reg M-A", state: "active" },
  { key: "ai-selfplay", name: "Self-play", icon: "users", meta: "en cola", state: "pending" },
  { key: "ai-eval", name: "Evaluación", icon: "target", meta: "WR 73.6%", state: "done" },
  { key: "ai-deploy", name: "Despliegue", icon: "zap", meta: "ELO 1842", state: "done" },
]

// Admin moderation roster demo — not exposed by the members API yet. [deferred]
export const DEMO_MEMBERS: AvMember[] = [
  { id: 1, name: "Axel Vidal", handle: "axelcraft", role: "Moderador", roleTone: "accent", games: "VGC · Minecraft", joined: "2023", status: "active", points: 12480 },
  { id: 2, name: "Nova Prieto", handle: "novapixel", role: "Miembro", games: "VGC", joined: "2024", status: "active", points: 11920 },
  { id: 3, name: "Zenor Ruiz", handle: "zenor", role: "Miembro", games: "VGC · MH Wilds", joined: "2024", status: "muted", points: 9815 },
]

// Deterministic training-loss curve for the admin ChartFrame demo. [deferred]
export function aiCurve(n: number, start: number, end: number, wobble = 0, seed = 1): number[] {
  return Array.from({ length: n }, (_, i) => {
    const t = n <= 1 ? 1 : i / (n - 1)
    const base = end + (start - end) * Math.pow(1 - t, 1.8)
    const noise = wobble ? Math.sin((i + seed) * 1.7) * wobble * (1 - t * 0.6) : 0
    return +(base + noise).toFixed(4)
  })
}
export const AV_CHART_C = { train: "var(--accent-bright)", val: "var(--info)" }

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
