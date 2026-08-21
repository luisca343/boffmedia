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

// Fallback for the landing HUD only — `TvHero` renders real site stats from
// `useSiteStats` (GET /stats/site) and drops to these while the API loads or is
// unavailable, so the hero stays visually stable.
// NOTE: HUD labels are translated at render time in TvHero via useTranslations;
// these values are only the numeric fallbacks shown while loading.
export const TV3_HUD = [
  { k: "Partida", big: "412", suf: "+", sub: "jugadores activos", live: true, tk: "hudFallbackGame" },
  { k: "Temporada", big: "04", sub: "en emisión", tk: "hudFallbackSeason" },
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

// TV3_GAMES stays editorial (no games-showcase API). TV3_FEED below is only the
// fallback for `TvComunidad`'s activity ticker, which renders real activity from
// `useSiteActivity` (GET /activity) when available.
export const TV3_GAMES = [
  { n: "Pixelmon Wingull 2", d: "La aventura Pokémon definitiva dentro de Minecraft.", tag: "Insignia — Temporada 04", img: staticAsset(ASSET.boffmedia.img, 'personajes.webp'), tk: "wingull" },
  { n: "Minecraft Bingo", d: "Carreras de objetivos por equipos, ediciones rápidas.", tag: "Competitivo — Semanal", ph: "Minecraft Bingo", tk: "bingo" },
  { n: "Project ZomBOFF", d: "Supervivencia cooperativa en un mundo infectado.", tag: "Survival — Noches especiales", ph: "Project ZomBOFF", tk: "zomboff" },
]

export const TV3_FEED = [
  { k: "win", t: "AxelCraft ganó un combate ranked", ln: "border-l-ok", tp: "bg-ok", tk: "feedWin1" },
  { k: "gift", t: "Key entregada a NovaPixel en el sorteo", ln: "border-l-warn", tp: "bg-warn", tk: "feedGift1" },
  { k: "join", t: "Kira_07 se unió al Equipo Volt", ln: "border-l-signal", tp: "bg-signal", tk: "feedJoin1" },
  { k: "win", t: "MintLeaf entró al top 5 de la temporada", ln: "border-l-ok", tp: "bg-ok", tk: "feedWin2" },
]

export const DISCORD = "https://discord.gg/TWqjNHQz7d"
