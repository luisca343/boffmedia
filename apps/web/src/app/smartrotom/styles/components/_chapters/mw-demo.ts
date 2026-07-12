import type {
  CategoryCardData,
  ChatMessageData,
  StreamCardData,
  VideoCardData,
} from "@/components/smartrotom/media/ui"

// Demo assets are inline SVG data-URIs: no external CDN (network policy) and no
// `Math.random()` — the showcase must render byte-identically on every load.
const svg = (body: string, w: number, h: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  )}`

function thumb(c1: string, c2: string, w = 320, h = 180) {
  return svg(
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>` +
      `</linearGradient></defs>` +
      `<rect width="${w}" height="${h}" fill="url(#g)"/>` +
      `<circle cx="${w * 0.78}" cy="${h * 0.26}" r="${h * 0.36}" fill="#ffffff" opacity="0.1"/>` +
      `<circle cx="${w * 0.2}" cy="${h * 0.86}" r="${h * 0.32}" fill="#000000" opacity="0.2"/>` +
      `<circle cx="${w * 0.5}" cy="${h * 0.5}" r="${h * 0.16}" fill="#ffffff" opacity="0.08"/>`,
    w,
    h,
  )
}

function box(c1: string, c2: string) {
  return thumb(c1, c2, 300, 400)
}

function face(c1: string, c2: string, initial: string) {
  return svg(
    `<defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>` +
      `</linearGradient></defs>` +
      `<rect width="72" height="72" fill="url(#f)"/>` +
      `<text x="36" y="47" font-family="sans-serif" font-size="30" font-weight="700" fill="#ffffff" opacity="0.92" text-anchor="middle">${initial}</text>`,
    72,
    72,
  )
}

export const MW_FACES = {
  rotom: face("#ec4899", "#7c2d55", "R"),
  joy: face("#a855f7", "#4c1d95", "J"),
  oak: face("#06b6d4", "#0e4f5c", "O"),
  brock: face("#84cc16", "#3f6212", "B"),
} as const

export const MW_VIDEOS: VideoCardData[] = [
  {
    href: "#",
    thumb: thumb("#f472b6", "#7f1d3f"),
    title: "Reglamento VGC 2026 Regulación G explicado en 12 minutos",
    duration: "12:04",
    creator: "Rotom Analiza",
    creatorAvatar: MW_FACES.rotom,
    verified: true,
    views: "184 K",
    age: "hace 2 días",
  },
  {
    href: "#",
    thumb: thumb("#a855f7", "#3b1080"),
    // `progress` (0..1) es lo que dibuja la barra de «seguir viendo».
    progress: 0.62,
    title: "Construyendo un equipo de tormenta de arena desde cero",
    duration: "27:39",
    creator: "Profesor Oak",
    creatorAvatar: MW_FACES.oak,
    views: "42,1 K",
    age: "hace 6 h",
  },
]

export const MW_STREAMS: StreamCardData[] = [
  {
    href: "#",
    thumb: thumb("#c026d3", "#2e1065"),
    title: "Ladder a rango maestro · pregunta lo que quieras",
    streamer: "Enfermera Joy",
    streamerAvatar: MW_FACES.joy,
    verified: true,
    game: "Pokémon Escarlata y Púrpura",
    viewers: 12480,
    tags: ["Español", "VGC", "Sin spoilers"],
  },
  {
    href: "#",
    thumb: thumb("#7c3aed", "#131033"),
    title: "Maratón de gimnasios en dificultad extrema",
    streamer: "Brock",
    streamerAvatar: MW_FACES.brock,
    game: "Nuzlocke",
    viewers: 863,
    tags: ["Reto"],
  },
]

export const MW_CATEGORIES: CategoryCardData[] = [
  { href: "#", art: box("#a855f7", "#2e1065"), name: "Pokémon Escarlata y Púrpura", viewers: "32,4 K", streams: 214 },
  { href: "#", art: box("#ec4899", "#701a45"), name: "Charla", viewers: "18,9 K", streams: 96 },
  { href: "#", art: box("#06b6d4", "#083344"), name: "Pokémon UNITE", viewers: "4,2 K", streams: 31 },
  { href: "#", art: box("#84cc16", "#1a2e05"), name: "Retro", viewers: "980", streams: 12 },
]

export const MW_CHAT: ChatMessageData[] = [
  { id: "m1", user: "pikachu_fan", color: "#22d3ee", msg: "¡ese Miraidon no se lo esperaba nadie!" },
  { id: "m2", user: "modmew", color: "#84cc16", msg: "recordad: sin spoilers de la final", mod: true },
  { id: "m3", user: "Enfermera Joy", color: "#f472b6", msg: "gracias por los 3 meses 💜", verified: true },
  { id: "m4", user: "sistema", msg: "kabutops_99 se ha suscrito por 6 meses seguidos", system: true },
  { id: "m5", user: "tú", color: "#f8fafc", msg: "vamos a por el terastal", you: true },
]
