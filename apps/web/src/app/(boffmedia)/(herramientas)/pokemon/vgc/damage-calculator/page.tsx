'use client'

import { Suspense } from 'react'
import { Swords } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCalculatorStore } from './_store/calculatorStore'
import { PokemonPanel } from './_components/pokemon/PokemonPanel'
import { FieldPanel } from './_components/field/FieldPanel'
import { MoveStrip } from './_components/moves/MoveStrip'

function DamageCalculatorContent() {
  const t = useTranslations('vgc.calc')

  const {
    poke1, poke2, field, useChampions,
    activeMove1, activeMove2,
    setPoke1, setPoke2, setField, setAttackerSide, setDefenderSide,
    setActiveMove1, setActiveMove2,
  } = useCalculatorStore()

  return (
    <div
      className="flex flex-col bg-surface-950"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-surface-900/97 border-b border-surface-700/50 z-10">
        <div className="p-1.5 rounded-lg bg-primary-500/20 border border-primary-500/30">
          <Swords className="w-4 h-4 text-primary-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-surface-50 leading-tight">{t('title')}</h1>
          <p className="text-[10px] text-surface-500 leading-tight">{t('subtitle')}</p>
        </div>
        {useChampions && (
          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded bg-accent-500/15 border border-accent-500/30 text-accent-300">
            Champions SP
          </span>
        )}
      </header>

      {/* Move strip (always visible) */}
      <MoveStrip
        poke1={poke1}
        poke2={poke2}
        field={field}
        useChampions={useChampions}
        activeMove1={activeMove1}
        activeMove2={activeMove2}
        onSelectMove1={setActiveMove1}
        onSelectMove2={setActiveMove2}
      />

      {/* Main 3-column layout */}
      <div className="flex-1 min-h-0 grid grid-cols-[35vw_1fr_35vw]">
        <PokemonPanel
          poke={poke1}
          onChange={setPoke1}
          side="atk"
          useChampions={useChampions}
        />
        <FieldPanel
          field={field}
          onFieldChange={setField}
          onAttackerSide={setAttackerSide}
          onDefenderSide={setDefenderSide}
        />
        <PokemonPanel
          poke={poke2}
          onChange={setPoke2}
          side="def"
          useChampions={useChampions}
        />
      </div>
    </div>
  )
}

export default function DamageCalculatorPage() {
  return (
    <Suspense>
      <DamageCalculatorContent />
    </Suspense>
  )
}
