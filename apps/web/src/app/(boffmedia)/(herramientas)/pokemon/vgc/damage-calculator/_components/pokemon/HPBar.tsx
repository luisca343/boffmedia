'use client'

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('vgc.calc.panel')
  const bs: BaseStats | undefined = apiBaseStats
  if (!bs) return null

  const hpEv = useChampions ? Math.floor((poke.evs.hp * 252) / 32) : poke.evs.hp
  const maxHP = calcStat(GEN9, 'hp', bs.hp, poke.ivs.hp, hpEv, poke.level, poke.nature)
  const cur = poke.currentHP < 0 ? maxHP : Math.min(poke.currentHP, maxHP)
  const pct = (cur / maxHP) * 100

  const barColor =
    pct > 50 ? 'bg-success' : pct > 25 ? 'bg-warning' : 'bg-danger'
  const textColor =
    pct > 50 ? 'text-success-hover' : pct > 25 ? 'text-warning-hover' : 'text-danger-hover'

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-ink-muted min-w-[24px]">{t('hpLabel')}</span>
        <input
          type="number"
          min={1}
          max={maxHP}
          value={cur}
          onChange={(e) => {
            const v = Math.min(maxHP, Math.max(1, parseInt(e.target.value) || 1))
            onChange({ currentHP: v })
          }}
          className="w-14 bg-layer-1 border border-edge rounded text-center font-mono text-xs text-ink focus:outline-none focus:border-primary py-0.5"
        />
        <span className="font-mono text-xs text-ink-muted">/ {maxHP}</span>
        <span className={`font-bold text-xs ${textColor}`}>({pct.toFixed(1)}%)</span>
        <button
          type="button"
          onClick={() => onChange({ currentHP: -1 })}
          className="ml-auto text-[10px] text-ink-dim hover:text-ink-muted transition-colors"
        >
          {t('hpReset')}
        </button>
      </div>
      <div className="h-2 bg-layer-1 rounded-full overflow-hidden border border-edge/50">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
