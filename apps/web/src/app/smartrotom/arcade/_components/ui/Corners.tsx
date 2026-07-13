import { cn } from "@/lib/utils"

export type ArCornerTone = "cyan" | "magenta" | "violet" | "amber" | "lime"

export interface ArCornersProps {
  tone?: ArCornerTone
  /** Bracket arm length in px. */
  size?: number
  /** Distance from the panel edge in px. */
  inset?: number
  thick?: number
}

const TONE: Record<ArCornerTone, string> = {
  cyan: "border-ar-cyan/55",
  magenta: "border-ar-magenta/50",
  violet: "border-ar-violet/60",
  amber: "border-ar-amber/55",
  lime: "border-ar-lime/50",
}

/**
 * Crosshair brackets on the four corners of a panel — the arcade's "targeting
 * reticle" motif. Purely decorative, so it never lands in the a11y tree.
 */
export function Corners({ tone = "cyan", size = 14, inset = 8, thick = 1.5 }: ArCornersProps) {
  const arm = { width: size, height: size }
  const t = `${thick}px`
  return (
    <span aria-hidden className={cn("pointer-events-none", TONE[tone])}>
      <span
        className="absolute border-solid border-inherit"
        style={{ ...arm, top: inset, left: inset, borderWidth: `${t} 0 0 ${t}` }}
      />
      <span
        className="absolute border-solid border-inherit"
        style={{ ...arm, top: inset, right: inset, borderWidth: `${t} ${t} 0 0` }}
      />
      <span
        className="absolute border-solid border-inherit"
        style={{ ...arm, bottom: inset, left: inset, borderWidth: `0 0 ${t} ${t}` }}
      />
      <span
        className="absolute border-solid border-inherit"
        style={{ ...arm, bottom: inset, right: inset, borderWidth: `0 ${t} ${t} 0` }}
      />
    </span>
  )
}
