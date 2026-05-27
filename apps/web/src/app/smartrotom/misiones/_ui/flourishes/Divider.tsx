export interface DividerProps {
  color?: string
  glyph?: string
  className?: string
}

export function Divider({
  color = "currentColor",
  glyph = "❦",
  className = "",
}: DividerProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        color,
        fontFamily: "var(--font-display)",
        fontSize: 16,
        opacity: 0.7,
        width: "100%",
      }}
    >
      <svg viewBox="0 0 100 12" height="12" style={{ flex: 1, maxWidth: 80 }}>
        <line x1="0" y1="6" x2="80" y2="6" stroke="currentColor" strokeWidth="0.8" />
        <path d="M 80 6 L 92 2 L 100 6 L 92 10 Z" fill="currentColor" />
      </svg>
      <span style={{ fontSize: 18 }}>{glyph}</span>
      <svg
        viewBox="0 0 100 12"
        height="12"
        style={{ flex: 1, maxWidth: 80, transform: "scaleX(-1)" }}
      >
        <line x1="0" y1="6" x2="80" y2="6" stroke="currentColor" strokeWidth="0.8" />
        <path d="M 80 6 L 92 2 L 100 6 L 92 10 Z" fill="currentColor" />
      </svg>
    </div>
  )
}
