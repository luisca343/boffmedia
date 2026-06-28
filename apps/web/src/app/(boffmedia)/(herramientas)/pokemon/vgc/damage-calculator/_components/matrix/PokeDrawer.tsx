'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { CalcPokemon } from '../../_types/calculator'
import { PokemonPanel } from '../pokemon/PokemonPanel'

interface Props {
  poke: CalcPokemon
  side: 'atk' | 'def'
  useChampions: boolean
  onClose: () => void
  onChange: (patch: Partial<CalcPokemon>) => void
}

export function PokeDrawer({ poke, side, useChampions, onClose, onChange }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[360px] max-w-[92vw] z-50 flex flex-col bg-base shadow-2xl border-l border-edge/50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge/40 shrink-0">
          <span className="text-sm font-bold text-ink">
            {side === 'atk' ? '⚔ Configure Attacker' : '🛡 Configure Defender'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-[11px] text-ink-muted hover:text-ink transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PokemonPanel poke={poke} onChange={onChange} side={side} useChampions={useChampions} />
        </div>
      </div>
    </>
  )
}
