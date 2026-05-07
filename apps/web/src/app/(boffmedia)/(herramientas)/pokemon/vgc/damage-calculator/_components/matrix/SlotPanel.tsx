'use client'

import { useTranslations } from 'next-intl'
import { ClipboardPaste, Plus } from 'lucide-react'
import type { CalcPokemon } from '../../_types/calculator'
import type { VgcPokemon } from '../../_hooks/useLegalPokemon'
import { getSpriteUrl, handleSpriteError } from '../../_lib/spriteUtils'
import { PokemonTypeIcon } from '@/components/shared/pokemon/PokemonTypeIcon'

// ─── SlotCard ─────────────────────────────────────────────────────────────────

function SlotCard({
  poke, idx, legalPokemon, onEdit, onRemove,
}: {
  poke: CalcPokemon
  idx: number
  legalPokemon: VgcPokemon[]
  onEdit: (idx: number) => void
  onRemove: (idx: number) => void
}) {
  const apiEntry = legalPokemon.find((p) => p.name === poke.name)
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 border-b border-surface-800/40 cursor-pointer hover:bg-surface-800/40 transition-colors group"
      onClick={() => onEdit(idx)}
    >
      <span className="text-[10px] font-bold text-surface-600 w-5 shrink-0">#{idx + 1}</span>
      <img
        src={getSpriteUrl(poke.name)}
        onError={handleSpriteError}
        width={36} height={36}
        className="object-contain shrink-0"
        style={{ imageRendering: 'pixelated' }}
        alt={poke.name}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-surface-200 truncate leading-tight">{poke.name}</div>
        {apiEntry && (
          <div className="flex gap-0.5 mt-0.5">
            {apiEntry.types.map((type) => (
              <PokemonTypeIcon key={type} type={type} size={14} />
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(idx) }}
        className="opacity-0 group-hover:opacity-100 text-surface-600 hover:text-red-400 transition-all shrink-0 text-base leading-none"
        aria-label="Remove"
      >
        ×
      </button>
    </div>
  )
}

// ─── SlotPanel ────────────────────────────────────────────────────────────────

interface Props {
  label: string
  accent: string
  pokemons: CalcPokemon[]
  maxSlots: number
  border: 'left' | 'right'
  legalPokemon: VgcPokemon[]
  onEdit: (idx: number) => void
  onRemove: (idx: number) => void
  onAdd: () => void
  onImport: () => void
  className?: string
}

export function SlotPanel({
  label, accent, pokemons, maxSlots, border,
  legalPokemon, onEdit, onRemove, onAdd, onImport, className,
}: Props) {
  const t = useTranslations('vgc.calc.matrixExtras')
  const borderClass = border === 'left'
    ? 'border-b md:border-b-0 md:border-r border-surface-700/40'
    : 'border-t md:border-t-0 md:border-l border-surface-700/40'

  return (
    <div className={`shrink-0 flex flex-col bg-surface-950 ${borderClass} ${className ?? 'w-[240px]'}`}>
      <div className="px-2.5 py-2 border-b border-surface-700/40 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: accent }}>
          {label}
        </span>
        <button
          type="button"
          onClick={onImport}
          className="flex items-center gap-1 text-[9px] font-semibold text-surface-500 hover:text-surface-200 transition-colors border border-surface-700/50 rounded px-1.5 py-0.5 hover:border-surface-600"
        >
          <ClipboardPaste className="w-2.5 h-2.5" />
          {t('importLabel')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {pokemons.length === 0 && (
          <p className="text-center text-[10px] text-surface-700 py-6 px-2">{t('noPokemon')}</p>
        )}
        {pokemons.map((p, idx) => (
          <SlotCard
            key={idx} poke={p} idx={idx}
            legalPokemon={legalPokemon}
            onEdit={onEdit} onRemove={onRemove}
          />
        ))}
      </div>

      {pokemons.length < maxSlots && (
        <div className="p-2 border-t border-surface-700/40 shrink-0">
          <button
            type="button"
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-dashed border-surface-700/70 text-[10px] font-semibold text-surface-600 hover:border-primary-500/50 hover:text-primary-400 transition-all"
          >
            <Plus className="w-3 h-3" />
            {t('addPokemon')}
          </button>
        </div>
      )}
    </div>
  )
}
