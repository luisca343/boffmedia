import type { UserAchievement } from "@boffmedia/shared"
import type { ExtendedPokemonW } from "@/types/dto/pc-pokemon.dto"

/** The real badge artwork, served by the API next to the game's own icons. */
export function badgeArt(icon: string | null | undefined): string | undefined {
  return icon ? `https://api.boffmedia.es/smartrotom/img/logros/${icon}.webp` : undefined
}

/** Categories arrive accented and mixed-case; compare on a folded form, never on the raw string. */
export function fold(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

export function isGym(achievement: UserAchievement): boolean {
  return fold(achievement.category) === "gimnasios"
}

export function isCompetition(achievement: UserAchievement): boolean {
  const category = fold(achievement.category)
  return category === "ligas" || category === "frente batalla"
}

/** `completed` is 0/1 from the API, never a boolean. */
export function isEarned(achievement: UserAchievement): boolean {
  return !!achievement.completed
}

/**
 * The wax a seal is struck in.
 *
 * An achievement has NO type, element or colour column — the handoff coloured each gym seal
 * by its leader's Pokémon type, and that field does not exist. Rather than invent one, the
 * ink is a deterministic function of the badge's own id: the same badge is always the same
 * colour, on every device, and two badges are almost never the same. It is presentation, not
 * data — nothing is being claimed about the gym.
 */
const WAX: string[] = [
  "156 59 54", // oxblood
  "47 111 126", // teal
  "110 74 134", // plum
  "106 120 56", // olive
  "43 74 114", // info
  "184 160 56", // brass
  "176 96 40", // rust
  "112 88 72", // umber
]

export function sealInk(id: string): string {
  let hash = 2166136261
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return WAX[(hash >>> 0) % WAX.length]
}

export interface Circuit {
  /** The real `subcategory` column — there is no `circuit` field anywhere in the API. */
  name: string
  badges: UserAchievement[]
  done: number
  pct: number
}

/** The gym badges, grouped by circuit, in the order the API lists them. */
export function circuitsOf(achievements: UserAchievement[] = []): Circuit[] {
  const groups = new Map<string, UserAchievement[]>()

  for (const achievement of achievements) {
    if (!isGym(achievement)) continue
    const name = (achievement.subcategory ?? "").trim() || "Sin circuito"
    const list = groups.get(name)
    if (list) list.push(achievement)
    else groups.set(name, [achievement])
  }

  return [...groups.entries()].map(([name, badges]) => {
    const done = badges.filter(isEarned).length
    return {
      name,
      badges,
      done,
      pct: badges.length > 0 ? Math.round((done / badges.length) * 100) : 0,
    }
  })
}

/**
 * The team the badge was won with. `achievement.team` is the replay's `team1`, stored as a
 * JSON string — and it is null on old rows and malformed on a few, so the parse is guarded:
 * a broken blob means "no team was recorded", never a blank page.
 */
export function parseTeam(team: string | null | undefined): ExtendedPokemonW[] {
  if (!team) return []
  try {
    const parsed: unknown = JSON.parse(team)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((mon): mon is ExtendedPokemonW => !!mon && typeof mon === "object")
  } catch {
    return []
  }
}

/** A move slot comes back as a plain string, and an empty slot as null. */
export function moveName(move: unknown): string | null {
  if (typeof move === "string") return move.trim() || null
  if (move && typeof move === "object" && "name" in move) {
    const name = (move as { name?: unknown }).name
    return typeof name === "string" ? name : null
  }
  return null
}
