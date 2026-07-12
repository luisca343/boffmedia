"use client"
import { useState, useMemo } from "react"
import { getPokemonDefense } from "../../dexUtils"
import { TypeChip } from "../../_components/ui"
import { TYPE_LABELS, ALL_TYPES } from "../../_utils/typeColors"

const MULT_META: Record<string, { es: string; fg: string; bg: string; label: string }> = {
  "4": { es: "Súper débil", fg: "#ef4444", bg: "rgba(239,68,68,.12)", label: "×4" },
  "2": { es: "Débil", fg: "#fb923c", bg: "rgba(251,146,60,.12)", label: "×2" },
  "1": { es: "Normal", fg: "#97a6bb", bg: "rgba(255,255,255,.02)", label: "×1" },
  "0.5": { es: "Resistente", fg: "#a3e635", bg: "rgba(163,230,53,.1)", label: "×½" },
  "0.25": { es: "Muy resistente", fg: "#22d3ee", bg: "rgba(34,211,238,.1)", label: "×¼" },
  "0": { es: "Inmune", fg: "#c084fc", bg: "rgba(192,132,252,.1)", label: "×0" },
}
const ORDER = ["4", "2", "1", "0.5", "0.25", "0"]

const SELECT = "bg-white/[0.03] border border-white/[0.07] rounded-[7px] py-1.5 px-2.5 text-pk-surface-100 text-[13.5px] outline-none focus:border-pk-primary-400/50"

export default function TypeAnalysis() {
  const [type1, setType1] = useState("fire")
  const [type2, setType2] = useState<string>("")

  const grouped = useMemo(() => {
    const def = getPokemonDefense(type1, type2 || undefined)
    const g: Record<string, string[]> = {}
    ORDER.forEach((m) => (g[m] = []))
    Object.entries(def).forEach(([t, m]) => {
      const k = String(m)
      if (g[k]) g[k].push(t)
    })
    return g
  }, [type1, type2])

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-[18px_20px] flex gap-4 items-center flex-wrap">
        <div>
          <div className="font-pk-mono text-[10px] tracking-[0.1em] uppercase text-pk-surface-500 mb-1.5">Tipo primario</div>
          <select value={type1} onChange={(e) => setType1(e.target.value)} className={`${SELECT} min-w-[160px]`}>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="font-pk-display text-2xl text-pk-surface-500">+</div>
        <div>
          <div className="font-pk-mono text-[10px] tracking-[0.1em] uppercase text-pk-surface-500 mb-1.5">Tipo secundario (opcional)</div>
          <select value={type2} onChange={(e) => setType2(e.target.value)} className={`${SELECT} min-w-[180px]`}>
            <option value="">— Mono tipo —</option>
            {ALL_TYPES.filter((t) => t !== type1).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex gap-2 items-center">
          <TypeChip type={type1} size="lg" />
          {type2 && (
            <>
              <span className="text-pk-surface-500">+</span>
              <TypeChip type={type2} size="lg" />
            </>
          )}
        </div>
      </div>

      <div className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-[16px_18px]">
        <h4 className="font-pk-display font-semibold text-sm text-pk-surface-50 mb-3.5 pb-3 border-b border-white/[0.05] flex items-center gap-2">
          Daño recibido contra este tipo {type2 ? "dual" : ""}
          <span className="font-pk font-normal text-[11.5px] text-pk-surface-500 ml-auto">
            {type2 ? `${TYPE_LABELS[type1]} + ${TYPE_LABELS[type2]}` : TYPE_LABELS[type1]}
          </span>
        </h4>
        <div className="flex flex-col gap-1.5">
          {ORDER.map((mult) => {
            const types = grouped[mult]
            const meta = MULT_META[mult]
            return (
              <div
                key={mult}
                className="grid grid-cols-[110px_1fr_32px] gap-3 items-center min-h-[46px] rounded-[10px] px-3 py-2.5 border"
                style={{ background: meta.bg, borderColor: `color-mix(in oklab, ${meta.fg} 22%, transparent)` }}
              >
                <div className="flex flex-col border-r pr-2.5" style={{ borderColor: `color-mix(in oklab, ${meta.fg} 18%, transparent)` }}>
                  <span className="font-pk-display font-bold text-lg leading-none tabular-nums" style={{ color: meta.fg }}>
                    {meta.label}
                  </span>
                  <span className="font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-400">{meta.es}</span>
                </div>
                <div className="flex flex-wrap gap-1 items-center">
                  {types.length === 0 ? (
                    <span className="text-[11.5px] text-pk-surface-500 italic">— ningún tipo —</span>
                  ) : (
                    types.map((t) => <TypeChip key={t} type={t} size="sm" />)
                  )}
                </div>
                <span className="font-pk-mono text-[11px] font-semibold text-pk-surface-400 bg-black/25 px-1.5 py-0.5 rounded text-center tabular-nums">{types.length}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
