import { getLandingItems } from "@/data/games"
import { HUB_SLUGS } from "@/components/boffmedia/ui/tools/tools-data"
import type { IconName } from "@/components/boffmedia/primitives/icon"

/* Journey palette — each stop tints the sky; color interpolates continuously
   between stops so there are no hard edges between sections. */
export const TV3_ZONES: [number, number, number][] = [
  [255, 92, 10], // 0 · Hero — brand orange
  [255, 138, 34], // 1 · Herramientas — amber
  [77, 163, 255], // 2 · SmartRotom — blue
  [255, 84, 52], // 3 · Torneos — red-orange
  [52, 211, 119], // 4 · Juegos — green
  [255, 178, 36], // 5 · Comunidad — gold
  [255, 92, 10], // 6 · Meta — orange
]

export const TV3_STOPS = [
  { id: "tv-hero", n: "00", t: "Inicio" },
  { id: "tv-cp1", n: "01", t: "Herramientas" },
  { id: "tv-cp2", n: "02", t: "SmartRotom" },
  { id: "tv-cp3", n: "03", t: "Torneos" },
  { id: "tv-cp4", n: "04", t: "Juegos" },
  { id: "tv-cp5", n: "05", t: "Comunidad" },
  { id: "tv-meta", n: "06", t: "Meta" },
]

// TODO(real-data): editorial placeholders until live stats/feed/event APIs
// exist — tracked in BOFFMEDIA_V3_ROADMAP.md (Phase 3).
export const TV3_HUD = [
  { k: "Partida", big: "412", suf: "+", sub: "jugadores activos", live: true },
  { k: "Temporada", big: "04", sub: "en emisión" },
]

/** Real tool count across every hub game (drives the landing "utilidades" stat). */
export const TV3_TOOL_COUNT = HUB_SLUGS.reduce((n, slug) => n + getLandingItems(slug).length, 0)

interface Tv3Tool {
  ix: string
  n: string
  d: string
  ic: IconName
  href: string
}

export const TV3_TOOLS: Tv3Tool[] = [
  { ix: "01", n: "BattleSim", d: "Simulador de combates dobles VGC con daño previsto.", ic: "sword", href: "/pokemon/battlesim" },
  { ix: "02", n: "Calculadora de daño", d: "Rangos VGC y singles al instante, con enlaces.", ic: "calc", href: "/pokemon/vgc/damage-calculator" },
  { ix: "03", n: "VGC Tracker", d: "Registra partidas y analiza tu rendimiento.", ic: "chart", href: "/pokemon/vgc/tracker" },
  { ix: "04", n: "Análisis de Meta", d: "Uso, tendencias y detalle por especie del meta VGC.", ic: "trending", href: "/pokemon/vgc/meta" },
  { ix: "05", n: "Claves de Steam", d: "Catálogo de claves para sorteos y entregas.", ic: "key", href: "/otros/keys" },
  { ix: "06", n: "TCG Pocket", d: "Colección, sobres y combates del TCG Pocket.", ic: "cards", href: "/pokemon/tcgpocket" },
]

export const TV3_FEATS = ["Multiplataforma", "Pokédex viva", "Economía en vivo", "Mensajería"]

// TODO(real-data): placeholder event until the events API feeds the landing.
export const TV3_EVENT = { title: "Torneo Regional — Wingull 2", date: "14 JUL 2026 · 18:00" }
export const TV3_EVENT_TS = new Date("2026-07-14T18:00:00").getTime()

// TODO(real-data): placeholder cards/feed until community data feeds the landing.
export const TV3_GAMES = [
  { n: "Pixelmon Wingull 2", d: "La aventura Pokémon definitiva dentro de Minecraft.", tag: "Insignia — Temporada 04", img: "/img/personajes.webp" },
  { n: "Minecraft Bingo", d: "Carreras de objetivos por equipos, ediciones rápidas.", tag: "Competitivo — Semanal", ph: "Minecraft Bingo" },
  { n: "Project ZomBOFF", d: "Supervivencia cooperativa en un mundo infectado.", tag: "Survival — Noches especiales", ph: "Project ZomBOFF" },
]

export const TV3_FEED = [
  { k: "win", t: "AxelCraft ganó un combate ranked", ln: "border-l-ok", tp: "bg-ok" },
  { k: "gift", t: "Key entregada a NovaPixel en el sorteo", ln: "border-l-warn", tp: "bg-warn" },
  { k: "join", t: "Kira_07 se unió al Equipo Volt", ln: "border-l-signal", tp: "bg-signal" },
  { k: "win", t: "MintLeaf entró al top 5 de la temporada", ln: "border-l-ok", tp: "bg-ok" },
]

export const DISCORD = "https://discord.gg/TWqjNHQz7d"
