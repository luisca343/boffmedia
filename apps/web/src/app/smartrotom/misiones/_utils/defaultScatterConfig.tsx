import React from "react"
import { ScatterItem } from "../_ui/board-decor/ScatterConfig"

/**
 * Default scatter decorations for the top overlay of the quest board.
 * Pass custom arrays to BoardScreen's `scatterTopItems` / `scatterBottomItems`
 * props to override or extend these at runtime without touching component logic.
 */
export const DEFAULT_SCATTER_TOP: ScatterItem[] = [
  {
    type: "wanted-poster",
    id: "rocket-wanted",
    position: { top: 18, right: 30 },
    name: "TEAM ROCKET",
    emblemColor: "#aa2a2a",
    reward: "5000₽",
    tilt: 5,
    width: 150,
  },
  {
    type: "doodle",
    id: "arrow-top",
    position: { top: 90, left: 32 },
    kind: "arrow",
    tilt: -12,
    size: 130,
  },
  {
    type: "ink-blot",
    id: "blot-mid",
    position: { top: 270, left: 8 },
    size: 50,
    tilt: 30,
  },
  {
    type: "post-it",
    id: "oak-note",
    position: { top: 360, right: 20 },
    color: "#a4d4ff",
    tilt: 6,
    size: 150,
    footer: "— Oak",
    content: (
      <>
        Si encuentras a <strong>Mew</strong>, ¡tráelo al laboratorio inmediatamente!
      </>
    ),
  },
]

export const DEFAULT_SCATTER_BOTTOM: ScatterItem[] = [
  {
    type: "newspaper",
    id: "rotom-news",
    position: { bottom: 12, left: 30 },
    tilt: 3.5,
    width: 210,
    source: "Daily Pokémon",
    headline: "ROTOM DESAPARECE DE UNA TELEVISIÓN",
    body: "El extraño Pokémon eléctrico fantasma ha vuelto a hacer de las suyas. Los testigos aseguran haberle visto colarse en una bicicleta vieja.",
  },
  {
    type: "doodle",
    id: "check-bottom",
    position: { bottom: 30, right: 70 },
    kind: "check",
    tilt: 8,
    size: 90,
  },
  {
    type: "doodle",
    id: "star-center",
    position: { bottom: 18, left: "44%" },
    kind: "star",
    tilt: -20,
    size: 80,
  },
]
