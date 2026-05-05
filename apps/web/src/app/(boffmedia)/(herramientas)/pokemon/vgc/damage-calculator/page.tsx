'use client'

import { lazy, Suspense, useState } from 'react'
import { Swords, ArrowRight, ArrowLeft, Zap, Shield, BookmarkPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCalculatorStore } from './_store/calculatorStore'
import type { CalcTab } from './_types/calculator'
import { PokemonPanel } from './_components/pokemon/PokemonPanel'
import { FieldPanel } from './_components/field/FieldPanel'
import { MoveStrip } from './_components/moves/MoveStrip'
import { useChampionsRegulations } from '../meta/_hooks/useChampionsRegulations'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/primitives/select'

// Heavy tab views — code-split so they don't bloat the initial bundle
const MatrixView      = lazy(() => import('./_components/matrix/MatrixView').then((m) => ({ default: m.MatrixView })))
const SpeedView       = lazy(() => import('./_components/speed/SpeedView').then((m) => ({ default: m.SpeedView })))
const TypeCalcView    = lazy(() => import('./_components/typecalc/TypeCalcView').then((m) => ({ default: m.TypeCalcView })))
const SavedTeamsPanel = lazy(() => import('./_components/saved/SavedTeamsPanel').then((m) => ({ default: m.SavedTeamsPanel })))

function TabFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-primary-500/30 border-t-primary-400 animate-spin" />
    </div>
  )
}

type TabIcon = React.ComponentType<{ className?: string }>

const TAB_ICONS: Record<CalcTab, TabIcon> = {
  '1v1':       Swords,
  teamvsmany:  ArrowRight,
  manyvsteam:  ArrowLeft,
  speed:       Zap,
  typecalc:    Shield,
}

const TABS: CalcTab[] = ['1v1', 'teamvsmany', 'manyvsteam', 'speed', 'typecalc']

type MobilePanel = 'atk' | 'field' | 'def'

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
  const [savedOpen, setSavedOpen] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('atk')

  return (
    <div className="flex flex-col bg-surface-950" style={{ height: 'calc(100vh - 56px)' }}>
      {/* ── Header ── */}
      <header className="shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-surface-900/97 border-b border-surface-700/50">
        <div className="p-1.5 rounded-lg bg-primary-500/20 border border-primary-500/30 shrink-0">
          <Swords className="w-4 h-4 text-primary-400" />
        </div>
        <div className="min-w-0 hidden md:block mr-2">
          <h1 className="text-sm font-bold text-surface-50 leading-tight">{t('title')}</h1>
          <p className="text-[10px] text-surface-500 leading-tight">{t('subtitle')}</p>
        </div>

        {/* Tab bar — horizontally scrollable on small screens */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0 flex-1">
          {TABS.map((id) => {
            const Icon = TAB_ICONS[id]
            const isActive = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md text-xs font-semibold border whitespace-nowrap transition-all shrink-0 ${
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

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Regulation picker — hidden on xs, visible on sm+ */}
          {regulations.length > 0 && (
            <div className="hidden sm:block">
              <Select
                value={regulation}
                onValueChange={(val) => {
                  setRegulation(val)
                  setUseChampions(true)
                }}
              >
                <SelectTrigger className="h-7 text-xs bg-surface-800 border-surface-600 w-44">
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
            </div>
          )}
          {useChampions && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-500/15 border border-accent-500/30 text-accent-300 whitespace-nowrap">
              SP
            </span>
          )}
          <button
            type="button"
            onClick={() => setSavedOpen((v) => !v)}
            title={t('saved.title')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              savedOpen
                ? 'bg-primary-500/15 border-primary-500/35 text-primary-400'
                : 'bg-transparent border-transparent text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
            }`}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('saved.title')}</span>
          </button>
        </div>
      </header>

      {/* ── Tab content + sliding saved panel ── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">

          {/* ── 1v1 ── */}
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

              {/* Mobile panel switcher — hidden on md+ */}
              <div className="flex md:hidden shrink-0 border-b border-surface-700/40 bg-surface-900/90">
                {(['atk', 'field', 'def'] as const).map((p) => {
                  const label = p === 'atk' ? '⚔ Attacker' : p === 'field' ? '⚡ Field' : '🛡 Defender'
                  const active = mobilePanel === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMobilePanel(p)}
                      className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                        active
                          ? 'border-primary-500 text-primary-400 bg-primary-500/5'
                          : 'border-transparent text-surface-500 hover:text-surface-300'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Panels — single panel on mobile, 3-col grid on md+ */}
              <div className="flex-1 overflow-y-auto md:overflow-hidden md:grid md:grid-cols-[35vw_1fr_35vw]">
                <div className={`${mobilePanel !== 'atk' ? 'hidden md:block' : ''} md:overflow-y-auto border-r border-surface-700/30`}>
                  <PokemonPanel poke={poke1} onChange={setPoke1} side="atk" useChampions={useChampions} />
                </div>
                <div className={`${mobilePanel !== 'field' ? 'hidden md:block' : ''} md:overflow-y-auto`}>
                  <FieldPanel field={field} onFieldChange={setField} onAttackerSide={setAttackerSide} onDefenderSide={setDefenderSide} />
                </div>
                <div className={`${mobilePanel !== 'def' ? 'hidden md:block' : ''} md:overflow-y-auto border-l border-surface-700/30`}>
                  <PokemonPanel poke={poke2} onChange={setPoke2} side="def" useChampions={useChampions} />
                </div>
              </div>
            </>
          )}

          {/* ── Matrix ── */}
          {(activeTab === 'teamvsmany' || activeTab === 'manyvsteam') && (
            <Suspense fallback={<TabFallback />}>
              <MatrixView
                tab={activeTab}
                field={field}
                onFieldChange={setField}
                onAttackerSide={setAttackerSide}
                onDefenderSide={setDefenderSide}
                useChampions={useChampions}
              />
            </Suspense>
          )}

          {/* ── Speed ── */}
          {activeTab === 'speed' && (
            <Suspense fallback={<TabFallback />}>
              <SpeedView useChampions={useChampions} />
            </Suspense>
          )}

          {/* ── Type Calc ── */}
          {activeTab === 'typecalc' && (
            <Suspense fallback={<TabFallback />}>
              <TypeCalcView />
            </Suspense>
          )}
        </div>

        {/* Saved panel — fixed full-screen drawer on mobile, inline slide on md+ */}
        <div
          className={`fixed md:hidden right-0 z-50 w-full max-w-xs border-l border-surface-700/50 bg-surface-950 transition-transform duration-200 ${
            savedOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ top: '56px', bottom: 0 }}
        >
          <Suspense fallback={null}>
            <SavedTeamsPanel onClose={() => setSavedOpen(false)} />
          </Suspense>
        </div>
        <div
          className="hidden md:block shrink-0 border-l border-surface-700/50 overflow-hidden transition-[width] duration-200"
          style={{ width: savedOpen ? '320px' : '0px' }}
        >
          <div className="w-[320px] h-full">
            <Suspense fallback={null}>
              <SavedTeamsPanel onClose={() => setSavedOpen(false)} />
            </Suspense>
          </div>
        </div>
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
