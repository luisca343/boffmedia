export interface InkwellProps {
  size?: number
}

export function Inkwell({ size = 84 }: InkwellProps) {
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      style={{ filter: "drop-shadow(2px 6px 6px rgba(0,0,0,0.55))" }}
    >
      <defs>
        <radialGradient id="ink-glass" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#7e6450" />
          <stop offset="40%" stopColor="#3a2618" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#120a04" />
        </radialGradient>
        <linearGradient id="ink-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d6a13f" />
          <stop offset="100%" stopColor="#6b440f" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="106" rx="44" ry="8" fill="#1a0e07" opacity="0.6" />
      <path
        d="M 12 96 L 88 96 L 84 110 L 16 110 Z"
        fill="url(#ink-rim)"
        stroke="#3a1e0a"
        strokeWidth="1"
      />
      <path
        d="M 22 48 Q 22 24 50 24 Q 78 24 78 48 L 78 96 L 22 96 Z"
        fill="url(#ink-glass)"
        stroke="#1a0e07"
        strokeWidth="1.5"
      />
      <ellipse
        cx="50"
        cy="28"
        rx="22"
        ry="6"
        fill="url(#ink-rim)"
        stroke="#3a1e0a"
        strokeWidth="1"
      />
      <ellipse cx="50" cy="28" rx="18" ry="4" fill="#0a0604" />
      <ellipse cx="50" cy="30" rx="14" ry="2.5" fill="#1a0a05" />
      <ellipse cx="44" cy="29" rx="4" ry="1" fill="rgba(255,255,255,0.18)" />
      <path
        d="M 30 52 Q 32 70 36 90"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}
