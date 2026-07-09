// Demo data for the Sorteos chapter — the giveaways platform isn't wired to the
// v3 design system yet, so every specimen is fed from here. Ported from
// v3-sorteos-data.jsx (raw catalogue + deterministic participant seeding). [deferred]
import type { Sorteo, SrtParticipant } from "@/components/boffmedia/ui/giveaways"

const NOW = new Date("2026-07-09T12:00:00")
const DAY = 86400000
function d(offsetDays: number, h = 18, m = 0): string {
  const x = new Date(NOW.getTime() + offsetDays * DAY)
  x.setHours(h, m, 0, 0)
  return x.toISOString()
}

// Per-game hue (gameId → hsl) in the sorteos `hsl(H 62% 58%)` formula. [deferred]
const GAME_HUE: Record<number, number> = { 1: 18, 2: 130, 3: 28, 4: 265 }
function hueFor(gameId?: number | null): string | null {
  return gameId && GAME_HUE[gameId] != null ? `hsl(${GAME_HUE[gameId]} 62% 58%)` : null
}

// deterministic pseudo-random (per-giveaway, stable) — mirrors the data source.
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
const NAME_POOL = [
  "AxelCraft", "NovaPixel", "RotomChef", "EnderQueen", "TeraBlast", "PixelMiner",
  "RathalosX", "FalseSwipe", "CreeperPunk", "CardSharp", "SmashLord", "InkSplash",
  "DittoMain", "BlockBuster", "GreatSword", "PackRipper", "NetBaller", "ProteanFox",
  "RedstoneWiz", "ComboKid", "MasterRank", "QuickClaw", "Zenor", "KiaraV",
  "LunaByte", "OmegaFrost", "VoltTackle", "SableEye", "GigaDrain", "MetaKnightt",
  "ShinyHunt", "TurfWarrior", "BoosterBox", "DiamondPick", "NoirWisp", "HexaPod",
]
function seedParticipants(seed: number, count: number, maxT: number): SrtParticipant[] {
  const r = rng(seed)
  const used = new Set<string>()
  const out: SrtParticipant[] = []
  let i = 0
  while (out.length < count && i < NAME_POOL.length * 3) {
    const name = NAME_POOL[Math.floor(r() * NAME_POOL.length)]
    i++
    if (used.has(name)) continue
    used.add(name)
    const roll = r()
    const t = roll > 0.86 ? Math.max(2, Math.round(r() * maxT)) : roll > 0.6 ? 2 : 1
    out.push({ name, avatar: name.slice(0, 1).toUpperCase(), tickets: t })
  }
  return out
}

type RawSorteo = Omit<Sorteo, "participants" | "winner" | "hue"> & { winnerName?: string; poolMaxT?: number }

