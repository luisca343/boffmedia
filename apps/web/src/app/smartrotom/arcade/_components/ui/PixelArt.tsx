export interface PixelArtSprite {
  /** One string per row; one character per pixel. `.` is transparent. */
  bitmap: string[]
  /** Character → colour. Data-driven fills, so they are applied inline. */
  legend: Record<string, string>
}

export interface PixelArtProps {
  sprite: PixelArtSprite
  /** Side of one pixel, in CSS px. */
  scale?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Renders a sprite from a character bitmap as a grid of divs. The cabinet art is
 * original to this codebase — no Pokémon assets go through here; those keep
 * their own multi-tier sprite resolution.
 */
export function PixelArt({ sprite, scale = 6, className, style }: PixelArtProps) {
  const { bitmap, legend } = sprite
  const rows = bitmap.length
  const cols = rows > 0 ? bitmap[0].length : 0
  return (
    <div
      aria-hidden
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${scale}px)`,
        gridTemplateRows: `repeat(${rows}, ${scale}px)`,
        ...style,
      }}
    >
      {bitmap.flatMap((row, r) =>
        [...row].map((ch, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              width: scale,
              height: scale,
              background: ch === "." ? "transparent" : (legend[ch] ?? "transparent"),
            }}
          />
        )),
      )}
    </div>
  )
}
