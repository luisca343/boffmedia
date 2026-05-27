import React from "react"
import { DoodleKind } from "./Doodle"

/** Absolute or percentage position within the scatter container */
export interface ScatterPosition {
  top?: number | string
  bottom?: number | string
  left?: number | string
  right?: number | string
  zIndex?: number
}

// ─── Discriminated union of all scatter item variants ─────────────────────────

export interface PostItScatterItem {
  type: "post-it"
  id: string
  position: ScatterPosition
  color?: string
  tilt?: number
  size?: number
  footer?: string
  content: React.ReactNode
}

export interface WantedPosterScatterItem {
  type: "wanted-poster"
  id: string
  position: ScatterPosition
  name: string
  label?: string
  emblem?: string
  emblemColor?: string
  reward?: string
  tilt?: number
  width?: number
}

export interface DoodleScatterItem {
  type: "doodle"
  id: string
  position: ScatterPosition
  kind?: DoodleKind
  tilt?: number
  size?: number
}

export interface NewspaperScatterItem {
  type: "newspaper"
  id: string
  position: ScatterPosition
  headline: string
  body: string
  source?: string
  tilt?: number
  width?: number
}

export interface InkBlotScatterItem {
  type: "ink-blot"
  id: string
  position: ScatterPosition
  size?: number
  tilt?: number
  color?: string
}

export interface PolaroidScatterItem {
  type: "polaroid"
  id: string
  position: ScatterPosition
  caption?: string
  tilt?: number
  size?: number
  image?: React.ReactNode
}

export type ScatterItem =
  | PostItScatterItem
  | WantedPosterScatterItem
  | DoodleScatterItem
  | NewspaperScatterItem
  | InkBlotScatterItem
  | PolaroidScatterItem
