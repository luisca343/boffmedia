'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Plus, ClipboardPaste } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  useCalculatorStore,
  defaultPokemon,
} from '../../_store/calculatorStore'
import type {
  CalcField,
  CalcPokemon,
  DamageResult,
  SideConditions,
} from '../../_types/calculator'
import { calcAllMoves } from '../../_lib/smogonAdapter'
import { parseShowdownPaste, isValidPaste } from '@/features/vgc-tracker/showdown-parse'
import { useLegalPokemon, toId } from '../../_hooks/useLegalPokemon'
import { useGameData } from '../../_hooks/usePokemonData'
import type { VgcPokemon } from '../../_hooks/useLegalPokemon'
import { getSpriteUrl, handleSpriteError } from '../../_lib/spriteUtils'
import { PokemonTypeIcon } from '@/components/shared/pokemon/PokemonTypeIcon'
import { PokemonPanel } from '../pokemon/PokemonPanel'

interface Props {
  tab: 'teamvsmany' | 'manyvsteam'
  field: CalcField
  onFieldChange: (patch: Partial<CalcField>) => void
  onAttackerSide: (patch: Partial<SideConditions>) => void
  onDefenderSide: (patch: Partial<SideConditions>) => void
  useChampions: boolean
}

// ─── Compact Field Bar ────────────────────────────────────────────────────────

type PillColor = 'orange' | 'cyan' | 'violet' | 'lime'

const ACTIVE: Record<PillColor, string> = {
  orange: 'bg-primary-500/15 border-primary-500/35 text-primary-400',
  cyan:   'bg-cyan-500/12 border-cyan-400/35 text-cyan-300',
  violet: 'bg-accent-500/15 border-accent-500/35 text-accent-300',
  lime:   'bg-lime-500/12 border-lime-500/35 text-lime-400',
}
const IDLE = 'bg-surface-800/50 border-surface-700/50 text-surface-500 hover:text-surface-300'

