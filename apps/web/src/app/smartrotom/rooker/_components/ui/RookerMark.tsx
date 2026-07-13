import { Twitter } from "lucide-react"

/**
 * The Rooker bird — the wordmark's only glyph.
 *
 * Placeholder pass: swapped for lucide's `Twitter` mark per direct instruction
 * (fidelity=poor — it's a generic bird silhouette, not Rooker's own). `withDisc`
 * exists for the two places that need a solid badge (the toast, a favicon-sized
 * chip), and is off everywhere else. `currentColor` all the way through, so the
 * mark inherits whatever it is placed on — the accent in the nav, the accent's
 * ink on the toast.
 */
export interface RookerMarkProps {
  size?: number
  withDisc?: boolean
  className?: string
}

export function RookerMark({ size = 28, withDisc = false, className = "" }: RookerMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      {withDisc && <circle cx="32" cy="32" r="32" className="fill-rk-accent" />}
      <Twitter x={12} y={12} width={40} height={40} fill="currentColor" stroke="none" />
    </svg>
  )
}
