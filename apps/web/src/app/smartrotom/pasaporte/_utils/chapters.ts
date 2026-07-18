import type { CSSProperties } from "react"
import type { Chapter, ChapterAccent, ChapterKey } from "../_types"

/**
 * The security inks, as the raw `r g b` triplets Tailwind's `rgb(var(--…) / <alpha>)`
 * tokens expect. These are transcribed from the `.ps-app` block in
 * `apps/web/tailwind.config.ts` and must stay identical to it — if an ink is retuned
 * there, retune it here.
 *
 * `gild` is the odd one: the palette gives it `--ps-gild-lo` rather than a `-deep`, so its
 * deep half is the leaf's shadow.
 */
const INK: Record<ChapterAccent, { accent: string; deep: string }> = {
  oxblood: { accent: "156 59 54", deep: "110 39 35" },
  teal: { accent: "47 111 126", deep: "36 75 86" },
  plum: { accent: "110 74 134", deep: "75 51 91" },
  olive: { accent: "106 120 56", deep: "68 75 39" },
  info: { accent: "43 74 114", deep: "36 63 99" },
  gild: { accent: "200 162 75", deep: "138 106 35" },
}

/**
 * The runtime chapter accent. Tailwind's `ps-chapter` / `ps-chapter-deep` tokens read
 * these two vars, so a page sets them once and every primitive inside it inherits the
 * chapter's ink without knowing which chapter it is in.
 *
 * The triplets come from a literal map, never from an interpolated var or class name:
 * `bg-ps-${accent}` compiles to nothing at all, silently (§4). This inline style is the
 * sanctioned data-driven case.
 */
export function chapterVars(accent: ChapterAccent): CSSProperties {
  const ink = INK[accent]
  return {
    "--ps-chapter": ink.accent,
    "--ps-chapter-deep": ink.deep,
  } as CSSProperties
}

/** The raw triplet, for the rare consumer that needs a colour rather than a token (SVG fills). */
export function chapterInk(accent: ChapterAccent): { accent: string; deep: string } {
  return INK[accent]
}

/**
 * The book's chapters, in binding order.
 *
 * `deep` and `tab` are spelled-out classes because the index rail lives outside every
 * chapter's root: `--ps-chapter` is not in scope there, so it cannot reach for
 * `text-ps-chapter-deep` and needs the literal.
 */
export const CHAPTERS: Chapter[] = [
  { key: "indice", accent: "gild", deep: "text-ps-gild-lo", tab: "bg-ps-gild-lo" },
  { key: "identidad", accent: "oxblood", deep: "text-ps-oxblood-deep", tab: "bg-ps-oxblood-deep" },
  { key: "carne", accent: "info", deep: "text-ps-info-deep", tab: "bg-ps-info-deep" },
  { key: "equipo", accent: "teal", deep: "text-ps-teal-deep", tab: "bg-ps-teal-deep" },
  { key: "medallas", accent: "olive", deep: "text-ps-olive-deep", tab: "bg-ps-olive-deep" },
  { key: "competiciones", accent: "oxblood", deep: "text-ps-oxblood-deep", tab: "bg-ps-oxblood-deep" },
  { key: "temporada", accent: "gild", deep: "text-ps-gild-lo", tab: "bg-ps-gild-lo" },
  { key: "logros", accent: "plum", deep: "text-ps-plum-deep", tab: "bg-ps-plum-deep" },
  { key: "insignias", accent: "gild", deep: "text-ps-gild-lo", tab: "bg-ps-gild-lo" },
  { key: "bitacora", accent: "teal", deep: "text-ps-teal-deep", tab: "bg-ps-teal-deep" },
  { key: "cronica", accent: "plum", deep: "text-ps-plum-deep", tab: "bg-ps-plum-deep" },
]

const BY_KEY: Record<ChapterKey, Chapter> = CHAPTERS.reduce(
  (map, chapter) => {
    map[chapter.key] = chapter
    return map
  },
  {} as Record<ChapterKey, Chapter>,
)

export function chapter(key: ChapterKey): Chapter {
  return BY_KEY[key]
}
