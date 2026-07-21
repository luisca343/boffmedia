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
    titleKey: "arcade.games.squirdle.title",
    taglineKey: "arcade.games.squirdle.tagline",
    categoryKey: "arcade.categories.palabras",
    href: "/smartrotom/arcade/squirdle",
    accent: "cyan",
    art: SQUIRDLE_SPRITE,
    badge: { labelKey: "arcade.games.squirdle.badge", tone: "cyan" },
  },
  {
    id: "voltorb",
    titleKey: "arcade.games.voltorb.title",
    taglineKey: "arcade.games.voltorb.tagline",
    categoryKey: "arcade.categories.riesgo",
    href: "/smartrotom/arcade/voltorb",
    accent: "magenta",
    art: VOLTORB_SPRITE,
    badge: { labelKey: "arcade.games.voltorb.badge", tone: "magenta" },
  },
  {
    id: "mina",
    titleKey: "arcade.games.mina.title",
    taglineKey: "arcade.games.mina.tagline",
    categoryKey: "arcade.categories.aventura",
    href: "/smartrotom/mina",
    accent: "amber",
    art: MINA_SPRITE,
  },
  {
    id: "maze",
    titleKey: "arcade.games.maze.title",
    taglineKey: "arcade.games.maze.tagline",
    categoryKey: "arcade.categories.accion",
    href: "/smartrotom/arcade/maze",
    accent: "violet",
    art: MAZE_SPRITE,
  },
  {
    id: "typedoku",
    titleKey: "arcade.games.typedoku.title",
    taglineKey: "arcade.games.typedoku.tagline",
    categoryKey: "arcade.categories.logica",
    href: "/smartrotom/arcade/typedoku",
    accent: "cyan",
    art: TYPEDOKU_SPRITE,
  },
  {
    id: "puzle",
    titleKey: "arcade.games.puzle.title",
    taglineKey: "arcade.games.puzle.tagline",
    categoryKey: "arcade.categories.logica",
    href: "/smartrotom/arcade/puzle",
    accent: "lime",
    art: PUZLE_SPRITE,
  },
]

export const GAME_CATEGORY_KEYS = [
  "arcade.categories.todos",
  "arcade.categories.palabras",
  "arcade.categories.riesgo",
  "arcade.categories.aventura",
  "arcade.categories.accion",
  "arcade.categories.logica",
]
