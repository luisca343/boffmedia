'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCalculatorStore, defaultPokemon } from '../../_store/calculatorStore'
import type { CalcField, CalcPokemon, SideConditions } from '../../_types/calculator'
import { calcAllMoves } from '../../_lib/smogonAdapter'
import { useLegalPokemon } from '../../_hooks/useLegalPokemon'
import { CompactFieldBar } from './CompactFieldBar'
import { SlotPanel } from './SlotPanel'
import { PokeDrawer } from './PokeDrawer'
import { PasteImportModal } from './PasteImportModal'
import { MatrixTable, EmptyMatrix } from './MatrixTable'

interface Props {
  tab: 'teamvsmany' | 'manyvsteam'
  field: CalcField
  onFieldChange: (patch: Partial<CalcField>) => void
  onAttackerSide: (patch: Partial<SideConditions>) => void
  onDefenderSide: (patch: Partial<SideConditions>) => void
  useChampions: boolean
}

export function MatrixView({ tab, field, onFieldChange, onAttackerSide, onDefenderSide, useChampions }: Props) {
  const t = useTranslations('vgc.calc')
  const {
    regulation,
    team, many,
    addToTeam, removeFromTeam, updateTeamPokemon, setTeamFull,
    addToMany,  removeFromMany,  updateManyPokemon,  setManyFull,
  } = useCalculatorStore()

  const legalPokemon = useLegalPokemon(regulation)
  const isTeamVsMany = tab === 'teamvsmany'

  const attackers     = isTeamVsMany ? team : many
  const defenders     = isTeamVsMany ? many : team
  const attackerList  = isTeamVsMany ? 'team' : 'many' as const
  const defenderList  = isTeamVsMany ? 'many' : 'team' as const
  const attackerMax   = isTeamVsMany ? 6 : 12
  const defenderMax   = isTeamVsMany ? 12 : 6
  const attackerLabel = isTeamVsMany ? `⚔ ${t('matrix.teamLabel')}` : `⚔ ${t('matrix.manyLabel')}`
  const defenderLabel = isTeamVsMany ? `🛡 ${t('matrix.manyLabel')}` : `🛡 ${t('matrix.teamLabel')}`
  const cornerLabel   = isTeamVsMany ? t('matrix.atkDefCorner') : 'THREAT ↓ / TEAM →'
  const emptyIcon     = isTeamVsMany ? '⚔' : '🛡'

  const [drawer, setDrawer]           = useState<{ list: 'team' | 'many'; idx: number } | null>(null)
  const [pasteTarget, setPasteTarget] = useState<'team' | 'many' | null>(null)

  const drawerPoke = drawer ? (drawer.list === 'team' ? team : many)[drawer.idx] : null

  function getDrawerSide(list: 'team' | 'many'): 'atk' | 'def' {
    if (isTeamVsMany) return list === 'team' ? 'atk' : 'def'
    return list === 'many' ? 'atk' : 'def'
  }

  function handleAdd(list: 'team' | 'many') {
    const current  = list === 'team' ? team : many
    const maxSlots = list === 'team' ? 6 : 12
    if (current.length >= maxSlots) return
    const newIdx = current.length
    const poke = { ...defaultPokemon(), ability: '' }
    if (list === 'team') addToTeam(poke)
    else addToMany(poke)
    setDrawer({ list, idx: newIdx })
  }

  function handleRemove(list: 'team' | 'many', idx: number) {
    if (list === 'team') removeFromTeam(idx)
    else removeFromMany(idx)
    if (drawer && drawer.list === list && drawer.idx >= idx) setDrawer(null)
  }

  function handleDrawerChange(patch: Partial<CalcPokemon>) {
    if (!drawer) return
    if (drawer.list === 'team') updateTeamPokemon(drawer.idx, patch)
    else updateManyPokemon(drawer.idx, patch)
  }

  function handleImport(list: 'team' | 'many', parsed: CalcPokemon[]) {
    const maxSlots = list === 'team' ? 6 : 12
    const current  = list === 'team' ? team : many
    const combined = [...current, ...parsed].slice(0, maxSlots)
    if (list === 'team') setTeamFull(combined)
    else setManyFull(combined)
  }

  const matrix = useMemo(
    () => attackers.map((atk) => defenders.map((def) => calcAllMoves(atk, def, field, useChampions))),
    [attackers, defenders, field, useChampions],
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <CompactFieldBar
        field={field}
        onFieldChange={onFieldChange}
        onAttackerSide={onAttackerSide}
        onDefenderSide={onDefenderSide}
      />

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <SlotPanel
          label={attackerLabel} accent="rgb(251,146,60)"
          pokemons={attackers} maxSlots={attackerMax} border="left"
          legalPokemon={legalPokemon}
          onEdit={(idx) => setDrawer({ list: attackerList, idx })}
          onRemove={(idx) => handleRemove(attackerList, idx)}
          onAdd={() => handleAdd(attackerList)}
          onImport={() => setPasteTarget(attackerList)}
          className="w-full max-h-40 md:w-[240px] md:max-h-none"
        />

        <div className="flex-1 overflow-auto bg-surface-950 min-h-0">
          {attackers.length > 0 && defenders.length > 0 ? (
            <MatrixTable
              attackers={attackers} defenders={defenders}
              matrix={matrix} cornerLabel={cornerLabel}
              legalPokemon={legalPokemon}
            />
          ) : (
            <EmptyMatrix icon={emptyIcon} />
          )}
        </div>

        <SlotPanel
          label={defenderLabel} accent="rgb(192,132,252)"
          pokemons={defenders} maxSlots={defenderMax} border="right"
          legalPokemon={legalPokemon}
          onEdit={(idx) => setDrawer({ list: defenderList, idx })}
          onRemove={(idx) => handleRemove(defenderList, idx)}
          onAdd={() => handleAdd(defenderList)}
          onImport={() => setPasteTarget(defenderList)}
          className="w-full max-h-40 md:w-[240px] md:max-h-none"
        />
      </div>

      {drawer && drawerPoke && (
        <PokeDrawer
          poke={drawerPoke} side={getDrawerSide(drawer.list)}
          useChampions={useChampions}
          onClose={() => setDrawer(null)}
          onChange={handleDrawerChange}
        />
      )}

      {pasteTarget && (
        <PasteImportModal
          regulationId={regulation}
          maxSlots={pasteTarget === 'team' ? 6 - team.length : 12 - many.length}
          legalPokemon={legalPokemon}
          onImport={(parsed) => handleImport(pasteTarget, parsed)}
          onClose={() => setPasteTarget(null)}
        />
      )}
    </div>
  )
}
