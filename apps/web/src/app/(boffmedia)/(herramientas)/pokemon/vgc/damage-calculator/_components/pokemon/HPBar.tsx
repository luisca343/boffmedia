'use client'

import { calcStat, Generations } from '@smogon/calc'
import type { CalcPokemon } from '../../_types/calculator'

const GEN9 = Generations.get(9)

type BaseStats = { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }

interface Props {
  poke: CalcPokemon
  onChange: (patch: Partial<CalcPokemon>) => void
  useChampions?: boolean
  /** Optional baseStats from the API VgcPokemon entry — used when SPECIES_MAP lookup misses. */
  baseStats?: BaseStats
}

export function HPBar({ poke, onChange, useChampions = false, baseStats: apiBaseStats }: Props) {
  const bs: BaseStats | undefined = apiBaseStats
  if (!bs) return null

  const hpEv = useChampions ? Math.floor((poke.evs.hp * 252) / 32) : poke.evs.hp
  const maxHP = calcStat(GEN9, 'hp', bs.hp, poke.ivs.hp, hpEv, poke.level, poke.nature)
  const cur = poke.currentHP < 0 ? maxHP : Math.min(poke.currentHP, maxHP)
  const pct = (cur / maxHP) * 100

  const barColor =
    pct > 50 ? 'bg-success-500' : pct > 25 ? 'bg-warning-500' : 'bg-error-500'
  const textColor =
    pct > 50 ? 'text-success-400' : pct > 25 ? 'text-warning-400' : 'text-error-400'

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-surface-500 min-w-[24px]">HP</span>
        <input
          type="number"
          min={1}
          max={maxHP}
          value={cur}
          onChange={(e) => {
            const v = Math.min(maxHP, Math.max(1, parseInt(e.target.value) || 1))
            onChange({ currentHP: v })
          }}
          className="w-14 bg-surface-900 border border-surface-700 rounded text-center font-mono text-xs text-surface-200 focus:outline-none focus:border-primary-500 py-0.5"
        />
        <span className="font-mono text-xs text-surface-400">/ {maxHP}</span>
        <span className={`font-bold text-xs ${textColor}`}>({pct.toFixed(1)}%)</span>
        <button
          type="button"
          onClick={() => onChange({ currentHP: -1 })}
          className="ml-auto text-[10px] text-surface-600 hover:text-surface-400 transition-colors"
        >
          Reset
        </button>
      </div>
      <div className="h-2 bg-surface-900 rounded-full overflow-hidden border border-surface-700/50">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
