export function PokeballIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.8" />
      <path d="M2 12h20" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.4" fill={color} />
    </svg>
  )
}
