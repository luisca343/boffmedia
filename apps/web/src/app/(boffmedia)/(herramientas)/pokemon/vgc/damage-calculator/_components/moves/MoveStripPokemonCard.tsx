'use client'

import { calcStat, Generations } from '@smogon/calc'
import type { CalcPokemon } from '../../_types/calculator'
import { SPECIES_MAP } from '../../_hooks/usePokemonData'
import { getSpriteUrl, handleSpriteError } from '../../_lib/spriteUtils'

const GEN9 = Generations.get(9)

interface MoveStripPokemonCardProps {
  poke: CalcPokemon
  align?: 'left' | 'right'
}

function getMaxHP(poke: CalcPokemon): number {
  const species = SPECIES_MAP.get(poke.name)
  if (!species) return 1
  return calcStat(GEN9, 'hp', species.baseStats.hp, poke.ivs.hp, poke.evs.hp, poke.level, poke.nature)
}

function HPMini({ poke, align = 'left' }: { poke: CalcPokemon; align?: 'left' | 'right' }) {
  const maxHP = getMaxHP(poke)
  const cur = poke.currentHP < 0 ? maxHP : Math.min(poke.currentHP, maxHP)
  const pct = (cur / maxHP) * 100
  const barColor = pct > 50 ? 'bg-success-500' : pct > 25 ? 'bg-warning-500' : 'bg-error-500'
  const textColor = pct > 50 ? 'text-success-400' : pct > 25 ? 'text-warning-400' : 'text-error-400'

  return (
    <div className={`flex flex-col gap-0.5 min-w-0 ${align === 'right' ? 'items-end' : ''}`}>
      <div className={`flex items-center gap-1.5 w-full ${align === 'right' ? 'justify-end' : ''}`}>
        <span className="font-mono text-[11px] text-surface-400">{cur}/{maxHP}</span>
        <div className="h-2 bg-surface-900/80 rounded-full overflow-hidden border border-surface-700/40 w-full max-w-[110px] min-w-[84px]">
          <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      {poke.status && poke.status !== 'Healthy' && (
        <span
          className={`text-[8px] font-bold border rounded px-1 ${textColor} border-current/30 bg-current/10 ${align === 'right' ? 'self-end' : 'self-start'}`}
        >
          {poke.status.toUpperCase()}
        </span>
      )}
    </div>
  )
}

export function MoveStripPokemonCard({ poke, align = 'left' }: MoveStripPokemonCardProps) {
  const reverse = align === 'right'

  return (
    <div className={`rounded-md border border-surface-700/50 bg-surface-800/55 px-2 py-1.5 ${reverse ? 'text-right' : ''}`}>
      <div className={`flex items-center gap-2 ${reverse ? 'flex-row-reverse' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getSpriteUrl(poke.name)}
          alt={poke.name}
          width={64}
          height={64}
          className="pixelated flex-shrink-0"
          onError={handleSpriteError}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-black text-surface-100 truncate">{poke.name}</div>
          <div className="text-[10px] text-surface-500">Lv. {poke.level}</div>
        </div>
      </div>
      <div className="mt-1">
        <HPMini poke={poke} align={align} />
      </div>
    </div>
  )
}