const SRT_RAW: RawSorteo[] = [
  {
    id: 1, slug: "steam-deck-verano", featured: true,
    title: "Steam Deck OLED · Edición Verano",
    description: "El gran sorteo de la temporada. Una Steam Deck OLED de 1TB para un miembro de la comunidad, más tres claves premium de consolación para los finalistas. Sorteo ponderado y verificable.",
    gameId: null, source: "comunidad",
    organizer: { name: "Boffmedia", handle: "@boffmedia", kind: "boffmedia", avatar: "B" },
    prize: { name: "Steam Deck OLED 1TB", type: "merch", value: 679, winners: 1, items: [{ name: "Steam Deck OLED 1TB", qty: 1 }, { name: "Clave AAA a elegir", qty: 3 }] },
    startDate: d(-6), endDate: d(4, 21), region: "Europa", minLevel: 3, entrants: 1284, cap: 3000,
    requirements: [
      { icon: "user", label: "Cuenta verificada de Boffmedia", met: true },
      { icon: "shield", label: "Nivel 3 o superior", met: true },
      { icon: "globe", label: "Residencia en Europa (envío)", met: true },
      { icon: "link", label: "Discord vinculado", met: false },
    ],
    steps: [
      { label: "Inicia sesión y verifica tu correo", done: true },
      { label: "Vincula tu cuenta de Discord", done: false },
      { label: "Confirma tu participación", done: false },
    ],
    rules: [
      "El ganador se elige mediante sorteo ponderado por tickets sobre una semilla pública.",
      "Cada participante puede reunir hasta 10 tickets; más tickets, más probabilidad, nunca la certeza.",
      "El sorteo se ejecuta en directo al cierre y queda grabado para su verificación.",
      "El premio es personal e intransferible; el envío corre a cargo de Boffmedia dentro de Europa.",
    ],
    seed: 1071, poolMaxT: 8,
  },
  {
    id: 2, slug: "vgc-regional-pase", title: "Pase VGC Regional · Series H",
    description: "Dos entradas dobles para el próximo Regional bajo Regulación H, con acceso a la zona de jugadores y kit de bienvenida. Para la comunidad competitiva de VGC.",
    gameId: 1, source: "comunidad",
    organizer: { name: "Boffmedia", handle: "@boffmedia", kind: "boffmedia", avatar: "B" },
    prize: { name: "2× Pase Regional (doble)", type: "pass", value: 120, winners: 2, items: [{ name: "Pase Regional doble", qty: 2 }] },
    startDate: d(-2), endDate: d(6, 20), region: "Global", minLevel: 2, entrants: 214, cap: 500,
    requirements: [
      { icon: "user", label: "Cuenta verificada", met: true },
      { icon: "sword", label: "Haber jugado un torneo VGC", met: true },
      { icon: "shield", label: "Nivel 2 o superior", met: true },
    ],
    steps: [
      { label: "Inicia sesión", done: true },
      { label: "Enlaza tu perfil de jugador VGC", done: true },
      { label: "Confirma tu participación", done: false },
    ],
    rules: [
      "Sorteo ponderado por tickets al cierre de la inscripción.",
      "Se eligen 2 ganadores; un mismo usuario no puede ganar dos pases.",
      "Las entradas son nominativas y deben canjearse antes del evento.",
    ],
    seed: 2231, poolMaxT: 5,
  },
  {
    id: 3, slug: "cofre-minecraft-temporada", title: "Cofre de Temporada · Minecraft",
    description: "Lote de recompensas in-game para la Temporada de Verano: rango VIP de 3 meses, set cosmético exclusivo y 25.000 monedas del servidor. Cinco ganadores.",
    gameId: 2, source: "comunidad",
    organizer: { name: "Servidor Boff MC", handle: "@boffmc", kind: "comunidad", avatar: "M" },
    prize: { name: "Cofre VIP + cosméticos", type: "item", value: 45, winners: 5, items: [{ name: "Rango VIP (3 meses)", qty: 5 }, { name: "Set cosmético", qty: 5 }, { name: "25.000 monedas", qty: 5 }] },
    startDate: d(-1, 12), endDate: d(9, 22), region: "Global", minLevel: null, entrants: 398, cap: null,
    requirements: [
      { icon: "user", label: "Cuenta verificada", met: true },
      { icon: "axe", label: "Haber entrado al servidor esta temporada", met: false },
    ],
    steps: [
      { label: "Inicia sesión", done: true },
      { label: "Conéctate al servidor de temporada", done: false },
      { label: "Confirma tu participación", done: false },
    ],
    rules: [
      "Sorteo ponderado por tickets; 5 ganadores sin repetición.",
      "Las recompensas se entregan directamente en la cuenta del servidor.",
    ],
    seed: 3312, poolMaxT: 6,
  },
  {
    id: 4, slug: "twitch-drop-keys", title: "Drop de Claves · Directo de Aniversario",
    description: "Sorteo relámpago entre los viewers presentes en el directo de aniversario. Lista importada del chat en vivo. Diez claves de Steam para diez afortunados.",
    gameId: null, source: "twitch",
    organizer: { name: "Kiara", handle: "@kiaraplays", kind: "streamer", avatar: "K" },
    prize: { name: "10× Clave de Steam", type: "key", value: 200, winners: 10, items: [{ name: "Clave AAA", qty: 4 }, { name: "Clave indie", qty: 6 }] },
    startDate: d(-1, 20), endDate: d(0, 6), region: "Global", minLevel: null, entrants: 742, cap: null,
    requirements: [
      { icon: "message", label: "Estar presente en el chat del directo", met: true },
      { icon: "user", label: "Seguir el canal", met: true },
    ],
    steps: [
      { label: "Ver el directo", done: true },
      { label: "Escribir !sorteo en el chat", done: true },
    ],
    rules: [
      "Participantes importados automáticamente del chat de Twitch al lanzar el comando.",
      "Los suscriptores reciben tickets extra; el sorteo es ponderado y se ejecuta en directo.",
      "Sorteo abierto: la herramienta funciona con cualquier lista, no solo la comunidad de Boffmedia.",
    ],
    seed: 4423, poolMaxT: 3,
  },
  {
    id: 5, slug: "nitro-comunidad", title: "3 Meses de Nitro · Reto Comunitario",
    description: "Alcanzamos los 5.000 miembros y lo celebramos: tres suscripciones Nitro de tres meses para quienes más aportan a la comunidad este mes.",
    gameId: null, source: "comunidad",
    organizer: { name: "Boffmedia", handle: "@boffmedia", kind: "boffmedia", avatar: "B" },
    prize: { name: "3× Nitro (3 meses)", type: "nitro", value: 90, winners: 3, items: [{ name: "Discord Nitro 3 meses", qty: 3 }] },
    startDate: d(2, 12), endDate: d(16, 21), region: "Global", minLevel: 1, entrants: 0, cap: 2000,
    requirements: [
      { icon: "user", label: "Cuenta verificada", met: true },
      { icon: "link", label: "Discord vinculado", met: false },
    ],
    steps: [
      { label: "Inicia sesión", done: true },
      { label: "Vincula tu Discord", done: false },
      { label: "Confirma cuando abra el sorteo", done: false },
    ],
    rules: [
      "El sorteo abre en la fecha indicada; hasta entonces sólo puedes prepararte.",
      "Sorteo ponderado por tickets entre los inscritos elegibles.",
    ],
    seed: 5534, poolMaxT: 5,
  },
  {
    id: 6, slug: "figura-rathalos", title: "Figura Rathalos · Edición Cazador",
    description: "Figura coleccionable de Rathalos (28 cm, edición numerada) firmada por el equipo. Para la comunidad de Monster Hunter Wilds.",
    gameId: 3, source: "comunidad",
    organizer: { name: "Boffmedia", handle: "@boffmedia", kind: "boffmedia", avatar: "B" },
    prize: { name: "Figura Rathalos numerada", type: "merch", value: 149, winners: 1, items: [{ name: "Figura Rathalos 28cm", qty: 1 }] },
    startDate: d(-18), endDate: d(-2, 21), region: "Europa", minLevel: 2, entrants: 486, cap: 800,
    requirements: [
      { icon: "user", label: "Cuenta verificada", met: true },
      { icon: "flame", label: "Rango de caza registrado", met: true },
      { icon: "globe", label: "Envío a Europa", met: true },
    ],
    steps: [
      { label: "Inicia sesión", done: true },
      { label: "Registra tu rango de caza", done: true },
      { label: "Confirma tu participación", done: true },
    ],
    rules: [
      "Sorteo ponderado por tickets ejecutado al cierre.",
      "El ganador dispone de 7 días para confirmar la dirección de envío.",
    ],
    winnerName: "RathalosX", seed: 6645, poolMaxT: 7,
  },
  {
    id: 7, slug: "tcg-sobres-liga", title: "Lote de Sobres · Liga TCG Pocket",
    description: "Cincuenta sobres del set actual repartidos entre diez ganadores de la Liga TCG Pocket Temporada 2. Sorteo ya celebrado.",
    gameId: 4, source: "comunidad",
    organizer: { name: "Boffmedia", handle: "@boffmedia", kind: "boffmedia", avatar: "B" },
    prize: { name: "50× Sobres del set", type: "item", value: 60, winners: 10, items: [{ name: "Sobre premium", qty: 50 }] },
    startDate: d(-30), endDate: d(-5, 21), region: "Global", minLevel: null, entrants: 271, cap: null,
    requirements: [
      { icon: "user", label: "Cuenta verificada", met: true },
      { icon: "cards", label: "Inscrito en la Liga T2", met: true },
    ],
    steps: [
      { label: "Inicia sesión", done: true },
      { label: "Únete a la Liga", done: true },
      { label: "Confirma tu participación", done: true },
    ],
    rules: ["Sorteo ponderado por tickets; 10 ganadores sin repetición."],
    winnerName: "CardSharp", seed: 7756, poolMaxT: 5,
  },
  {
    id: 8, slug: "manual-torneo-lan", title: "Sorteo LAN · Lista de asistentes",
    description: "Sorteo presencial del último torneo LAN. Lista de asistentes cargada manualmente. Un teclado mecánico personalizado para uno de los presentes. Sorteo ya celebrado.",
    gameId: null, source: "manual",
    organizer: { name: "Boff Events", handle: "@boffevents", kind: "comunidad", avatar: "E" },
    prize: { name: "Teclado mecánico custom", type: "merch", value: 180, winners: 1, items: [{ name: "Teclado 75% custom", qty: 1 }] },
    startDate: d(-12), endDate: d(-9, 21), region: "Presencial", minLevel: null, entrants: 128, cap: 128,
    requirements: [{ icon: "list", label: "Figurar en la lista de asistentes", met: true }],
    steps: [{ label: "Registrarte en la entrada del evento", done: true }],
    rules: [
      "Lista de 128 asistentes cargada por los organizadores (CSV).",
      "Sorteo uniforme (un ticket por persona) ejecutado en el escenario.",
    ],
    winnerName: "OmegaFrost", seed: 8867, poolMaxT: 1,
  },
]

export const SORTEOS_DB: Sorteo[] = SRT_RAW.map((g) => {
  const poolCount = Math.min(g.entrants || 24, 24) || 12
  let participants = seedParticipants(g.seed || 1, Math.max(6, poolCount >= 12 ? 12 : poolCount), g.poolMaxT || 4)
  let winner: SrtParticipant | null = null
  if (g.winnerName) {
    const found = participants.find((p) => p.name === g.winnerName)
    if (found) {
      winner = { ...found }
    } else {
      winner = { name: g.winnerName, avatar: g.winnerName.slice(0, 1).toUpperCase(), tickets: Math.max(2, Math.round((g.poolMaxT || 4) * 0.7)) }
      participants = [winner, ...participants].slice(0, 12)
    }
  }
  const { winnerName: _wn, poolMaxT: _pm, ...rest } = g
  return { ...rest, hue: hueFor(g.gameId), participants, winner }
})
