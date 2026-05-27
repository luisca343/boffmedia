type FlourishOrientation = "tl" | "tr" | "bl" | "br"

export interface FlourishProps {
  size?: number
  orientation?: FlourishOrientation
  color?: string
  className?: string
}

export function Flourish({
  size = 60,
  orientation = "tl",
  color = "currentColor",
  className = "",
}: FlourishProps) {
  const transforms: Record<FlourishOrientation, string> = {
    tl: "",
    tr: "scale(-1 1) translate(-60 0)",
    bl: "scale(1 -1) translate(0 -60)",
    br: "scale(-1 -1) translate(-60 -60)",
  }
  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      className={className}
      style={{ color }}
    >
      <g
        transform={transforms[orientation]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <path d="M 2 30 Q 2 2 30 2" />
        <path d="M 7 30 Q 7 7 30 7" />
        <path
          d="M 6 18 Q 12 14 18 18 Q 18 22 14 22"
          fill="currentColor"
          opacity="0.85"
        />
        <path
          d="M 18 6 Q 22 12 18 18 Q 14 18 14 14"
          fill="currentColor"
          opacity="0.85"
        />
        <circle cx="2" cy="30" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="30" cy="2" r="1.8" fill="currentColor" stroke="none" />
        <circle cx="22" cy="22" r="1.2" fill="currentColor" stroke="none" />
        <path d="M 30 14 Q 32 18 28 22 Q 24 24 22 28" />
      </g>
    </svg>
  )
}
