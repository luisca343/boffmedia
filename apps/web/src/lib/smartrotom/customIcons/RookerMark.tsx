export interface RookerMarkProps {
  size?: number
  filled?: boolean
  className?: string
}

// The Rooker bird — a Rookidee, the app's wordmark. `filled` (default) is the
// solid brand silhouette; the outline variant matches the ink weight of the rest
// of the rk icon set. `currentColor` all the way through, so the mark is ink on
// whatever it is placed on.
export function RookerMark({
  size = 28,
  filled = true,
  className = "",
}: RookerMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      {filled ? (
        <path
          fill="currentColor"
          d="M8 37C12 39 15 40 20 40L18 35C16 31 16 28 17 25C21 25 25 26 29 28C31 24 34 21 38 19C37 17 36 14 37 11L42 15L42 12L45 15L45 11L49 15L50 13L53 20L58 20L54 22C56 25 57 29 57 33C57 44 49 52 37 52C31 52 26 49 22 44L20 43C17 42 13 41 8 37Z"
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
            <path d="M8 37C12 39 15 40 20 40L18 35C16 31 16 28 17 25C21 25 25 26 29 28C31 24 34 21 38 19C37.2 16.4 36.7 13.5 37 11L42.5 15L44.5 10.5L48.5 15L50 13L53 20L58 20L54 22C56 25 57 29 57 33C57 44 49 52 37 52C31 52 26 49 22 44L20 43C17 42 13 41 8 37Z" />
            <path d="M30 35C34 32.5 39.5 33 43 38C39 40.5 34 39.5 30 35Z" />
          </g>
          <circle cx="46.5" cy="20" r="1.9" fill="currentColor" />
        </>
      )}
    </svg>
  )
}
