'use client'

import type { CalcPokemon } from '../../_types/calculator'
import { NATURES, useGameData } from '../../_hooks/usePokemonData'
import { useLegalPokemon } from '../../_hooks/useLegalPokemon'
import { useCalculatorStore } from '../../_store/calculatorStore'
import { PokemonSearch } from './PokemonSearch'
import { StatTable } from './StatTable'
import { MoveSlot } from './MoveSlot'
import { HPBar } from './HPBar'
import { getSpriteUrl, handleSpriteError } from '../../_lib/spriteUtils'

const TERA_TYPES = [
  'None','Normal','Fire','Water','Electric','Grass','Ice','Fighting',
  'Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon',
  'Dark','Steel','Fairy','Stellar',
]

const STATUSES = ['Healthy', 'Burned', 'Paralyzed', 'Poisoned', 'Badly Poisoned', 'Frozen', 'Asleep']

interface Props {
  poke: CalcPokemon
  onChange: (patch: Partial<CalcPokemon>) => void
  side: 'atk' | 'def'
  useChampions?: boolean
}

export function PokemonPanel({ poke, onChange, side, useChampions = false }: Props) {
  const { regulation } = useCalculatorStore()
  const legalPokemon = useLegalPokemon(regulation)
  const { items, abilities } = useGameData(regulation)
  const isAtk = side === 'atk'

  // Look up species data entirely from the API list — no @pkmn/dex fallback.
  const apiEntry = legalPokemon.find((p) => p.name === poke.name)
  const species = apiEntry

  const accentText = isAtk ? 'text-primary-400' : 'text-accent-400'
  const accentBg = isAtk ? 'bg-primary-500/8' : 'bg-accent-500/8'
  const accentBorder = isAtk ? 'border-primary-500/20' : 'border-accent-500/20'
  const accentMoveColor = isAtk ? 'primary' : 'accent'
  const dotColor = isAtk ? 'bg-primary-400 shadow-[0_0_6px_theme(colors.primary.400)]' : 'bg-accent-400 shadow-[0_0_6px_theme(colors.accent.400)]'

  function updateMove(idx: number, patch: Partial<CalcPokemon['moves'][0]>) {
    const moves = poke.moves.map((m, i) =>
      i === idx ? { ...m, ...patch } : m,
    ) as CalcPokemon['moves']
    onChange({ moves })
  }

  const speciesAbilities = species
    ? Object.values(species.abilities).filter(Boolean)
    : []

  return (
    <div className={`bg-surface-900/95 ${isAtk ? 'border-r' : 'border-l'} border-surface-700/50 flex flex-col gap-3 p-3`}>

      {/* Header */}
      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-md ${accentBg} border ${accentBorder} ${accentText}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {isAtk ? 'Pokémon 1 — Attacker' : 'Pokémon 2 — Defender'}
      </div>

      {/* Name search */}
      <PokemonSearch
        value={poke.name}
        legalPokemon={legalPokemon}
        onChange={(name) => {
          const apiPoke = legalPokemon.find((p) => p.name === name)
          const firstAbility = apiPoke ? Object.values(apiPoke.abilities).filter(Boolean)[0] ?? '' : ''
          onChange({ name, ability: firstAbility })
        }}
      />

      {/* Sprite (left) + Moves (right) */}
      <div className="grid grid-cols-[auto_1fr] gap-3">
        {/* Left: sprite + types + status */}
        <div className="flex flex-col gap-2 items-center">
          <div className={`w-20 h-20 rounded-xl bg-surface-950 border ${accentBorder} flex items-center justify-center flex-shrink-0`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getSpriteUrl(poke.name)}
              alt={poke.name}
              width={72}
              height={72}
              className="pixelated drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              onError={handleSpriteError}
            />
          </div>
          {species && (
            <div className="flex flex-wrap gap-1 justify-center">
              {species.types.map((t) => (
                <TypeBadgeInline key={t} type={t} />
              ))}
            </div>
          )}
          {/* Status */}
          <select
            value={poke.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="w-full bg-surface-900 border border-surface-700 rounded px-1.5 py-1 text-[10px] text-surface-200 focus:outline-none focus:border-primary-500"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Right: move slots */}
        <div className="flex flex-col gap-1.5">
          <span className={`text-[10px] font-black uppercase tracking-widest ${accentText}`}>Moves</span>
          {poke.moves.map((mv, i) => (
            <MoveSlot
              key={i}
              move={mv}
              index={i}
              onChange={(patch) => updateMove(i, patch)}
              accentColor={accentMoveColor as 'primary' | 'accent'}
            />
          ))}
        </div>
      </div>

      {/* Ability + Item row */}
      <div className="grid grid-cols-2 gap-2">
        <FormRow label="Ability">
          <select
            value={poke.ability}
            onChange={(e) => onChange({ ability: e.target.value })}
            className="w-full bg-surface-900 border border-surface-700 rounded px-2 py-1 text-xs text-surface-200 focus:outline-none focus:border-primary-500"
          >
            {speciesAbilities.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
            {speciesAbilities.length === 0 &&
              abilities.slice(0, 50).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
          </select>
        </FormRow>
        <FormRow label="Item">
          <select
            value={poke.item}
            onChange={(e) => onChange({ item: e.target.value })}
            className="w-full bg-surface-900 border border-surface-700 rounded px-2 py-1 text-xs text-surface-200 focus:outline-none focus:border-primary-500"
          >
            {items.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </FormRow>
      </div>

      {/* Tera + Level row */}
      <div className="grid grid-cols-2 gap-2">
        <FormRow label="Tera">
          <select
            value={poke.teraType}
            onChange={(e) => onChange({ teraType: e.target.value })}
            className="w-full bg-surface-900 border border-surface-700 rounded px-2 py-1 text-xs text-surface-200 focus:outline-none focus:border-primary-500"
          >
            {TERA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormRow>
        <FormRow label="Lv.">
          <input
            type="number" min={1} max={100} value={poke.level}
            onChange={(e) => onChange({ level: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) })}
            className="w-full bg-surface-900 border border-surface-700 rounded px-2 py-1 text-xs text-surface-200 focus:outline-none focus:border-primary-500"
          />
        </FormRow>
      </div>

      {/* Nature */}
      <FormRow label="Nature">
        <select
          value={poke.nature}
          onChange={(e) => onChange({ nature: e.target.value })}
          className="w-full bg-surface-900 border border-surface-700 rounded px-2 py-1 text-xs text-surface-200 focus:outline-none focus:border-primary-500"
        >
          {NATURES.map((n) => {
            const suffix = n.plus ? ` (+${n.plus.toUpperCase()}, -${n.minus?.toUpperCase()})` : ''
            return <option key={n.name} value={n.name}>{n.name}{suffix}</option>
          })}
        </select>
      </FormRow>

      {/* HP bar */}
      <HPBar poke={poke} onChange={onChange} useChampions={useChampions} baseStats={apiEntry?.baseStats} />

      {/* Stat table */}
      <div className="bg-surface-950/50 rounded-lg p-2 border border-surface-800/50">
        <StatTable poke={poke} onChange={onChange} useChampions={useChampions} baseStats={apiEntry?.baseStats} />
      </div>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-surface-500 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  )
}

const TYPE_COLORS_HEX: Record<string, string> = {
  Normal: '#a8a878', Fire: '#f08030', Water: '#6890f0', Electric: '#f8d030',
  Grass: '#78c850', Ice: '#98d8d8', Fighting: '#c03028', Poison: '#a040a0',
  Ground: '#e0c068', Flying: '#a890f0', Psychic: '#f85888', Bug: '#a8b820',
  Rock: '#b8a038', Ghost: '#705898', Dragon: '#7038f8', Dark: '#705848',
  Steel: '#b8b8d0', Fairy: '#ee99ac', Stellar: '#40b8ff',
}

function TypeBadgeInline({ type }: { type: string }) {
  const col = TYPE_COLORS_HEX[type] ?? '#9ca3af'
  return (
    <span
      className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: `${col}22`, border: `1px solid ${col}44`, color: col }}
    >
      {type}
    </span>
  )
}
