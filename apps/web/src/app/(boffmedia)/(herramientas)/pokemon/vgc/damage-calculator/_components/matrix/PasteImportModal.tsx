'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { CalcPokemon } from '../../_types/calculator'
import type { VgcPokemon } from '../../_hooks/useLegalPokemon'
import { toId } from '../../_hooks/useLegalPokemon'
import { useGameData } from '../../_hooks/usePokemonData'
import { defaultPokemon } from '../../_store/calculatorStore'
import { parseShowdownPaste } from '@/features/vgc-tracker/showdown-parse'

interface Props {
  regulationId: string
  maxSlots: number
  legalPokemon: VgcPokemon[]
  onImport: (parsed: CalcPokemon[]) => void
  onClose: () => void
}

export function PasteImportModal({ regulationId, maxSlots, legalPokemon, onImport, onClose }: Props) {
  const { moveMap, isLoaded: moveDataLoaded } = useGameData(regulationId)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const preview = useMemo(() => {
    if (!text.trim()) return []
    return parseShowdownPaste(text)
  }, [text])

  function handleImport() {
    if (!text.trim()) { setError('Paste a team in Showdown/PokéPaste format.'); return }
    if (!preview.length) { setError('No valid Pokémon found. Check the format.'); return }

    const result: CalcPokemon[] = preview.slice(0, maxSlots).map((slot) => {
      const match = legalPokemon.find((lp) => toId(lp.name) === toId(slot.speciesName))
      const speciesName = match?.name ?? slot.speciesName
      const firstAbility = match ? Object.values(match.abilities).filter(Boolean)[0] ?? '' : ''

      const moves = ([0, 1, 2, 3] as const).map((i) => {
        const moveName = slot.moves[i] ?? ''
        const data = moveMap.get(moveName)
        if (data) return { name: data.name, bp: data.basePower, type: data.type, category: data.category as 'Physical' | 'Special' | 'Status', crit: false }
        return { name: moveName, bp: 0, type: 'Normal', category: 'Physical' as const, crit: false }
      }) as CalcPokemon['moves']

      return { ...defaultPokemon(speciesName), ability: slot.ability ?? firstAbility, item: slot.item ?? 'None', nature: slot.nature ?? 'Hardy', moves }
    }).filter((p) => !!p.name)

    onImport(result)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-layer-1 border border-edge/60 rounded-xl shadow-2xl w-[520px] max-w-[92vw] flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">📋 Import PokéPaste</span>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-ink-muted leading-relaxed">
          Paste a team in <span className="text-ink font-mono">Showdown / PokéPaste</span> format.
        </p>

        <textarea
          className="w-full h-48 bg-base border border-edge rounded-lg px-3 py-2 text-xs font-mono text-ink placeholder:text-ink-dim focus:outline-none focus:border-primary resize-none"
          placeholder={'Miraidon @ Choice Specs\nAbility: Hadron Engine\nLevel: 50\nEVs: 4 HP / 252 SpA / 252 Spe\nTimid Nature\n- Electro Drift\n- Draco Meteor\n- Dazzling Gleam\n- Volt Switch'}
          value={text}
          onChange={(e) => { setText(e.target.value); setError('') }}
          autoFocus
        />

        {error && <p className="text-[11px] text-red-400 font-semibold">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-ink-dim">
            {!moveDataLoaded
              ? 'Loading move data…'
              : preview.length > 0
              ? `${Math.min(preview.length, maxSlots)} Pokémon ready to import`
              : `Up to ${maxSlots} slot${maxSlots !== 1 ? 's' : ''} available`}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-semibold border border-edge/60 text-ink-muted hover:text-ink transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleImport}
              disabled={!preview.length || maxSlots === 0 || !moveDataLoaded}
              className="px-3 py-1.5 rounded text-xs font-bold bg-primary/20 border border-primary/40 text-primary-hover hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Import ({Math.min(preview.length, maxSlots)} Pokémon)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
