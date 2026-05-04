'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import type { CalcMove } from '../../_types/calculator'
import { MOVE_MAP, MOVE_NAMES } from '../../_hooks/usePokemonData'

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
    if (!query) return MOVE_NAMES.slice(0, 20)
    const q = query.toLowerCase()
    return MOVE_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 20)
  }, [query])

  function selectMove(name: string) {
    const data = MOVE_MAP.get(name)
    if (data) {
      onChange({
        name: data.name,
        bp: data.basePower,
        type: data.type,
        category: data.category,
      })
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
  const borderFocus = accentColor === 'primary' ? 'focus:border-primary-500' : 'focus:border-accent-500'

  return (
    <div className="bg-surface-900/60 border border-surface-700/60 rounded-lg p-2 flex flex-col gap-2">
      {/* Move name search */}
      <div ref={ref} className="relative">
        <div className="flex items-center gap-1">
          <input
            className={`flex-1 bg-surface-950/80 border border-surface-700 rounded px-2 py-1 text-xs font-semibold text-surface-200 placeholder:text-surface-600 focus:outline-none ${borderFocus} transition-colors`}
            value={query}
            placeholder={`Move ${index + 1}...`}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered[0]) selectMove(filtered[0])
              if (e.key === 'Escape') { setOpen(false); setQuery(move.name) }
            }}
          />
          {move.name && (
            <button
              type="button"
              onClick={clearMove}
              className="text-surface-600 hover:text-surface-400 text-xs px-1"
            >
              ×
            </button>
          )}
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-surface-900 border border-surface-700 rounded-lg shadow-2xl max-h-44 overflow-y-auto">
            {filtered.map((name) => {
              const data = MOVE_MAP.get(name)
              if (!data) return null
              const col = TYPE_COLORS[data.type] ?? '#9ca3af'
              return (
                <button
                  key={name}
                  type="button"
                  onMouseDown={() => selectMove(name)}
                  className="w-full flex items-center gap-2 px-2 py-1 text-left hover:bg-surface-800 transition-colors"
                >
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${col}22`, border: `1px solid ${col}44`, color: col }}
                  >
                    {data.type}
                  </span>
                  <span className="text-xs font-semibold text-surface-200 flex-1 truncate">{name}</span>
                  <span className="text-[10px] text-surface-500 font-mono">
                    {data.basePower > 0 ? data.basePower : '—'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* BP / Type / Category / Crit row */}
      {move.name && (
        <div className="flex items-center gap-1 flex-wrap">
          {/* BP override */}
          <input
            type="number"
            min={0}
            max={999}
            value={move.bp}
            onChange={(e) => onChange({ bp: Math.max(0, parseInt(e.target.value) || 0) })}
            className="w-12 bg-surface-950/80 border border-surface-700 rounded px-1 py-0.5 text-xs font-mono text-center text-surface-200 focus:outline-none focus:border-surface-600"
            title="Base Power"
          />
          {/* Type */}
          <select
            value={move.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="bg-surface-950/80 border border-surface-700 rounded px-1 py-0.5 text-[10px] font-bold focus:outline-none focus:border-surface-600 flex-1 min-w-0"
            style={{ color: typeColor }}
          >
            {Object.keys(TYPE_COLORS).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {/* Category */}
          <select
            value={move.category}
            onChange={(e) => onChange({ category: e.target.value as CalcMove['category'] })}
            className="bg-surface-950/80 border border-surface-700 rounded px-1 py-0.5 text-[10px] text-surface-300 focus:outline-none focus:border-surface-600"
          >
            <option value="Physical">Phys</option>
            <option value="Special">Spec</option>
            <option value="Status">Stat</option>
          </select>
          {/* Crit */}
          <button
            type="button"
            onClick={() => onChange({ crit: !move.crit })}
            className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
              move.crit
                ? 'bg-error-500/15 border-error-500/40 text-error-400'
                : 'bg-surface-800 border-surface-700 text-surface-500 hover:text-surface-400'
            }`}
          >
            Crit
          </button>
        </div>
      )}
    </div>
  )
}
