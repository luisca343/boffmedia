import type * as React from "react"
import type { IconName } from "../primitives/icon"

/**
 * A tool listing's data, already RESOLVED — every string here is display text,
 * never a message key.
 *
 * That is the seam that lets one card serve both hosts: the web translates with
 * next-intl and the launcher with its own store, and neither has to teach this
 * package where its messages live.
 */
export interface ToolCardData {
  /** Stable key for React and for the host's own bookkeeping. */
  key: string
  title: string
  desc: string
  icon: IconName
  /** URL target. Hosts that navigate by state pass `onSelect` to `ToolCard` and
   *  may leave this unset. */
  href?: string
  /** The game hue as a colour expression — see `hueColorOf`. */
  hueColor: string
  /** Category label in the «señal» skin's head row. */
  cat?: string
  isNew?: boolean
  /** Renders muted with a «soon» badge and does not navigate. */
  soon?: boolean
  popularity?: "high" | "medium" | "low"
}

/** Badge/affordance text. Optional per entry: a badge renders only when the
 *  host supplied its label, so an unwired host shows no badge rather than an
 *  untranslated one. */
export interface ToolCardLabels {
  isNew?: string
  soon?: string
  popular?: string
}

/** One game's block in a tools listing. */
export interface ToolGroupData {
  key: string
  name: string
  tagline?: string
  hueColor: string
  /** Letter/wordmark seal shown when no image is supplied. */
  logoLabel?: string
  imageSrc?: string
  tools: ToolCardData[]
}

/**
 * The game hue, as one formula rather than a palette of hand-picked colours.
 *
 * Fixing saturation and lightness is what keeps four games from drifting into
 * four different weights of colour — only the hue varies, so every seal, rail
 * and tint reads as the same material.
 */
export const hueColorOf = (hue: number) => `hsl(${hue} 62% 58%)`

/** Inline style setting the game-hue custom property the tool components read. */
export const hueStyle = (color: string): React.CSSProperties =>
  ({ ["--ghue" as string]: color }) as React.CSSProperties
