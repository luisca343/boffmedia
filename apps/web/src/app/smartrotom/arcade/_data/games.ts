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
  titleKey: string
  taglineKey: string
  categoryKey: string
  href: string
  accent: GameAccent
  art: PixelArtSprite
  badge?: { labelKey: string; tone: ArTone }
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
    titleKey: "games.squirdle.title",
    taglineKey: "games.squirdle.tagline",
    categoryKey: "categories.palabras",
    href: "/smartrotom/arcade/squirdle",
    accent: "cyan",
    art: SQUIRDLE_SPRITE,
    badge: { labelKey: "games.squirdle.badge", tone: "cyan" },
  },
  {
    id: "voltorb",
    titleKey: "games.voltorb.title",
    taglineKey: "games.voltorb.tagline",
    categoryKey: "categories.riesgo",
    href: "/smartrotom/arcade/voltorb",
    accent: "magenta",
    art: VOLTORB_SPRITE,
    badge: { labelKey: "games.voltorb.badge", tone: "magenta" },
  },
  {
    id: "mina",
    titleKey: "games.mina.title",
    taglineKey: "games.mina.tagline",
    categoryKey: "categories.aventura",
    href: "/smartrotom/mina",
    accent: "amber",
    art: MINA_SPRITE,
  },
  {
    id: "maze",
    titleKey: "games.maze.title",
    taglineKey: "games.maze.tagline",
    categoryKey: "categories.accion",
    href: "/smartrotom/arcade/maze",
    accent: "violet",
    art: MAZE_SPRITE,
  },
  {
    id: "typedoku",
    titleKey: "games.typedoku.title",
    taglineKey: "games.typedoku.tagline",
    categoryKey: "categories.logica",
    href: "/smartrotom/arcade/typedoku",
    accent: "cyan",
    art: TYPEDOKU_SPRITE,
  },
  {
    id: "puzle",
    titleKey: "games.puzle.title",
    taglineKey: "games.puzle.tagline",
    categoryKey: "categories.logica",
    href: "/smartrotom/arcade/puzle",
    accent: "lime",
    art: PUZLE_SPRITE,
  },
]

export const GAME_CATEGORY_KEYS = [
  "categories.todos",
  "categories.palabras",
  "categories.riesgo",
  "categories.aventura",
  "categories.accion",
  "categories.logica",
]
