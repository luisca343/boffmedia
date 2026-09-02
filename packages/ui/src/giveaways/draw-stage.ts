// Shared contract for all draw stages (reel, wheel, spotlight)

export type SrtDrawMode = "reel" | "wheel" | "spotlight"
export const SRT_DRAW_MODES = ["reel", "wheel", "spotlight"] as const

export interface SrtDrawParticipant {
  name: string
  weight: number
}

export interface SrtDrawHandle {
  skip: () => void
}

export interface SrtDrawStageProps {
  participants: SrtDrawParticipant[]
  winners: string[]
  weighted: boolean
  muted: boolean
  onMutedChange: (muted: boolean) => void
  onComplete: () => void
  size?: "default" | "large"
  /**
   * `panel` (default) wraps the body in the `SrtDrawFrame` broadcast chassis — for
   * standalone use (styleguide). `inset` renders the body bare, for hosts that
   * already provide the broadcast surface (the sorteos page stage).
   */
  frame?: "panel" | "inset"
  className?: string
}

export type SrtDrawPhase = "idle" | "spinning" | "landed" | "done"

/**
 * Merge participants by normalized name (trim + lowercase).
 * Display name = first occurrence; weight = sum when weighted, else count.
 */
export function mergeParticipants(
  participants: SrtDrawParticipant[],
  weighted: boolean
): SrtDrawParticipant[] {
  const map = new Map<string, { name: string; weight: number }>()

  for (const p of participants) {
    const key = p.name.trim().toLowerCase()
    if (map.has(key)) {
      const existing = map.get(key)!
      existing.weight += weighted ? p.weight : 1
    } else {
      map.set(key, { name: p.name, weight: weighted ? p.weight : 1 })
    }
  }

  return Array.from(map.values())
}

/** Normalised identity used everywhere a draw name is compared. */
export function normalizeDrawName(name: string): string {
  return name.trim().toLowerCase()
}

/** Past this many segments the wheel hides its labels (they stop being legible). */
export const WHEEL_LABEL_LIMIT = 40

export interface SrtWheelSegment {
  name: string
  weight: number
  angle: number
  startAngle: number
}

/**
 * Wheel geometry. Segments run CLOCKWISE FROM 12 O'CLOCK; `SrtWheelSvg` converts
 * to SVG angles with `deg - 90`, and `useSrtWheel` targets `360 - midAngle`.
 * Stage and preview both build through here so a preview is the real layout.
 */
export function buildWheelSegments(
  participants: SrtDrawParticipant[],
  weighted: boolean,
): SrtWheelSegment[] {
  if (participants.length === 0) return []
  const totalWeight = participants.reduce((sum, p) => sum + (weighted ? p.weight : 1), 0) || 1
  let cursor = 0
  return participants.map((p) => {
    const weight = weighted ? p.weight : 1
    const angle = (weight / totalWeight) * 360
    const seg = { name: p.name, weight, angle, startAngle: cursor }
    cursor += angle
    return seg
  })
}

/** The pool for run `step`: merged participants minus the winners already drawn. */
export function poolForStep(
  merged: SrtDrawParticipant[],
  winners: string[],
  step: number,
): SrtDrawParticipant[] {
  const landed = new Set(winners.slice(0, step).map(normalizeDrawName))
  return merged.filter((p) => !landed.has(normalizeDrawName(p.name)))
}
