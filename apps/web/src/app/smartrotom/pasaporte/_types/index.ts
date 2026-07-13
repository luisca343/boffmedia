import type { PasaporteLogroEntity, PasaporteStandingEntity } from "@boffmedia/shared"

/**
 * The API's own shapes, re-exported under short local names. They are ALIASES, never
 * copies: a hand-written duplicate of an API entity drifts silently (the old
 * `_types/Achievement.ts` in this folder still types `completed` as a boolean — the API
 * has always sent 0/1), and by the time the drift shows it is a wrong number on screen.
 * If a field is missing, it is missing from the API and belongs in a migration, not here.
 */
export type {
  PasaporteLadderRungEntity as LadderRung,
  PasaporteLogroEntity as Logro,
  PasaporteProfileEntity as Passport,
  PasaporteSeasonEntity as Season,
  PasaporteSeasonInfoEntity as SeasonInfo,
  PasaporteStandingEntity as Standing,
} from "@boffmedia/shared"

/** The four medal metals. The enum's own type, so it can never fall out of step with it. */
export type LogroTier = PasaporteLogroEntity["tier"]

/** The six ladder rungs, likewise taken from the entity rather than restated. */
export type StandingTier = PasaporteStandingEntity["tierKey"]

// ── Everything below is DERIVED. The API owns none of it. ────────────────────

/** The six security inks. A chapter picks one; every primitive inside it inherits the pair. */
export type ChapterAccent = "oxblood" | "teal" | "plum" | "olive" | "info" | "gild"

export type ChapterKey =
  | "indice"
  | "identidad"
  | "carne"
  | "equipo"
  | "medallas"
  | "competiciones"
  | "temporada"
  | "logros"
  | "insignias"
  | "bitacora"
  | "cronica"

export interface Chapter {
  key: ChapterKey
  /** Inked on the page head and on the rail. Spanish — it is what the reader reads. */
  label: string
  /** Feed it to `chapterVars()` on the chapter's root; the pair cascades from there. */
  accent: ChapterAccent
  /**
   * Literal Tailwind classes for the deep ink. The index rail is mounted OUTSIDE every
   * chapter's root, so `--ps-chapter` is not in scope there and it cannot use
   * `text-ps-chapter-deep` — it needs the class spelled out.
   */
  deep: string
  tab: string
}

/** One leaf of the book. The page list is built by the UI; this is the shape it builds. */
export type PageKind = "cover" | "back" | "chapter" | "badge" | "pad"

export interface PageDescriptor {
  key: string
  kind: PageKind
  /** Absent on covers and on the blank verso that keeps spreads paired. */
  chapter?: ChapterKey
  accent: ChapterAccent
  /** A stiff leaf — the covers. It does not take a folio numeral. */
  hard?: boolean
  folio?: string
  /** Badge pages only: the achievement id the leaf is inked with. */
  badgeId?: string
}

export interface Rarity {
  label: string
  /** A literal class string — never interpolated (§4). */
  className: string
}

/**
 * A visa stamp. There is no "places visited" table anywhere in the world — a stamp is a
 * real, dated event that put the trainer somewhere, recovered in `_utils/bitacora.ts`.
 */
export interface TravelStamp {
  id: string
  /** Uppercase: it is inked onto the page, not read out of a field. */
  place: string
  /** "GIMNASIO · ROCA" | "VISADO · ENTRADA" | "LIGA · CAMPEÓN" */
  sub: string
  date: string
  kind: "gimnasio" | "viaje" | "liga" | "evento"
  shape: "circle" | "oval" | "rect"
  /** Degrees. Deterministic in `id` — see the note in `_utils/bitacora.ts`. */
  rot: number
  gold?: boolean
}

/** The glyph a milestone is drawn with. The UI owns the SVG; this only names it. */
export type MilestoneIcon = "pin" | "flag" | "crown" | "trophy" | "medal" | "star" | "swords" | "clock"

export interface Milestone {
  id: string
  date: string
  title: string
  desc: string
  icon: MilestoneIcon
  /** An ink NAME, not a colour — the UI maps it through the literal token map (§4). */
  accent: ChapterAccent
  /** A crown moment: a league title, the Frente de Batalla, a platinum logro. */
  big?: boolean
}

/** A movement row on the Identidad spread: five distances and one count. */
export interface MovementRow {
  key: string
  label: string
  value: number
  unit: "km" | "n"
}
