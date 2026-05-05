'use client'

import { Suspense } from 'react'
import { Swords, ArrowRight, ArrowLeft, Zap, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCalculatorStore } from './_store/calculatorStore'
import type { CalcTab } from './_types/calculator'
import { PokemonPanel } from './_components/pokemon/PokemonPanel'
import { FieldPanel } from './_components/field/FieldPanel'
import { MoveStrip } from './_components/moves/MoveStrip'
import { MatrixView } from './_components/matrix/MatrixView'
import { SpeedView } from './_components/speed/SpeedView'
import { TypeCalcView } from './_components/typecalc/TypeCalcView'
import { useChampionsRegulations } from '../meta/_hooks/useChampionsRegulations'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/primitives/select'

type TabIcon = React.ComponentType<{ className?: string }>

const TAB_ICONS: Record<CalcTab, TabIcon> = {
  '1v1':       Swords,
  teamvsmany:  ArrowRight,
  manyvsteam:  ArrowLeft,
  speed:       Zap,
  typecalc:    Shield,
}

const TABS: CalcTab[] = ['1v1', 'teamvsmany', 'manyvsteam', 'speed', 'typecalc']

function DamageCalculatorContent() {
  const t = useTranslations('vgc.calc')

  const {
    poke1, poke2, field, useChampions, regulation,
    activeTab, activeMove1, activeMove2,
    setPoke1, setPoke2, setField, setAttackerSide, setDefenderSide,
    setActiveTab, setActiveMove1, setActiveMove2,
    setRegulation, setUseChampions,
  } = useCalculatorStore()

  const regulations = useChampionsRegulations()

  return (
    <div className="flex flex-col bg-surface-950" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Sticky header with tab navigation */}
      <header className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-surface-900/97 border-b border-surface-700/50">
        <div className="p-1.5 rounded-lg bg-primary-500/20 border border-primary-500/30 shrink-0">
          <Swords className="w-4 h-4 text-primary-400" />
        </div>
        <div className="min-w-0 hidden md:block mr-2">
          <h1 className="text-sm font-bold text-surface-50 leading-tight">{t('title')}</h1>
          <p className="text-[10px] text-surface-500 leading-tight">{t('subtitle')}</p>
        </div>

        {/* Tab bar */}
        <nav className="flex items-center gap-1">
          {TABS.map((id) => {
            const Icon = TAB_ICONS[id]
            const isActive = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                  isActive
                    ? 'bg-primary-500/15 border-primary-500/35 text-primary-400'
                    : 'bg-transparent border-transparent text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">{t(`tabs.${id}`)}</span>
              </button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {regulations.length > 0 && (
            <Select
              value={regulation}
              onValueChange={(val) => {
                setRegulation(val)
                setUseChampions(true)
              }}
            >
              <SelectTrigger className="h-7 text-xs bg-surface-800 border-surface-600 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regulations.map((reg) => (
                  <SelectItem key={reg.formatId} value={reg.formatId} className="text-xs">
                    {reg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {useChampions && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-500/15 border border-accent-500/30 text-accent-300 whitespace-nowrap">
              SP
            </span>
          )}
        </div>
      </header>

      {/* Tab content fills remaining height */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === '1v1' && (
          <>
            <div className="shrink-0">
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
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-[35vw_1fr_35vw]">
              <div className="border-r border-surface-700/30">
                <PokemonPanel
                  poke={poke1}
                  onChange={setPoke1}
                  side="atk"
                  useChampions={useChampions}
                />
              </div>
              <div>
                <FieldPanel
                  field={field}
                  onFieldChange={setField}
                  onAttackerSide={setAttackerSide}
                  onDefenderSide={setDefenderSide}
                />
              </div>
              <div className="border-l border-surface-700/30">
                <PokemonPanel
                  poke={poke2}
                  onChange={setPoke2}
                  side="def"
                  useChampions={useChampions}
                />
              </div>
            </div>
          </>
        )}

        {(activeTab === 'teamvsmany' || activeTab === 'manyvsteam') && (
          <MatrixView
            tab={activeTab}
            field={field}
            onFieldChange={setField}
            onAttackerSide={setAttackerSide}
            onDefenderSide={setDefenderSide}
            useChampions={useChampions}
          />
        )}

        {activeTab === 'speed' && (
          <SpeedView useChampions={useChampions} />
        )}

        {activeTab === 'typecalc' && (
          <TypeCalcView />
        )}
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
