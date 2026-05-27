export interface InkBlotProps {
  size?: number
  color?: string
  tilt?: number
}

export function InkBlot({ size = 60, color = "#1a1208", tilt = 0 }: InkBlotProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{
        transform: `rotate(${tilt}deg)`,
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
      }}
    >
      <path
        d="M 30 18 C 14 24, 8 44, 14 58 C 6 72, 22 86, 38 80 C 48 90, 70 86, 76 72 C 92 70, 94 50, 82 42 C 88 28, 70 14, 56 22 C 48 12, 32 12, 30 18 Z"
        fill={color}
        opacity="0.88"
      />
      <circle cx="86" cy="20" r="3" fill={color} opacity="0.7" />
      <circle cx="12" cy="78" r="2" fill={color} opacity="0.6" />
      <circle cx="96" cy="60" r="2" fill={color} opacity="0.7" />
    </svg>
  )
}
