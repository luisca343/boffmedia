"use client"

import { useId } from "react"
import { useTranslations } from "next-intl"

// The seal of Teras: an engraved roundel with a circular legend and a civic pediment.
// It is the app's whole identity in one mark — the header, the nav foot, every stamped
// document. The legend turns once every 90 seconds; `motion-reduce` stops it dead.
export function Seal({ size = 64, ring = true, tone = "gold" }: { size?: number; ring?: boolean; tone?: "gold" | "green" }) {
  const t = useTranslations("gobierno")
  const pathId = `gt-seal-${useId().replace(/:/g, "")}`
  const textR = 41
  const ringCol = tone === "green" ? "rgb(var(--gt-civic))" : "rgb(var(--gt-gold-600))"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={t("ui.sealAriaLabel")}
      className="block flex-none"
    >
      <defs>
        <path
          id={pathId}
          d={`M50,50 m-${textR},0 a${textR},${textR} 0 1,1 ${textR * 2},0 a${textR},${textR} 0 1,1 -${textR * 2},0`}
        />
      </defs>

      <circle cx="50" cy="50" r="50" fill="rgb(var(--gt-paper-0))" stroke={ringCol} strokeWidth="1.4" />
      <circle cx="50" cy="50" r="46.5" fill="none" stroke={ringCol} strokeWidth="0.7" opacity="0.55" />
      <circle cx="50" cy="50" r="29" fill="none" stroke={ringCol} strokeWidth="0.7" opacity="0.5" />

      {ring && (
        <g
          className="origin-center animate-gt-seal motion-reduce:animate-none"
          style={{ transformBox: "fill-box" }}
        >
          <text fontFamily="var(--font-gt-display, 'Libre Baskerville', serif)" fontSize="6.4" fontWeight="700" letterSpacing="1.6" fill={ringCol}>
            <textPath href={`#${pathId}`} startOffset="0%">
              ★ GOBIERNO DE TERAS ★ REGIÓN AUTÓNOMA DE TERAS
            </textPath>
          </text>
        </g>
      )}

      {/* the civic pediment: a portico of four columns on a stepped base */}
      <g fill="none" stroke="rgb(var(--gt-civic))" strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round">
        <path d="M37 44 L50 36 L63 44 Z" fill="rgb(var(--gt-civic-tint))" />
        <line x1="34" y1="44" x2="66" y2="44" />
        <line x1="40" y1="46" x2="40" y2="58" />
        <line x1="46.6" y1="46" x2="46.6" y2="58" />
        <line x1="53.4" y1="46" x2="53.4" y2="58" />
        <line x1="60" y1="46" x2="60" y2="58" />
        <line x1="34" y1="60" x2="66" y2="60" strokeWidth="2.6" />
      </g>
      <circle cx="50" cy="40.5" r="1.5" fill="rgb(var(--gt-gold-600))" />
    </svg>
  )
}
