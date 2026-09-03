"use client"
import React, { useState } from "react"
import { typeChart } from "../../dexUtils"
import { TypeGlyph } from "../../_components/ui"
import { TYPE_COLORS, TYPE_LABEL_KEYS, ALL_TYPES } from "../../_utils/typeColors"
import { getContrastingTextColor } from "../../_utils/dexMeta"
import { useTranslations } from "next-intl"

// Attacker's perspective: 2× = green (good), ½ = red (bad), 0 = purple (immune).
function multSymbol(m: number) {
  if (m === 4) return "4×"
  if (m === 2) return "2×"
  if (m === 0.5) return "½"
  if (m === 0.25) return "¼"
  if (m === 0) return "0"
  return "·"
}
function multStyle(m: number): { background: string; color: string } {
  if (m === 2 || m === 4) return { background: "rgba(163,230,53,.16)", color: "#a3e635" }
  if (m === 0.5 || m === 0.25) return { background: "rgba(239,68,68,.16)", color: "#f87171" }
  if (m === 0) return { background: "rgba(192,132,252,.18)", color: "#c084fc" }
  return { background: "rgba(255,255,255,.025)", color: "#677790" }
}

const LEGEND = [
  { s: "2×", style: { background: "rgba(163,230,53,.16)", color: "#a3e635" }, key: "chart_super_effective" },
  { s: "·", style: { background: "rgba(255,255,255,.03)", color: "#677790" }, key: "chart_normal_damage" },
  { s: "½", style: { background: "rgba(239,68,68,.16)", color: "#f87171" }, key: "chart_not_effective" },
  { s: "0", style: { background: "rgba(192,132,252,.18)", color: "#c084fc" }, key: "chart_no_effect" },
]

export default function FullTypeChart() {
  const t = useTranslations("pokedex")
  const [hover, setHover] = useState<{ axis: "atk" | "def"; type: string } | null>(null)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_13.75rem] gap-[1.375rem] items-start">
      <div className="overflow-x-auto">
        <div className="grid gap-0.5 bg-white/[0.02] border border-white/[0.05] rounded-[10px] p-2 min-w-[35rem]" style={{ gridTemplateColumns: "36px repeat(18, minmax(0, 1fr))" }}>
          <div className="grid place-items-center text-pk-surface-500 font-pk-mono text-[0.5625rem] bg-white/[0.02] rounded aspect-square">A↓D→</div>
          {ALL_TYPES.map((tp) => (
            <div
              key={"h-" + tp}
              className="grid place-items-center aspect-square rounded"
              style={{ background: TYPE_COLORS[tp], color: getContrastingTextColor(TYPE_COLORS[tp]) }}
              title={t(TYPE_LABEL_KEYS[tp])}
              onMouseEnter={() => setHover({ axis: "def", type: tp })}
              onMouseLeave={() => setHover(null)}
            >
              <TypeGlyph type={tp} size={14} />
            </div>
          ))}

          {ALL_TYPES.map((atk) => (
            <React.Fragment key={"row-" + atk}>
              <div
                className="grid place-items-center aspect-square rounded"
                style={{ background: TYPE_COLORS[atk], color: getContrastingTextColor(TYPE_COLORS[atk]) }}
                title={t(TYPE_LABEL_KEYS[atk])}
                onMouseEnter={() => setHover({ axis: "atk", type: atk })}
                onMouseLeave={() => setHover(null)}
              >
                <TypeGlyph type={atk} size={14} />
              </div>
              {ALL_TYPES.map((def) => {
                const m = typeChart[atk]?.[def] ?? 1
                const hl = (hover?.axis === "def" && hover.type === def) || (hover?.axis === "atk" && hover.type === atk)
                return (
                  <div
                    key={atk + def}
                    className="grid place-items-center aspect-square rounded font-pk-mono text-[0.6875rem] font-semibold tabular-nums cursor-default"
                    style={{ ...multStyle(m), ...(hl ? { boxShadow: "inset 0 0 0 1px rgba(249,115,22,.5)" } : {}) }}
                    title={`${t(TYPE_LABEL_KEYS[atk])} → ${t(TYPE_LABEL_KEYS[def])}: ×${m}`}
                  >
                    {multSymbol(m)}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.05] rounded-[10px] p-[16px_18px] flex flex-col gap-2.5">
        <h4 className="font-pk-mono text-[0.625rem] tracking-[0.1em] uppercase text-pk-surface-500 mb-1">{t("chart_legend")}</h4>
        {LEGEND.map((r) => (
          <div key={r.key} className="flex items-center gap-2.5 text-[0.78125rem] text-pk-surface-200">
            <span className="w-6 h-6 rounded grid place-items-center font-pk-mono text-[0.625rem] font-semibold" style={r.style}>
              {r.s}
            </span>
            {t(r.key)}
          </div>
        ))}
        <div className="text-[0.71875rem] text-pk-surface-500 leading-[1.5] pt-3 border-t border-white/[0.05] mt-1">
          {t("chart_hint")}
        </div>
      </div>
    </div>
  )
}
