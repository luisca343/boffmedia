import * as React from "react"
import { damageColor, type DamageTone } from "./theme"

// large KO verdict in the results strip.
export function KoVerdict({ text, tone = "dim" }: { text: React.ReactNode; tone?: DamageTone }) {
  return (
    <span
      className="font-display text-[30px]/none font-extrabold italic uppercase tracking-[0.02em]"
      style={{ color: damageColor(tone) }}
    >
      {text}
    </span>
  )
}
