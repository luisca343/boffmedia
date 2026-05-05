'use client'

import { useMemo } from 'react'
import type { CalcPokemon, CalcField, DamageResult } from '../../_types/calculator'
import { calcAllMoves, getKOVerdict, getDamageColorClass } from '../../_lib/smogonAdapter'
import { MoveStripPokemonCard } from './MoveStripPokemonCard'
import { useLegalPokemon } from '../../_hooks/useLegalPokemon'
import { useCalculatorStore } from '../../_store/calculatorStore'

interface Props {
  poke1: CalcPokemon
  poke2: CalcPokemon
  field: CalcField
  useChampions: boolean
  activeMove1: number | null
  activeMove2: number | null
  onSelectMove1: (idx: number | null) => void
  onSelectMove2: (idx: number | null) => void
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`
}

function MoveRow({
  move,
  result,
  isActive,
  onClick,
}: {
  move: CalcPokemon['moves'][0]
  result: DamageResult | null
  isActive: boolean
  onClick: () => void
}) {
  const colorClass = result ? getDamageColorClass(result) : 'text-surface-600'
  const base = `move-strip-row grid grid-cols-[1fr_auto] items-center gap-2 min-h-[24px] px-2 py-0.5 border border-surface-700/40 border-t-0 first:border-t cursor-pointer transition-colors ${
    isActive
      ? 'bg-primary-500/15 border-primary-500/45'
      : 'hover:bg-primary-500/6'
  }`

  return (
    <div className={base} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div
        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold truncate ${
          isActive
            ? 'border-primary-400/70 text-primary-200 bg-primary-500/15'
            : 'border-surface-500/70 text-surface-200 bg-surface-900/40'
        }`}
      >
      {move.name || '—'}
      </div>
      {result && result.min > 0 ? (
        <div className={`text-[11px] font-mono whitespace-nowrap min-w-[90px] text-right ${colorClass}`}>
          {fmtPct(result.minPct)}–{fmtPct(result.maxPct)}
        </div>
      ) : (
        <div className="text-[11px] font-mono text-surface-700 min-w-[90px] text-right">0 - 0%</div>
      )}
    </div>
  )
}

function ResultBar({
  result,
  move,
  isActive,
  reversed = false,
}: {
  result: DamageResult | null
  move: CalcPokemon['moves'][0] | null
  isActive: boolean
  reversed?: boolean
}) {
  if (!isActive || !result || !move) {
    return (
      <div className={`flex items-center px-3 min-h-[30px] ${reversed ? 'justify-end' : ''}`}>
        <span className="text-[10px] text-surface-600">
          {!isActive ? (reversed ? 'select a move →' : '← select a move') : 'No damage / immune'}
        </span>
      </div>
    )
  }

  const verdict = getKOVerdict(result)

  return (
    <div className={`flex items-center gap-2 px-3 min-h-[30px] overflow-hidden ${reversed ? 'flex-row-reverse' : ''}`}>
      <span className={`text-[10px] font-black whitespace-nowrap ${verdict.colorClass}`}>
        {verdict.label}
      </span>
      <span className="font-mono text-[10px] text-surface-400 truncate flex-1">{result.desc}</span>
      <span className="font-mono text-[9px] text-surface-600 truncate flex-1 text-right">
        ({result.rolls.join(', ')})
      </span>
    </div>
  )
}

export function MoveStrip({
  poke1, poke2, field, useChampions,
  activeMove1, activeMove2, onSelectMove1, onSelectMove2,
}: Props) {
  const { regulation } = useCalculatorStore()
  const legalPokemon = useLegalPokemon(regulation)
  const api1 = legalPokemon.find((p) => p.name === poke1.name)
  const api2 = legalPokemon.find((p) => p.name === poke2.name)
  const results1 = useMemo(
    () => calcAllMoves(poke1, poke2, field, useChampions),
    [poke1, poke2, field, useChampions],
  )
  const results2 = useMemo(
    () => calcAllMoves(poke2, poke1, field, useChampions),
    [poke1, poke2, field, useChampions],
  )

  return (
    <div className="bg-surface-900/97 border-b border-surface-700/50 flex-shrink-0">
      {/* Pokémon + moves — stacked on mobile, side-by-side on md+ */}
      <div className="flex flex-col md:grid md:grid-cols-[1fr_1px_1fr]">

        {/* poke1 attacks poke2 */}
        <div className="grid grid-cols-[140px_minmax(0,1fr)] sm:grid-cols-[170px_minmax(0,1fr)] gap-2 px-2.5 py-2 items-start">
          <MoveStripPokemonCard poke={poke1} apiEntry={api1} />
          <div className="flex flex-col rounded overflow-hidden border border-surface-700/40 w-full md:max-w-[280px] md:justify-self-end">
            {poke1.moves.map((mv, i) => (
              <MoveRow
                key={i}
                move={mv}
                result={results1[i] ?? null}
                isActive={activeMove1 === i}
                onClick={() => onSelectMove1(activeMove1 === i ? null : i)}
              />
            ))}
          </div>
        </div>

        {/* Divider — horizontal on mobile, vertical on md+ */}
        <div className="h-px w-full bg-surface-700/40 md:h-auto md:w-px md:bg-surface-700/50 md:self-stretch" />

        {/* poke2 attacks poke1 */}
        <div className="grid grid-cols-[minmax(0,1fr)_140px] sm:grid-cols-[minmax(0,1fr)_170px] gap-2 px-2.5 py-2 items-start">
          <div className="flex flex-col rounded overflow-hidden border border-surface-700/40 w-full md:max-w-[280px] md:justify-self-start">
            {poke2.moves.map((mv, i) => (
              <MoveRow
                key={i}
                move={mv}
                result={results2[i] ?? null}
                isActive={activeMove2 === i}
                onClick={() => onSelectMove2(activeMove2 === i ? null : i)}
              />
            ))}
          </div>
          <MoveStripPokemonCard poke={poke2} apiEntry={api2} align="right" />
        </div>
      </div>

      {/* Result bars — stacked on mobile, side-by-side on md+ */}
      <div className="flex flex-col md:grid md:grid-cols-[1fr_1px_1fr] border-t border-surface-700/40">
        <ResultBar
          result={activeMove1 !== null ? (results1[activeMove1] ?? null) : null}
          move={activeMove1 !== null ? poke1.moves[activeMove1] : null}
          isActive={activeMove1 !== null}
        />
        <div className="hidden md:block md:bg-surface-700/50 md:self-stretch" />
        <ResultBar
          result={activeMove2 !== null ? (results2[activeMove2] ?? null) : null}
          move={activeMove2 !== null ? poke2.moves[activeMove2] : null}
          isActive={activeMove2 !== null}
          reversed
        />
      </div>
    </div>
  )
}
