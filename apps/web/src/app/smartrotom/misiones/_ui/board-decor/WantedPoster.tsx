export interface WantedPosterProps {
  /** The villain/target name displayed on the poster */
  name: string
  /** The header label, e.g. "SE BUSCA" */
  label?: string
  /** Initial letter shown in the emblem */
  emblem?: string
  /** Emblem background gradient start color */
  emblemColor?: string
  /** Reward text, e.g. "5000₽" */
  reward?: string
  tilt?: number
  width?: number
}

export function WantedPoster({
  name,
  label = "SE BUSCA",
  emblem,
  emblemColor = "#aa2a2a",
  reward,
  tilt = 5,
  width = 150,
}: WantedPosterProps) {
  const derivedEmblem = emblem ?? name[0]?.toUpperCase() ?? "?"
  const emblemDark = emblemColor.replace("#aa", "#6b").replace("#", "#")
  return (
    <div
      style={{
        width,
        padding: "10px 12px",
        background: "linear-gradient(180deg, #f0e0a8, #d8c080)",
        border: "1px solid rgba(60,40,20,0.4)",
        boxShadow: "4px 6px 10px rgba(0,0,0,0.4)",
        fontFamily: "Cinzel Decorative, serif",
        color: "#1a0e07",
        textAlign: "center",
        transform: `rotate(${tilt}deg)`,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.25em",
          marginBottom: 2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: Math.max(12, Math.floor(width / 10)), fontWeight: 700, lineHeight: 1 }}>
        {name}
      </div>
      <div
        style={{
          margin: "8px auto",
          width: 60,
          height: 60,
          background: `linear-gradient(135deg, ${emblemColor}, ${emblemDark})`,
          display: "grid",
          placeItems: "center",
          color: "#f5d785",
          fontSize: 30,
          fontWeight: 900,
          border: "1px solid rgba(0,0,0,0.5)",
        }}
      >
        {derivedEmblem}
      </div>
      {reward && (
        <div style={{ fontSize: 10, fontStyle: "italic" }}>Recompensa {reward}</div>
      )}
    </div>
  )
}
