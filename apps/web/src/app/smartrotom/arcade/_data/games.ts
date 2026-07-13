import type { PixelArtSprite } from "../_components/ui"
import type { ArTone } from "../_components/ui"
import {
  MAZE_SPRITE,
  MINA_SPRITE,
  PUZLE_SPRITE,
  SQUIRDLE_SPRITE,
  TYPEDOKU_SPRITE,
  VOLTORB_SPRITE,
} from "./sprites"

export type GameAccent = Extract<ArTone, "cyan" | "magenta" | "violet" | "amber" | "lime">

export interface ArcadeGame {
  id: string
  title: string
  /** Absolute route. `mina` lives outside the arcade tree — it is its own app. */
  href: string
  tagline: string
  category: string
  accent: GameAccent
  art: PixelArtSprite
  badge?: { label: string; tone: ArTone }
}

/**
 * The cabinet library. Editorial content the arcade owns (title, blurb, category,
 * cabinet art), not user data — there is no games endpoint, and the play counts
 * the handoff shows on each cabinet ("8.4k ▶") have no source, so they are not
 * rendered. See docs/smartrotom/deferred/arcade.md.
 */
export const GAMES: ArcadeGame[] = [
  {
    id: "squirdle",
    title: "Squirdle",
    href: "/smartrotom/arcade/squirdle",
    tagline: "Adivina la criatura oculta a partir de sus pistas.",
    category: "Palabras",
    accent: "cyan",
    art: SQUIRDLE_SPRITE,
    badge: { label: "Nuevo", tone: "cyan" },
  },
  {
    id: "voltorb",
    title: "Gira Voltorb",
    href: "/smartrotom/arcade/voltorb",
    tagline: "Voltea números y no toques una bomba.",
    category: "Riesgo",
    accent: "magenta",
    art: VOLTORB_SPRITE,
    badge: { label: "Hot", tone: "magenta" },
  },
  {
    id: "mina",
    title: "Minería",
    href: "/smartrotom/mina",
    tagline: "Excava profundo y encuentra tesoros ocultos.",
    category: "Aventura",
    accent: "amber",
    art: MINA_SPRITE,
  },
  {
    id: "maze",
    title: "Laberinto",
    href: "/smartrotom/arcade/maze",
    tagline: "Recorre las salas generadas y escapa del calabozo.",
    category: "Acción",
    accent: "violet",
    art: MAZE_SPRITE,
  },
  {
    id: "typedoku",
    title: "Typedoku",
    href: "/smartrotom/arcade/typedoku",
    tagline: "Sudoku de tipos: cada fila y columna, sin repetir.",
    category: "Lógica",
    accent: "cyan",
    art: TYPEDOKU_SPRITE,
  },
  {
    id: "puzle",
    title: "Puzle",
    href: "/smartrotom/arcade/puzle",
    tagline: "Encaja las piezas en los menos movimientos posibles.",
    category: "Lógica",
    accent: "lime",
    art: PUZLE_SPRITE,
  },
]

export const GAME_CATEGORIES = ["Todos", ...new Set(GAMES.map((g) => g.category))]
