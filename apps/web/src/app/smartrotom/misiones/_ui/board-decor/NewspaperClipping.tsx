export interface NewspaperClippingProps {
  headline: string
  body: string
  source?: string
  tilt?: number
  width?: number
}

export function NewspaperClipping({
  headline,
  body,
  source = "The Pewter Times",
  tilt = 1.6,
  width = 220,
}: NewspaperClippingProps) {
  return (
    <div
      style={{
        width,
        padding: "12px 14px",
        background: "linear-gradient(180deg, #efe8d2, #d6cca6)",
        transform: `rotate(${tilt}deg)`,
        boxShadow:
          "inset 0 0 30px rgba(80,50,20,0.15), 4px 6px 10px rgba(0,0,0,0.35), 10px 14px 22px -10px rgba(0,0,0,0.4)",
        color: "#1a1208",
        fontFamily: "'IM Fell English SC', 'Times New Roman', serif",
        clipPath:
          "polygon(2% 0%, 98% 1%, 100% 4%, 99% 96%, 97% 100%, 3% 99%, 1% 96%, 2% 4%)",
      }}
    >
      <div
        style={{
          fontSize: 8,
          letterSpacing: "0.20em",
          textTransform: "uppercase",
          textAlign: "center",
          opacity: 0.7,
          marginBottom: 4,
          borderBottom: "1px solid rgba(0,0,0,0.4)",
          paddingBottom: 3,
        }}
      >
        {source}
      </div>
      <div
        style={{
          fontFamily: "'IM Fell English SC', serif",
          fontWeight: 700,
          fontSize: 14,
          lineHeight: 1.05,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {headline}
      </div>
      <div
        style={{
          fontSize: 9,
          lineHeight: 1.4,
          columnCount: 2,
          columnGap: 6,
          fontFamily: "'EB Garamond', serif",
          textAlign: "justify",
          color: "#2a1810",
        }}
      >
        {body}
      </div>
    </div>
  )
}
