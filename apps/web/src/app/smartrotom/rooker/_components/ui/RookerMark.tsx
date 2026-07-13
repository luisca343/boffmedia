/**
 * The Rooker bird — the wordmark's only glyph.
 *
 * Twitter's nav renders its bird as one accent-tinted silhouette with no disc behind
 * it, and Rooker follows: `withDisc` exists for the two places that need a solid badge
 * (the toast, a favicon-sized chip), and is off everywhere else.
 *
 * `currentColor` all the way through, so the mark inherits whatever it is placed on —
 * the accent in the nav, the accent's ink on the toast.
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
      <path
        fill="currentColor"
        d="M40.5 17.2c.6-1.5 1-3 1-3s.4 1.7.6 3.3c1.6-1 3.1-1.7 3.1-1.7s-.5 1.8-1.2 3.3c2.6.9 4.6 2.7 5.9 5 1.8 3.2 1.8 7 .2 10.4-2.2 4.7-7.1 7.9-12.9 8.6-4.9.6-9.6-.6-13.9-2.4-2.6-1.1-5-2.5-7.4-3.9-1.2-.7-2.6-1.4-4-1.6 1.1-.4 2.4-.4 3.6-.2-1-1-2.2-1.8-3.5-2.2 1.5-.5 3.2-.4 4.7.1-.5-1.6-.4-3.4.2-5 .9-2.3 2.7-4.2 4.9-5.4 3.3-1.9 7.3-2.3 11-1.6 1.6.3 3.2.9 4.6 1.7.2-1.5.5-3 .6-3.2zM37 27.2a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4z"
      />
    </svg>
  )
}
