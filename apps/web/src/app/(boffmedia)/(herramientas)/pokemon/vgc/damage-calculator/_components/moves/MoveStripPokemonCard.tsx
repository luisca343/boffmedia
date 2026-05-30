'use client'

import { useTranslations } from 'next-intl'
import { calcStat, Generations } from '@smogon/calc'
import type { CalcPokemon } from '../../_types/calculator'
import type { VgcPokemon } from '../../_hooks/useLegalPokemon'
import { getSpriteUrl, handleSpriteError } from '../../_lib/spriteUtils'

const GEN9 = Generations.get(9)

interface MoveStripPokemonCardProps {
  poke: CalcPokemon
  apiEntry?: VgcPokemon
  align?: 'left' | 'right'
  useChampions?: boolean
}

function getMaxHP(poke: CalcPokemon, apiEntry?: VgcPokemon, useChampions = false): number {
  if (!apiEntry) return -1
  const hpEv = useChampions ? Math.floor((poke.evs.hp * 252) / 32) : poke.evs.hp
  return calcStat(GEN9, 'hp', apiEntry.baseStats.hp, poke.ivs.hp, hpEv, poke.level, poke.nature)
}

function HPMini({ poke, apiEntry, align = 'left', useChampions = false }: { poke: CalcPokemon; apiEntry?: VgcPokemon; align?: 'left' | 'right'; useChampions?: boolean }) {
  const maxHP = getMaxHP(poke, apiEntry, useChampions)
  if (maxHP < 0) return null
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

export function MoveStripPokemonCard({ poke, apiEntry, align = 'left', useChampions = false }: MoveStripPokemonCardProps) {
  const t = useTranslations('vgc.calc.moveStripCard')
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
          <div className="text-[10px] text-surface-500">{t('level', { level: poke.level })}</div>
        </div>
      </div>
      <div className="mt-1">
        <HPMini poke={poke} apiEntry={apiEntry} align={align} useChampions={useChampions} />
      </div>
    </div>
  )
}
