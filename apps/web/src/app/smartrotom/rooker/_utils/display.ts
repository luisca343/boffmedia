/**
 * The reader's display preferences — Rooker's "Pantalla" panel, modelled on the
 * one Twitter ships.
 *
 * The load-bearing rule here is SMARTROTOM_V3 §2b: **an app never owns light/dark.**
 * That comes from the single platform picker via `useRotomMode()`. What Rooker owns
 * is everything the platform has no opinion about — which of the two darks, the
 * accent, the body face, and how dense the timeline reads.
 */

/** The canvas actually painted. Derived — never stored as a preference. */
export type RookerCanvas = "light" | "dim" | "lightsout"

/**
 * Which dark. Only consulted when the platform resolves to dark; in light mode the
 * canvas is `light` and this is ignored (the panel says so).
 */
export type RookerDarkness = "dim" | "lightsout"

export type RookerFont = "sistema" | "chirp"
export type RookerDensity = "comodo" | "compacto"
export type RookerCardStyle = "plano" | "tarjeta"
/** `simple` collapses the five reactions down to a plain like, as Twitter has it. */
export type RookerReactions = "expresivas" | "simple"

export interface RookerDisplay {
  darkness: RookerDarkness
  accent: RookerAccent
  font: RookerFont
  density: RookerDensity
  cardStyle: RookerCardStyle
  reactions: RookerReactions
}

export const DISPLAY_DEFAULTS: RookerDisplay = {
  darkness: "dim",
  accent: "azul",
  font: "sistema",
  density: "comodo",
  cardStyle: "plano",
  reactions: "expresivas",
}

/**
 * The six accents, as RGB triplets so Tailwind's `<alpha-value>` channel works on
 * every surface derived from them (`bg-rk-accent/12`, `border-rk-accent/32`…).
 *
 * `fg` is the ink that sits ON the accent. It is stored, not computed at paint time:
 * yellow and green need near-black text to stay legible, and getting that wrong is a
 * contrast failure rather than a cosmetic one.
 */
export type RookerAccent = "azul" | "amarillo" | "rosa" | "morado" | "naranja" | "verde"

export const ACCENTS: Record<RookerAccent, { rgb: string; fg: string }> = {
  azul:     { rgb: "29 155 240",  fg: "255 255 255" },
  amarillo: { rgb: "255 212 0",   fg: "15 20 25" },
  rosa:     { rgb: "249 24 128",  fg: "255 255 255" },
  morado:   { rgb: "120 86 255",  fg: "255 255 255" },
  naranja:  { rgb: "255 122 0",   fg: "255 255 255" },
  verde:    { rgb: "0 186 124",   fg: "15 20 25" },
}

/** The platform decides light vs dark; the reader only decides *which* dark. */
export function resolveCanvas(mode: "light" | "dark", darkness: RookerDarkness): RookerCanvas {
  return mode === "light" ? "light" : darkness
}

/**
 * The CSS custom properties the scope root carries. Returned as a style object rather
 * than as class names because the accent is a runtime value — a `bg-rk-${accent}` class
 * would never compile (§4, audit gap G2).
 */
export function displayVars(display: RookerDisplay): React.CSSProperties {
  const accent = ACCENTS[display.accent] ?? ACCENTS.azul
  return {
    "--rk-accent": accent.rgb,
    "--rk-accent-fg": accent.fg,
    ...(display.font === "chirp" ? { "--rk-font": "'Hanken Grotesk'" } : null),
  } as React.CSSProperties
}
