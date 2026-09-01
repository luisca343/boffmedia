import { getLandingItems, getToolHref } from "@/data/games"
import { HUB_SLUGS } from "@/components/boffmedia/ui/tools/tools-data"
import type { IconName } from "@boffmedia/ui"
import { ASSET, staticAsset } from "@/lib/assets"

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
  { id: "tv-hero", n: "00", t: "Inicio", tk: "hero" },
  { id: "tv-cp1", n: "01", t: "Herramientas", tk: "tools" },
  { id: "tv-cp2", n: "02", t: "SmartRotom", tk: "smartrotom" },
  { id: "tv-cp3", n: "03", t: "Torneos", tk: "torneos" },
  { id: "tv-cp4", n: "04", t: "Juegos", tk: "juegos" },
  { id: "tv-cp5", n: "05", t: "Comunidad", tk: "comunidad" },
  { id: "tv-meta", n: "06", t: "Meta", tk: "meta" },
]

/** Real tool count across every hub game (drives the landing "utilidades" stat). */
export const TV3_TOOL_COUNT = HUB_SLUGS.reduce((n, slug) => n + getLandingItems(slug).length, 0)

interface Tv3Tool {
  ix: string
  n: string
  d: string
  ic: IconName
  href: string
  tk?: string
}

// Curated landing feature list — display copy (name/description/icon) is
// landing-specific, but hrefs derive from the `@/data/games` registry so a
// route change follows automatically instead of drifting here.
export const TV3_TOOLS: Tv3Tool[] = [
  { ix: "01", n: "BattleSim", d: "Simulador de combates dobles VGC con daño previsto.", ic: "sword", href: getToolHref("pokemon", "battlesim"), tk: "battlesim" },
  { ix: "02", n: "Calculadora de daño", d: "Rangos VGC y singles al instante, con enlaces.", ic: "calc", href: getToolHref("pokemon", "damageCalc"), tk: "damageCalc" },
  { ix: "03", n: "VGC Tracker", d: "Registra partidas y analiza tu rendimiento.", ic: "chart", href: getToolHref("pokemon", "tracker"), tk: "tracker" },
  { ix: "04", n: "Análisis de Meta", d: "Uso, tendencias y detalle por especie del meta VGC.", ic: "trending", href: getToolHref("pokemon", "meta"), tk: "metaAnalysis" },
  { ix: "05", n: "Claves de Steam", d: "Catálogo de claves para sorteos y entregas.", ic: "key", href: getToolHref("otros", "keys"), tk: "steamKeys" },
  { ix: "06", n: "TCG Pocket", d: "Colección, sobres y combates del TCG Pocket.", ic: "cards", href: getToolHref("pokemon", "tcgPanel"), tk: "tcgPocket" },
]

export const TV3_FEATS = ["Multiplataforma", "Pokédex viva", "Economía en vivo", "Mensajería"]

// Fallback next-event only — `TvTorneos` shows the real next upcoming event
// (useGetEvents) and drops to this while events load or if none are scheduled.
export const TV3_EVENT = { title: "Torneo Regional — Wingull 2", date: "14 JUL 2026 · 18:00", tk: "fallback" }
export const TV3_EVENT_TS = new Date("2026-07-14T18:00:00").getTime()

// TV3_GAMES stays editorial: there is no games-showcase API, and these three
// servers are real. Unlike the stats and the activity ticker, nothing here is a
// stand-in for data we could have fetched.
export const TV3_GAMES = [
  { n: "Pixelmon Wingull 2", d: "La aventura Pokémon definitiva dentro de Minecraft.", tag: "Insignia — Temporada 04", img: staticAsset(ASSET.boffmedia.img, 'personajes.webp'), tk: "wingull" },
  { n: "Minecraft Bingo", d: "Carreras de objetivos por equipos, ediciones rápidas.", tag: "Competitivo — Semanal", ph: "Minecraft Bingo", tk: "bingo" },
  { n: "Project ZomBOFF", d: "Supervivencia cooperativa en un mundo infectado.", tag: "Survival — Noches especiales", ph: "Project ZomBOFF", tk: "zomboff" },
]

/**
 * Floors the landing's community numbers have to clear before they are shown.
 *
 * The stats themselves are real (see the comments in `TvHero` / `TvComunidad`
 * about the editorial fallbacks that used to sit there) — the problem is that a
 * true "1+ usuarios registrados" undersells the site harder than saying nothing
 * does. Below the floor the surface renders its count-free variant; above it the
 * number appears on its own, with nothing to remember to switch back on.
 *
 * `events` is only consulted for the TOTAL: a live event is a signal rather than
 * a size claim, so one running event still shows.
 */
export const TV3_STATS_FLOOR = { users: 25, events: 3, participants: 10 }

export const DISCORD = "https://discord.gg/TWqjNHQz7d"
