interface ThumbTackProps {
  size?: number
  color?: string
  className?: string
}

export function Thumbtack({ size = 16, color = "#a82a18", className = "" }: ThumbTackProps) {
  const gid = "tt-" + color.replace("#", "")
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={{ filter: "drop-shadow(1px 3px 3px rgba(0,0,0,0.5))" }}
    >
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="40%" stopColor={color} />
          <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={`url(#${gid})`}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="0.4"
      />
      <ellipse
        cx="9"
        cy="8"
        rx="3.5"
        ry="1.5"
        fill="rgba(255,255,255,0.5)"
        transform="rotate(-30 9 8)"
      />
    </svg>
  )
}
