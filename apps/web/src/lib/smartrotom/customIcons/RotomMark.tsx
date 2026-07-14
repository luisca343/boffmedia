export interface RotomMarkProps {
  size?: number
  filled?: boolean
  className?: string
}

// The SmartRotom — Rotom possessing the phone: rounded-slab body with the
// plasma tab poking out the top right, the plug tail bottom left, camera dot,
// big oval eyes and the grin. Floats at a slight tilt like the real thing.
// Same contract as RookerMark: `filled` (default) is the solid brand mark with
// the face knocked out; the outline variant matches its ink weight. The app
// icon maps keep the small lucide-style `Rotom`; this is the big-canvas glyph.
// `currentColor` all the way through.
export function RotomMark({
  size = 28,
  filled = true,
  className = "",
}: RotomMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <g transform="rotate(-8 32 32)">
        {filled ? (
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M21 10H34L38 3L42 10H43A5 5 0 0 1 48 15V49A5 5 0 0 1 43 54H31L27.5 60.5L24 54H21A5 5 0 0 1 16 49V15A5 5 0 0 1 21 10ZM20.9 16.5A1.7 1.7 0 1 0 24.3 16.5A1.7 1.7 0 1 0 20.9 16.5ZM21.2 31A4.3 5.8 0 1 0 29.8 31A4.3 5.8 0 1 0 21.2 31ZM34.2 31A4.3 5.8 0 1 0 42.8 31A4.3 5.8 0 1 0 34.2 31ZM22.5 43Q32 46 41.5 43Q32 52 22.5 43Z"
          />
        ) : (
          <>
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth={3.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10H34L38 3L42 10H43A5 5 0 0 1 48 15V49A5 5 0 0 1 43 54H31L27.5 60.5L24 54H21A5 5 0 0 1 16 49V15A5 5 0 0 1 21 10Z" />
              <ellipse cx="25.5" cy="31" rx="4.3" ry="5.8" />
              <ellipse cx="38.5" cy="31" rx="4.3" ry="5.8" />
              <path d="M24 43.5Q32 49 40 43.5" />
            </g>
            <circle cx="22.6" cy="16.5" r="1.8" fill="currentColor" />
          </>
        )}
      </g>
    </svg>
  )
}
