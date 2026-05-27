interface NailProps {
  size?: number
  color?: string
  className?: string
}

export function Nail({ size = 14, color = "#3a2a18", className = "" }: NailProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={{ filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.5))" }}
    >
      <defs>
        <radialGradient id="nail-g" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#c0a070" />
          <stop offset="40%" stopColor="#8a6840" />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="8" fill="url(#nail-g)" stroke="rgba(0,0,0,0.5)" strokeWidth="0.5" />
      <ellipse
        cx="9.5"
        cy="8.5"
        rx="3"
        ry="1.2"
        fill="rgba(255,255,255,0.4)"
        transform="rotate(-30 9.5 8.5)"
      />
      <circle cx="12" cy="12" r="1" fill="rgba(0,0,0,0.45)" />
    </svg>
  )
}