function FieldPill({
  label, active, color = 'orange', onClick,
}: { label: string; active: boolean; color?: PillColor; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all whitespace-nowrap ${
        active ? ACTIVE[color] : IDLE
      }`}
    >
      {label}
    </button>
  )
}

function CompactFieldBar({
  field, onFieldChange, onAttackerSide, onDefenderSide,
}: {
  field: CalcField
  onFieldChange: (patch: Partial<CalcField>) => void
  onAttackerSide: (patch: Partial<SideConditions>) => void
  onDefenderSide: (patch: Partial<SideConditions>) => void
}) {
  return (
    <div className="shrink-0 border-b border-surface-700/40 bg-surface-900/90 px-3 py-1.5 flex flex-wrap items-center gap-1.5">
      {(['Singles', 'Doubles'] as const).map((f) => (
        <FieldPill key={f} label={f} active={field.format === f} onClick={() => onFieldChange({ format: f })} />
      ))}
      <span className="w-px h-3 bg-surface-700/60 mx-0.5" />
      {(['Sun', 'Rain', 'Sand', 'Snow', 'Harsh Sunshine', 'Heavy Rain'] as const).map((w) => (
        <FieldPill key={w} label={w} active={field.weather === w}
          color={w === 'Rain' || w === 'Heavy Rain' ? 'cyan' : 'orange'}
          onClick={() => onFieldChange({ weather: field.weather === w ? 'None' : w })}
        />
      ))}
      <span className="w-px h-3 bg-surface-700/60 mx-0.5" />
      {(['Electric', 'Grassy', 'Psychic', 'Misty'] as const).map((t) => (
        <FieldPill key={t} label={t} active={field.terrain === t}
          color={t === 'Grassy' ? 'lime' : t === 'Psychic' || t === 'Misty' ? 'violet' : 'orange'}
          onClick={() => onFieldChange({ terrain: field.terrain === t ? 'None' : t })}
        />
      ))}
      <span className="w-px h-3 bg-surface-700/60 mx-0.5" />
      <FieldPill label="TR" active={field.trickRoom} color="violet"
        onClick={() => onFieldChange({ trickRoom: !field.trickRoom })} />
      <FieldPill label="Gravity" active={field.gravity} color="violet"
        onClick={() => onFieldChange({ gravity: !field.gravity })} />
      <span className="w-px h-3 bg-surface-700/60 mx-0.5" />
      <FieldPill label="Atk TW" active={field.attackerSide.tailwind} color="cyan"
        onClick={() => onAttackerSide({ tailwind: !field.attackerSide.tailwind })} />
      <FieldPill label="Atk HH" active={field.attackerSide.helpingHand} color="lime"
        onClick={() => onAttackerSide({ helpingHand: !field.attackerSide.helpingHand })} />
      <FieldPill label="Def TW" active={field.defenderSide.tailwind} color="cyan"
        onClick={() => onDefenderSide({ tailwind: !field.defenderSide.tailwind })} />
      <FieldPill label="Def Reflect" active={field.defenderSide.reflect}
        onClick={() => onDefenderSide({ reflect: !field.defenderSide.reflect })} />
      <FieldPill label="Def Light Screen" active={field.defenderSide.lightScreen} color="cyan"
        onClick={() => onDefenderSide({ lightScreen: !field.defenderSide.lightScreen })} />
    </div>
  )
}

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

// ─── PasteImportModal ─────────────────────────────────────────────────────────

function PasteImportModal({
  regulationId,
  maxSlots,
  legalPokemon,
  onImport,
  onClose,
}: {
  regulationId: string
  maxSlots: number
  legalPokemon: VgcPokemon[]
  onImport: (parsed: CalcPokemon[]) => void
  onClose: () => void
}) {
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

      return {
        ...defaultPokemon(speciesName),
        name: speciesName,
        ability: slot.ability ?? firstAbility,
        item: slot.item ?? 'None',
        nature: slot.nature ?? 'Hardy',
        moves,
      }
    }).filter((p) => !!p.name)

    onImport(result)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-900 border border-surface-700/60 rounded-xl shadow-2xl w-[520px] max-w-[92vw] flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-surface-100">📋 Import PokéPaste</span>
          <button type="button" onClick={onClose} className="text-surface-500 hover:text-surface-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-surface-500 leading-relaxed">
          Paste a team in <span className="text-surface-300 font-mono">Showdown / PokéPaste</span> format.
          You can import a single Pokémon or an entire team.
        </p>

        <textarea
          className="w-full h-48 bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-xs font-mono text-surface-200 placeholder:text-surface-700 focus:outline-none focus:border-primary-500 resize-none"
          placeholder={
            'Miraidon @ Choice Specs\nAbility: Hadron Engine\nLevel: 50\nEVs: 4 HP / 252 SpA / 252 Spe\nTimid Nature\n- Electro Drift\n- Draco Meteor\n- Dazzling Gleam\n- Volt Switch'
          }
          value={text}
          onChange={(e) => { setText(e.target.value); setError('') }}
          autoFocus
        />

        {error && (
          <p className="text-[11px] text-red-400 font-semibold">{error}</p>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-surface-600">
            {!moveDataLoaded
              ? 'Loading move data…'
              : preview.length > 0
              ? `${Math.min(preview.length, maxSlots)} Pokémon ready to import`
              : maxSlots > 0
              ? `Up to ${maxSlots} slot${maxSlots !== 1 ? 's' : ''} available`
              : 'No slots available'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-semibold border border-surface-700/60 text-surface-400 hover:text-surface-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!preview.length || maxSlots === 0 || !moveDataLoaded}
              className="px-3 py-1.5 rounded text-xs font-bold bg-primary-500/20 border border-primary-500/40 text-primary-300 hover:bg-primary-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Import ({Math.min(preview.length, maxSlots)} Pokémon)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PokeDrawer ───────────────────────────────────────────────────────────────

function PokeDrawer({
  poke,
  side,
  useChampions,
  onClose,
  onChange,
}: {
  poke: CalcPokemon
  side: 'atk' | 'def'
  useChampions: boolean
  onClose: () => void
  onChange: (patch: Partial<CalcPokemon>) => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-[360px] max-w-[92vw] z-50 flex flex-col bg-surface-950 shadow-2xl border-l border-surface-700/50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/40 shrink-0">
          <span className="text-sm font-bold text-surface-100">
            {side === 'atk' ? '⚔ Configure Attacker' : '🛡 Configure Defender'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-[11px] text-surface-500 hover:text-surface-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PokemonPanel
            poke={poke}
            onChange={onChange}
            side={side}
            useChampions={useChampions}
          />
        </div>
      </div>
    </>
  )
}

// ─── Side Panel ───────────────────────────────────────────────────────────────

function SlotPanel({
  label,
  accent,
  pokemons,
  maxSlots,
  border,
  legalPokemon,
  onEdit,
  onRemove,
  onAdd,
  onImport,
  className,
}: {
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
}) {
  const borderClass = border === 'left'
    ? 'border-b md:border-b-0 md:border-r border-surface-700/40'
    : 'border-t md:border-t-0 md:border-l border-surface-700/40'

  return (
    <div className={`shrink-0 flex flex-col bg-surface-950 ${borderClass} ${className ?? 'w-[200px]'}`}>
      {/* Header */}
      <div className="px-2.5 py-2 border-b border-surface-700/40 flex items-center justify-between shrink-0">
        <span
          className="text-[10px] font-black uppercase tracking-wider"
          style={{ color: accent }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={onImport}
          className="flex items-center gap-1 text-[9px] font-semibold text-surface-500 hover:text-surface-200 transition-colors border border-surface-700/50 rounded px-1.5 py-0.5 hover:border-surface-600"
        >
          <ClipboardPaste className="w-2.5 h-2.5" />
          Import
        </button>
      </div>

      {/* Pokémon list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {pokemons.length === 0 && (
          <p className="text-center text-[10px] text-surface-700 py-6 px-2">
            No Pokémon added
          </p>
        )}
        {pokemons.map((p, idx) => (
          <SlotCard key={idx} poke={p} idx={idx} legalPokemon={legalPokemon} onEdit={onEdit} onRemove={onRemove} />
        ))}
      </div>

      {/* Add button */}
      {pokemons.length < maxSlots && (
        <div className="p-2 border-t border-surface-700/40 shrink-0">
          <button
            type="button"
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-dashed border-surface-700/70 text-[10px] font-semibold text-surface-600 hover:border-primary-500/50 hover:text-primary-400 transition-all"
          >
            <Plus className="w-3 h-3" />
            Add Pokémon
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Matrix Table ─────────────────────────────────────────────────────────────

function getMoveRowStyle(res: DamageResult | null): { bg: string; color: string } {
  if (!res) return { bg: 'transparent', color: 'rgb(51,65,85)' }
  const ohko  = res.minPct >= 100
  const g2hko = !ohko && res.minPct * 2 >= 100
  const p2hko = !ohko && !g2hko && res.maxPct * 2 >= 100
  if (ohko)  return { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' }
  if (g2hko) return { bg: 'rgba(249,115,22,0.10)', color: '#f97316' }
  if (p2hko) return { bg: 'rgba(234,179,8,0.08)',  color: '#eab308' }
  return { bg: 'transparent', color: 'rgb(148,163,184)' }
}

function getKOLabel(res: DamageResult): string | null {
  if (res.minPct >= 100)     return 'OHKO'
  if (res.minPct * 2 >= 100) return '2HKO'
  if (res.maxPct * 2 >= 100) return '2HKO?'
  return null
}

interface MatrixTableProps {
  attackers: CalcPokemon[]
  defenders: CalcPokemon[]
  matrix: (DamageResult | null)[][][]
  cornerLabel: string
  legalPokemon: VgcPokemon[]
}

function MatrixTable({ attackers, defenders, matrix, cornerLabel, legalPokemon }: MatrixTableProps) {
  return (
    <table className="border-collapse text-sm">
      <thead>
        <tr>
          <th className="sticky left-0 top-0 z-30 bg-surface-900 border-b border-r border-surface-700/40 w-52 min-w-[208px] p-2">
            <span className="text-[10px] text-surface-600 uppercase tracking-wider">{cornerLabel}</span>
          </th>
          {defenders.map((def) => {
            const defEntry = legalPokemon.find((p) => p.name === def.name)
            return (
              <th
                key={def.name}
                className="sticky top-0 z-20 min-w-[110px] bg-surface-900 border-b border-r border-surface-700/40 px-2 py-1.5 text-center"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <img
                    src={getSpriteUrl(def.name)}
                    onError={handleSpriteError}
                    className="w-10 h-10 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                    alt={def.name}
                  />
                  <span className="font-bold text-xs text-surface-200 leading-tight max-w-[96px] truncate">{def.name}</span>
                  {defEntry && (
                    <div className="flex gap-0.5">
                      {defEntry.types.map((type) => (
                        <PokemonTypeIcon key={type} type={type} size={16} />
                      ))}
                    </div>
                  )}
                </div>
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {attackers.map((atk, atkIdx) => {
          const atkEntry = legalPokemon.find((p) => p.name === atk.name)
          return (
            <tr key={`${atk.name}-${atkIdx}`} className="border-b border-surface-800/40">
              <td className="sticky left-0 z-10 bg-surface-950 border-r border-surface-700/40 w-52 min-w-[208px] align-top p-0">
                <div className="flex items-center gap-2 h-[56px] px-2 border-b border-surface-800/20 overflow-hidden">
                  <img
                    src={getSpriteUrl(atk.name)}
                    onError={handleSpriteError}
                    className="w-8 h-8 object-contain shrink-0"
                    style={{ imageRendering: 'pixelated' }}
                    alt={atk.name}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-surface-200 truncate leading-tight">{atk.name}</div>
                    {atkEntry && (
                      <div className="flex gap-0.5 mt-0.5">
                        {(atkEntry.types).map((type) => (
                          <PokemonTypeIcon key={type} type={type} size={16} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {atk.moves.map((move, mi) => (
                  <div
                    key={mi}
                    className="h-[28px] flex items-center text-[11px] text-surface-400 truncate px-2 leading-tight border-b border-surface-800/10 last:border-b-0"
                  >
                    {move.name || <span className="text-surface-700">—</span>}
                  </div>
                ))}
              </td>
              {defenders.map((def, defIdx) => {
                const results = matrix[atkIdx]?.[defIdx] ?? []
                return (
                  <td key={`${def.name}-${defIdx}`} className="border-r border-surface-800/30 align-top p-0">
                    <div className="h-[56px] border-b border-surface-800/20" />
                    {results.map((res, mi) => {
                      const { bg, color } = getMoveRowStyle(res)
                      const koLabel = res ? getKOLabel(res) : null
                      return (
                        <div
                          key={mi}
                          className="h-[28px] flex flex-col items-center justify-center px-1.5 border-b border-surface-800/10 last:border-b-0"
                          style={{ background: bg }}
                        >
                          {res ? (
                            <>
                              <span className="font-mono font-bold text-xs whitespace-nowrap" style={{ color }}>
                                {res.minPct.toFixed(0)}–{res.maxPct.toFixed(0)}%
                              </span>
                              {koLabel && (
                                <span className="text-[9px] font-black leading-none" style={{ color }}>
                                  {koLabel}
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ color: 'rgb(51,65,85)', fontSize: 10 }}>—</span>
                          )}
                        </div>
                      )
                    })}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ─── Empty Matrix ──────────────────────────────────────────────────────────────

function EmptyMatrix({ icon }: { icon: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
      <div className="text-4xl opacity-10">{icon}</div>
      <p className="text-surface-600 text-xs">Add Pokémon on both sides to see the damage matrix</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MatrixView({
  tab,
  field,
  onFieldChange,
  onAttackerSide,
  onDefenderSide,
  useChampions,
}: Props) {
  const t = useTranslations('vgc.calc')
  const {
    regulation,
    team, many,
    addToTeam, removeFromTeam, updateTeamPokemon, setTeamFull,
    addToMany,  removeFromMany,  updateManyPokemon,  setManyFull,
  } = useCalculatorStore()

  const legalPokemon = useLegalPokemon(regulation)

  const isTeamVsMany = tab === 'teamvsmany'

  // Attacker / defender mapping based on tab
  const attackers      = isTeamVsMany ? team : many
  const defenders      = isTeamVsMany ? many : team
  const attackerList   = isTeamVsMany ? 'team' : 'many'
  const defenderList   = isTeamVsMany ? 'many' : 'team'
  const attackerMax    = isTeamVsMany ? 6 : 12
  const defenderMax    = isTeamVsMany ? 12 : 6
  const attackerLabel  = isTeamVsMany ? `⚔ ${t('matrix.teamLabel')}` : `⚔ ${t('matrix.manyLabel')}`
  const defenderLabel  = isTeamVsMany ? `🛡 ${t('matrix.manyLabel')}` : `🛡 ${t('matrix.teamLabel')}`
  const cornerLabel    = isTeamVsMany ? 'ATK ↓ / DEF →' : 'THREAT ↓ / TEAM →'
  const emptyIcon      = isTeamVsMany ? '⚔' : '🛡'

  // Drawer: which Pokémon is being edited
  const [drawer, setDrawer] = useState<{ list: 'team' | 'many'; idx: number } | null>(null)
  // Paste modal: which list is receiving an import
  const [pasteTarget, setPasteTarget] = useState<'team' | 'many' | null>(null)

  // Resolve the drawn Pokémon from live store state
  const drawerPoke = drawer ? (drawer.list === 'team' ? team : many)[drawer.idx] : null

  // Side for the drawer (atk/def depends on tab)
  function getDrawerSide(list: 'team' | 'many'): 'atk' | 'def' {
    if (isTeamVsMany) return list === 'team' ? 'atk' : 'def'
    return list === 'many' ? 'atk' : 'def'
  }

  // Add a default Pokémon and immediately open the drawer
  function handleAdd(list: 'team' | 'many') {
    const currentList = list === 'team' ? team : many
    const maxSlots    = list === 'team' ? 6 : 12
    if (currentList.length >= maxSlots) return

    const newIdx = currentList.length
    const poke   = { ...defaultPokemon(), ability: '' }

    if (list === 'team') addToTeam(poke)
    else addToMany(poke)

    setDrawer({ list, idx: newIdx })
  }

  function handleRemove(list: 'team' | 'many', idx: number) {
    if (list === 'team') removeFromTeam(idx)
    else removeFromMany(idx)
    // Close drawer if it was for this or a later slot
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

  // Precompute full damage matrix
  const matrix = useMemo(
    () => attackers.map((atk) => defenders.map((def) => calcAllMoves(atk, def, field, useChampions))),
    [attackers, defenders, field, useChampions],
  )

  const hasData = attackers.length > 0 && defenders.length > 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <CompactFieldBar
        field={field}
        onFieldChange={onFieldChange}
        onAttackerSide={onAttackerSide}
        onDefenderSide={onDefenderSide}
      />

      {/* Three-column layout: attackers | matrix | defenders */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left: Attacker panel */}
        <SlotPanel
          label={attackerLabel}
          accent="rgb(251,146,60)"
          pokemons={attackers}
          maxSlots={attackerMax}
          border="left"
          legalPokemon={legalPokemon}
          onEdit={(idx) => setDrawer({ list: attackerList, idx })}
          onRemove={(idx) => handleRemove(attackerList, idx)}
          onAdd={() => handleAdd(attackerList)}
          onImport={() => setPasteTarget(attackerList)}
          className="w-full max-h-40 md:w-[240px] md:max-h-none"
        />

        {/* Center: Matrix table */}
        <div className="flex-1 overflow-auto bg-surface-950 min-h-0">
          {hasData ? (
            <MatrixTable
              attackers={attackers}
              defenders={defenders}
              matrix={matrix}
              cornerLabel={cornerLabel}
              legalPokemon={legalPokemon}
            />
          ) : (
            <EmptyMatrix icon={emptyIcon} />
          )}
        </div>

        {/* Right: Defender panel */}
        <SlotPanel
          label={defenderLabel}
          accent="rgb(192,132,252)"
          pokemons={defenders}
          maxSlots={defenderMax}
          border="right"
          legalPokemon={legalPokemon}
          onEdit={(idx) => setDrawer({ list: defenderList, idx })}
          onRemove={(idx) => handleRemove(defenderList, idx)}
          onAdd={() => handleAdd(defenderList)}
          onImport={() => setPasteTarget(defenderList)}
          className="w-full max-h-40 md:w-[240px] md:max-h-none"
        />
      </div>

      {/* PokeDrawer — slides in from the right */}
      {drawer && drawerPoke && (
        <PokeDrawer
          poke={drawerPoke}
          side={getDrawerSide(drawer.list)}
          useChampions={useChampions}
          onClose={() => setDrawer(null)}
          onChange={handleDrawerChange}
        />
      )}

      {/* PasteImportModal */}
      {pasteTarget && (
        <PasteImportModal
          regulationId={regulation}
          maxSlots={
            pasteTarget === 'team'
              ? 6 - team.length
              : 12 - many.length
          }
          legalPokemon={legalPokemon}
          onImport={(parsed) => handleImport(pasteTarget, parsed)}
          onClose={() => setPasteTarget(null)}
        />
      )}
    </div>
  )
}
