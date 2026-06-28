'use client'

import { useTranslations } from 'next-intl'
import type { CalcPokemon } from '../../_types/calculator'
import { NATURES, useGameData } from '../../_hooks/usePokemonData'
import { useLegalPokemon } from '../../_hooks/useLegalPokemon'
import { useCalculatorStore } from '../../_store/calculatorStore'
import { PokemonSearch } from './PokemonSearch'
import { StatTable } from './StatTable'
import { MoveSlot } from './MoveSlot'
import { HPBar } from './HPBar'
import { getSpriteUrl, handleSpriteError } from '../../_lib/spriteUtils'

const TERA_TYPE_KEYS = [
  'None','Normal','Fire','Water','Electric','Grass','Ice','Fighting',
  'Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon',
  'Dark','Steel','Fairy','Stellar',
]

const STATUS_KEYS = ['Healthy', 'Burned', 'Paralyzed', 'Poisoned', 'Badly Poisoned', 'Frozen', 'Asleep']

interface Props {
  poke: CalcPokemon
  onChange: (patch: Partial<CalcPokemon>) => void
  side: 'atk' | 'def'
  useChampions?: boolean
}

export function PokemonPanel({ poke, onChange, side, useChampions = false }: Props) {
  const t = useTranslations('vgc.calc.panel')
  const { regulation } = useCalculatorStore()
  const legalPokemon = useLegalPokemon(regulation)
  const { items, abilities } = useGameData(regulation)
  const isAtk = side === 'atk'

  const apiEntry = legalPokemon.find((p) => p.name === poke.name)
  const species = apiEntry

  const accentText = isAtk ? 'text-primary-hover' : 'text-secondary-hover'
  const accentBg = isAtk ? 'bg-primary/8' : 'bg-secondary/8'
  const accentBorder = isAtk ? 'border-primary/20' : 'border-secondary/20'
  const accentMoveColor = isAtk ? 'primary' : 'accent'
  const dotColor = isAtk
    ? 'bg-primary-hover shadow-[0_0_6px_theme(colors.primary.400)]'
    : 'bg-secondary-hover shadow-[0_0_6px_theme(colors.accent.400)]'

  function updateMove(idx: number, patch: Partial<CalcPokemon['moves'][0]>) {
    const moves = poke.moves.map((m, i) =>
      i === idx ? { ...m, ...patch } : m,
    ) as CalcPokemon['moves']
    onChange({ moves })
  }

  const speciesAbilities = species ? Object.values(species.abilities).filter(Boolean) : []

  const selectCls =
    'w-full bg-layer-1 border border-edge rounded px-1.5 py-1 text-xs text-ink focus:outline-none focus:border-primary'

  return (
    <div
      className={`bg-layer-1/95 ${isAtk ? 'border-r' : 'border-l'} border-edge/50 flex flex-col gap-2 p-3`}
    >
      {/* Header badge */}
      <div
        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${accentBg} border ${accentBorder} ${accentText}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {isAtk ? t('attacker') : t('defender')}
      </div>

      {/* Sprite + name search + types */}
      <div className="flex items-start gap-2">
        <div
          className={`w-12 h-12 rounded-lg bg-base border ${accentBorder} flex items-center justify-center flex-shrink-0`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getSpriteUrl(poke.name)}
            alt={poke.name}
            width={44}
            height={44}
            className="pixelated drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            onError={handleSpriteError}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <PokemonSearch
            value={poke.name}
            legalPokemon={legalPokemon}
            onChange={(name) => {
              const apiPoke = legalPokemon.find((p) => p.name === name)
              const firstAbility = apiPoke
                ? Object.values(apiPoke.abilities).filter(Boolean)[0] ?? ''
                : ''
              onChange({ name, ability: firstAbility })
            }}
          />
          {species && (
            <div className="flex flex-wrap gap-1">
              {species.types.map((tp) => (
                <TypeBadgeInline key={tp} type={tp} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status + Ability + Item */}
      <div className="grid grid-cols-3 gap-1.5">
        <FormRow label={t('status')}>
          <select
            value={poke.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className={selectCls}
          >
            {STATUS_KEYS.map((sk) => (
              <option key={sk} value={sk}>{t(`statuses.${sk}` as any)}</option>
            ))}
          </select>
        </FormRow>
        <FormRow label={t('ability')}>
          <select
            value={poke.ability}
            onChange={(e) => onChange({ ability: e.target.value })}
            className={selectCls}
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
        <FormRow label={t('item')}>
          <select
            value={poke.item}
            onChange={(e) => onChange({ item: e.target.value })}
            className={selectCls}
          >
            {items.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </FormRow>
      </div>

      {/* Tera + Level + Nature */}
      <div className="grid grid-cols-[1fr_2.5rem_1.5fr] gap-1.5">
        <FormRow label={t('tera')}>
          <select
            value={poke.teraType}
            onChange={(e) => onChange({ teraType: e.target.value })}
            className={selectCls}
          >
            {TERA_TYPE_KEYS.map((tk) => {
              const label = tk === 'None' ? t('teraNone') : t(`teraTypes.${tk}` as any)
              return <option key={tk} value={tk}>{label}</option>
            })}
          </select>
        </FormRow>
        <FormRow label={t('lv')}>
          <input
            type="number"
            min={1}
            max={100}
            value={poke.level}
            onChange={(e) =>
              onChange({ level: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) })
            }
            className="w-full bg-layer-1 border border-edge rounded px-1 py-1 text-xs text-center text-ink focus:outline-none focus:border-primary"
          />
        </FormRow>
        <FormRow label={t('nature')}>
          <select
            value={poke.nature}
            onChange={(e) => onChange({ nature: e.target.value })}
            className={selectCls}
          >
            {NATURES.map((n) => {
              const suffix = n.plus
                ? ` (+${n.plus.toUpperCase()}, -${n.minus?.toUpperCase()})`
                : ''
              return (
                <option key={n.name} value={n.name}>
                  {n.name}{suffix}
                </option>
              )
            })}
          </select>
        </FormRow>
      </div>

      {/* Moves */}
      <div className="flex flex-col gap-1">
        {/* Column headers */}
        <div className="flex items-center gap-1 px-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-dim">
          <span className={`flex-1 ${accentText} font-black tracking-widest text-[10px]`}>
            {t('moves')}
          </span>
          <span className="w-12 text-center">BP</span>
          <span className="w-[84px] text-center">Type</span>
          <span className="w-24 text-center">Cat</span>
          <span className="w-5 text-center">C</span>
          <span className="w-3" />
        </div>
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

      {/* HP bar */}
      <HPBar
        poke={poke}
        onChange={onChange}
        useChampions={useChampions}
        baseStats={apiEntry?.baseStats}
      />

      {/* Stat table */}
      <div className="bg-base/50 rounded-lg p-2 border border-edge-strong/50">
        <StatTable
          poke={poke}
          onChange={onChange}
          useChampions={useChampions}
          baseStats={apiEntry?.baseStats}
        />
      </div>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wide">
        {label}
      </span>
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
