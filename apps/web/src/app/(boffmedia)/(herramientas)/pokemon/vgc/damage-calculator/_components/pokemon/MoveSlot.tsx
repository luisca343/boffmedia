'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState, useRef, useEffect } from 'react'
import type { CalcMove } from '../../_types/calculator'
import { useGameData } from '../../_hooks/usePokemonData'
import { useCalculatorStore } from '../../_store/calculatorStore'

interface Props {
  move: CalcMove
  index: number
  onChange: (patch: Partial<CalcMove>) => void
  accentColor?: 'primary' | 'accent'
}

const TYPE_COLORS: Record<string, string> = {
  Normal: '#a8a878', Fire: '#f08030', Water: '#6890f0', Electric: '#f8d030',
  Grass: '#78c850', Ice: '#98d8d8', Fighting: '#c03028', Poison: '#a040a0',
  Ground: '#e0c068', Flying: '#a890f0', Psychic: '#f85888', Bug: '#a8b820',
  Rock: '#b8a038', Ghost: '#705898', Dragon: '#7038f8', Dark: '#705848',
  Steel: '#b8b8d0', Fairy: '#ee99ac', Stellar: '#40b8ff',
}

export function MoveSlot({ move, index, onChange, accentColor = 'primary' }: Props) {
  const t = useTranslations('vgc.calc.panel')
  const { regulation } = useCalculatorStore()
  const { moveMap, moveNames, isLoaded } = useGameData(regulation)
  const [query, setQuery] = useState(move.name)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(move.name) }, [move.name])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(move.name)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [move.name])

  const filtered = useMemo(() => {
    if (!query) return moveNames.slice(0, 20)
    const q = query.toLowerCase()
    return moveNames.filter((n) => n.toLowerCase().includes(q)).slice(0, 20)
  }, [query, moveNames])

  function selectMove(name: string) {
    const data = moveMap.get(name)
    if (data) {
      onChange({ name: data.name, bp: data.basePower, type: data.type, category: data.category })
    } else {
      onChange({ name, bp: 0, type: 'Normal', category: 'Physical' })
    }
    setQuery(name)
    setOpen(false)
  }

  function clearMove() {
    onChange({ name: '', bp: 0, type: 'Normal', category: 'Physical', crit: false })
    setQuery('')
  }

  const typeColor = TYPE_COLORS[move.type] ?? '#9ca3af'
  const borderFocus = accentColor === 'primary' ? 'focus:border-primary' : 'focus:border-secondary'
  const ctrlCls = 'bg-base/80 border border-edge/60 rounded px-1 py-1 text-xs focus:outline-none focus:border-edge'

  return (
    <div className="flex items-center gap-1">
      {/* Move name search */}
      <div ref={ref} className="relative flex-1 min-w-0">
        <input
          className={`w-full bg-base/80 border border-edge/60 rounded px-2 py-1 text-xs font-semibold text-ink placeholder:text-ink-dim focus:outline-none ${borderFocus} transition-colors`}
          value={query}
          placeholder={t('movePlaceholder', { n: index + 1 })}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered[0]) selectMove(filtered[0])
            if (e.key === 'Escape') { setOpen(false); setQuery(move.name) }
          }}
        />

        {open && !isLoaded && (
          <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-layer-1 border border-edge rounded-lg shadow-2xl px-3 py-2">
            <span className="text-[11px] text-ink-muted italic">{t('loadingMoves')}</span>
          </div>
        )}

        {open && isLoaded && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-layer-1 border border-edge rounded-lg shadow-2xl max-h-44 overflow-y-auto">
            {filtered.map((name) => {
              const data = moveMap.get(name)
              if (!data) return null
              const col = TYPE_COLORS[data.type] ?? '#9ca3af'
              return (
                <button
                  key={name}
                  type="button"
                  onMouseDown={() => selectMove(name)}
                  className="w-full flex items-center gap-2 px-2 py-1 text-left hover:bg-layer-2 transition-colors"
                >
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${col}22`, border: `1px solid ${col}44`, color: col }}
                  >
                    {data.type}
                  </span>
                  <span className="text-xs font-semibold text-ink flex-1 truncate">{name}</span>
                  <span className="text-[10px] text-ink-muted font-mono">
                    {data.basePower > 0 ? data.basePower : '—'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* BP */}
      <input
        type="number"
        min={0}
        max={999}
        value={move.bp}
        onChange={(e) => onChange({ bp: Math.max(0, parseInt(e.target.value) || 0) })}
        className={`w-12 font-mono text-center text-ink ${ctrlCls}`}
        title={t('basePower')}
      />

      {/* Type */}
      <select
        value={move.type}
        onChange={(e) => onChange({ type: e.target.value })}
        className={`w-[84px] font-bold text-[10px] ${ctrlCls}`}
        style={{ color: typeColor }}
      >
        {Object.keys(TYPE_COLORS).map((tp) => (
          <option key={tp} value={tp}>{tp}</option>
        ))}
      </select>

      {/* Category */}
      <select
        value={move.category}
        onChange={(e) => onChange({ category: e.target.value as CalcMove['category'] })}
        className={`w-24 text-[10px] text-ink ${ctrlCls}`}
      >
        <option value="Physical">{t('categoryPhysical')}</option>
        <option value="Special">{t('categorySpecial')}</option>
        <option value="Status">{t('categoryStatus')}</option>
      </select>

      {/* Crit */}
      <button
        type="button"
        onClick={() => onChange({ crit: !move.crit })}
        title="Critical hit"
        className={`w-5 h-[26px] flex items-center justify-center rounded border text-[9px] font-bold transition-all ${
          move.crit
            ? 'bg-danger/15 border-danger-border/40 text-danger-hover'
            : 'bg-layer-2 border-edge text-ink-muted hover:text-ink-muted'
        }`}
      >
        C
      </button>

      {/* Clear / spacer */}
      {move.name ? (
        <button
          type="button"
          onClick={clearMove}
          className="w-3 text-ink-dim hover:text-ink-muted text-xs text-center leading-none"
        >
          ×
        </button>
      ) : (
        <span className="w-3" />
      )}
    </div>
  )
}
