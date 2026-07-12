"use client"
import { BattleStats, Pokemon } from "@/types/Pokemon"
import { useState } from "react"
import { statColor, totalStatColor, getContrastingTextColor } from "../../../_utils/dexMeta"
import { ChevronDownIcon, Cog6ToothIcon } from "@heroicons/react/24/outline"

const STAT_LABELS: Record<string, { es: string; color: string }> = {
  hp: { es: "PS", color: "#34d399" },
  attack: { es: "Ataque", color: "#fb923c" },
  defense: { es: "Defensa", color: "#fbbf24" },
  specialAttack: { es: "At. Esp.", color: "#22d3ee" },
  specialDefense: { es: "Def. Esp.", color: "#a3e635" },
  speed: { es: "Velocidad", color: "#c084fc" },
}

function calcStat(base: number, level: number, iv: number, ev: number, isHP: boolean, nature = 1): number {
  if (isHP) return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100 + level + 10)
  return Math.floor((((2 * base + iv + Math.floor(ev / 4)) * level) / 100 + 5) * nature)
}

export function StatsTable({ pokemon, formIndex }: { pokemon: Pokemon; formIndex: number }) {
  const [calcOpen, setCalcOpen] = useState(false)
  const [level, setLevel] = useState(100)
  const [iv, setIv] = useState(31)
  const [ev, setEv] = useState(252)
  const [nature, setNature] = useState<"neutral" | "positive" | "negative">("neutral")

  const stats = (pokemon.forms[formIndex].battleStats ? pokemon.forms[formIndex].battleStats : pokemon.forms[0].battleStats) as BattleStats
  if (!stats) return <p className="text-pk-surface-300">Estadísticas no disponibles</p>

  const statTotal = Object.values(stats).reduce((acc, val) => acc + val, 0)

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-baseline gap-2">
          <b className="font-pk-display font-bold text-[26px] tabular-nums" style={{ color: totalStatColor(statTotal) }}>
            {statTotal}
          </b>
          <span className="font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-500">Total</span>
        </div>
      </div>

      <div className="grid items-center pb-2 border-b border-white/[0.06]" style={{ gridTemplateColumns: "100px 1fr 56px 56px", gap: "14px" }}>
        <span className="font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-500">Estadística</span>
        <span className="font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-500">Base</span>
        <span className="font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-500 text-center">Mín N.50</span>
        <span className="font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-500 text-center">Máx N.100</span>
      </div>

      {Object.entries(stats).map(([stat, statValue]) => {
        const meta = STAT_LABELS[stat] || { es: stat, color: "#677790" }
        const isHP = stat.toLowerCase() === "hp"
        const min50 = calcStat(statValue, 50, 0, 0, isHP, 0.9)
        const max100 = calcStat(statValue, 100, 31, 252, isHP, 1.1)

        return (
          <div
            key={stat}
            className="grid items-center py-2 border-b border-dashed border-white/[0.04] last:border-0"
            style={{ gridTemplateColumns: "100px 1fr 56px 56px", gap: "14px" }}
          >
            <div className="flex items-center gap-1.5 text-[12px] text-pk-surface-300 font-medium">
              <span className="w-1 h-3.5 rounded-sm shrink-0" style={{ background: meta.color }} />
              {meta.es}
            </div>

            <div className="relative h-[26px] bg-white/[0.03] rounded overflow-hidden">
              <div
                className="absolute inset-0 rounded"
                style={{
                  width: `${Math.min((statValue / 200) * 100, 100)}%`,
                  background: statColor(statValue),
                  boxShadow: "inset 0 -1px 0 rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.18)",
                }}
              />
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 font-pk-mono text-xs font-semibold tabular-nums drop-shadow-sm"
                style={{ color: getContrastingTextColor(statColor(statValue)) }}
              >
                {statValue}
              </span>
            </div>

            <div className="font-pk-mono text-xs text-center tabular-nums text-pk-surface-300">{min50}</div>
            <div className="font-pk-mono text-xs text-center tabular-nums font-semibold text-pk-primary-300">{max100}</div>
          </div>
        )
      })}

      <div className="mt-5 bg-white/[0.02] border border-white/[0.05] rounded-[10px] overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-3.5 py-3 text-[12.5px] font-medium text-pk-surface-200 hover:text-pk-surface-50 transition-colors cursor-pointer"
          onClick={() => setCalcOpen((o) => !o)}
          aria-expanded={calcOpen}
        >
          <span className="inline-flex items-center gap-2">
            <Cog6ToothIcon className="w-3.5 h-3.5" />
            Calculadora de stats (IVs, EVs, naturaleza)
          </span>
          <ChevronDownIcon className="w-3.5 h-3.5 transition-transform" style={{ transform: calcOpen ? "rotate(180deg)" : "none" }} />
        </button>
        {calcOpen && (
          <div className="px-3.5 pb-3.5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-500">Nivel</label>
              <input
                type="number"
                min={1}
                max={100}
                value={level}
                onChange={(e) => setLevel(+e.target.value || 1)}
                className="bg-white/[0.03] border border-white/[0.07] rounded-[7px] text-pk-surface-100 font-pk-mono text-[13px] px-2.5 py-1.5 outline-none focus:border-pk-primary-400/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-500">IVs</label>
              <input
                type="number"
                min={0}
                max={31}
                value={iv}
                onChange={(e) => setIv(+e.target.value || 0)}
                className="bg-white/[0.03] border border-white/[0.07] rounded-[7px] text-pk-surface-100 font-pk-mono text-[13px] px-2.5 py-1.5 outline-none focus:border-pk-primary-400/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-500">EVs</label>
              <input
                type="number"
                min={0}
                max={252}
                step={4}
                value={ev}
                onChange={(e) => setEv(+e.target.value || 0)}
                className="bg-white/[0.03] border border-white/[0.07] rounded-[7px] text-pk-surface-100 font-pk-mono text-[13px] px-2.5 py-1.5 outline-none focus:border-pk-primary-400/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-500">Naturaleza</label>
              <select
                value={nature}
                onChange={(e) => setNature(e.target.value as any)}
                className="bg-white/[0.03] border border-white/[0.07] rounded-[7px] text-pk-surface-100 text-[12.5px] px-2.5 py-1.5 outline-none focus:border-pk-primary-400/50"
              >
                <option value="neutral">Neutral (×1)</option>
                <option value="positive">Beneficiosa (+10%)</option>
                <option value="negative">Perjudicial (−10%)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
