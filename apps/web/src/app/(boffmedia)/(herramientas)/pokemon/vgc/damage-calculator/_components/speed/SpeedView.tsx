'use client'

import { useEffect, useMemo, useState } from 'react'
import { calcStat, Generations } from '@smogon/calc'
import { useCalculatorStore } from '../../_store/calculatorStore'
import { useLegalPokemon } from '../../_hooks/useLegalPokemon'
import { getSpriteUrl, handleSpriteError } from '../../_lib/spriteUtils'
import { VgcService } from '@/services/api/boffmedia/vgcService'
import type { SpeedTierEntry } from '@/services/api/boffmedia/vgcService'

// Module-level cache: regulation → speed tier entries
const speedTierCache = new Map<string, SpeedTierEntry[]>()

const GEN9 = Generations.get(9)

function spToEv(sp: number): number {
  return Math.floor((sp * 252) / 32)
}

interface Mods {
  tailwind: boolean
  choiceScarf: boolean
  paralyzed: boolean
  trickRoom: boolean
  boostPlus1: boolean
  boostPlus2: boolean
  boostMinus1: boolean
  boostMinus2: boolean
}

type ModKey = keyof Mods

const EMPTY_MODS: Mods = {
  tailwind: false, choiceScarf: false, paralyzed: false, trickRoom: false,
  boostPlus1: false, boostPlus2: false, boostMinus1: false, boostMinus2: false,
}

function applyMods(spd: number, mods: Mods): number {
  let s = spd
  if (mods.tailwind)         s = Math.floor(s * 2)
  if (mods.paralyzed)        s = Math.floor(s * 0.5)
  if (mods.choiceScarf)      s = Math.floor(s * 1.5)
  if (mods.boostPlus2)       s = Math.floor(s * 2)
  else if (mods.boostPlus1)  s = Math.floor(s * 1.5)
  if (mods.boostMinus2)      s = Math.floor(s * 0.5)
  else if (mods.boostMinus1) s = Math.floor(s * (2 / 3))
  return s
}

const MOD_DEFS: { k: ModKey; label: string; bg: string; bc: string; col: string }[] = [
  { k: 'tailwind',    label: 'Tailwind', bg: 'rgba(6,182,212,0.15)',  bc: 'rgba(6,182,212,0.5)',  col: 'rgb(103,232,249)' },
  { k: 'choiceScarf', label: 'Scarf',   bg: 'rgba(249,115,22,0.15)', bc: 'rgba(249,115,22,0.5)', col: 'rgb(251,146,60)'  },
  { k: 'paralyzed',   label: 'Para',    bg: 'rgba(239,68,68,0.15)',  bc: 'rgba(239,68,68,0.5)',  col: '#ef4444'          },
  { k: 'trickRoom',   label: 'TR',      bg: 'rgba(168,85,247,0.15)', bc: 'rgba(168,85,247,0.5)', col: 'rgb(192,132,252)' },
  { k: 'boostPlus1',  label: '+1',      bg: 'rgba(132,204,22,0.15)', bc: 'rgba(132,204,22,0.5)', col: 'rgb(163,230,53)'  },
  { k: 'boostPlus2',  label: '+2',      bg: 'rgba(132,204,22,0.25)', bc: 'rgba(132,204,22,0.7)', col: 'rgb(163,230,53)'  },
  { k: 'boostMinus1', label: '-1',      bg: 'rgba(239,68,68,0.12)',  bc: 'rgba(239,68,68,0.4)',  col: '#ef4444'          },
  { k: 'boostMinus2', label: '-2',      bg: 'rgba(239,68,68,0.22)',  bc: 'rgba(239,68,68,0.7)',  col: '#ef4444'          },
]

const IDLE_MOD_STYLE = {
  background: 'rgba(30,41,59,0.5)',
  borderColor: 'rgba(51,65,85,0.5)',
  color: 'rgb(71,85,105)',
}

function ModPills({
  mods, toggle, label, accentColor,
}: {
  mods: Mods
  toggle: (k: ModKey) => void
  label: string
  accentColor: string
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap mr-1" style={{ color: accentColor }}>
        {label}
      </span>
      {MOD_DEFS.map(({ k, label: pl, bg, bc, col }) => (
        <button
          key={k}
          type="button"
          onClick={() => toggle(k)}
          className="px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all"
          style={mods[k] ? { background: bg, borderColor: bc, color: col } : IDLE_MOD_STYLE}
        >
          {pl}
        </button>
      ))}
    </div>
  )
}

function SectionDivider({ label, color }: { label: string; color?: string }) {
  const c = color ?? 'rgba(71,85,105,0.8)'
  return (
    <div className="flex items-center gap-2 mb-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: c }}>
      <span className="flex-1 h-px block" style={{ background: `${c}44` }} />
      {label}
      <span className="flex-1 h-px block" style={{ background: `${c}44` }} />
    </div>
  )
}

function SpdCard({
  name, baseSpe, color, children,
}: {
  name: string
  baseSpe: number
  color?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 p-1 shrink-0"
      style={{
        minWidth: 58,
        borderRadius: 7,
        outline: color ? `2px solid ${color}55` : 'none',
        background: color ? `${color}0d` : 'transparent',
      }}
    >
      <img
        src={getSpriteUrl(name)}
        onError={handleSpriteError}
        width={32} height={32}
        className="object-contain"
        style={{ imageRendering: 'pixelated' }}
        alt={name}
      />
      <div
        className="text-[9px] font-semibold text-center leading-tight w-full truncate px-0.5"
        style={{ color: color ?? 'rgb(100,116,139)' }}
        title={name}
      >
        {name}
      </div>
      {children}
      <div className="text-[8px]" style={{ color: 'rgb(71,85,105)' }}>
        base {baseSpe}
      </div>
    </div>
  )
}

interface SpeedEntry { name: string; baseSpe: number; actual: number }
interface RefEntry   { name: string; baseSpe: number; neutral: number; plus: number; isMine: boolean; isFoe: boolean }

interface Props { useChampions: boolean }

export function SpeedView({ useChampions }: Props) {
  const { team, many, regulation } = useCalculatorStore()
  const legalPokemon = useLegalPokemon(regulation)
  const [level, setLevel] = useState<50 | 100>(50)
  const [myMods,   setMyMods]   = useState<Mods>({ ...EMPTY_MODS })
  const [foesMods, setFoesMods] = useState<Mods>({ ...EMPTY_MODS })
  const [filter, setFilter] = useState('')
  const [speedTiers, setSpeedTiers] = useState<SpeedTierEntry[] | null>(() =>
    useChampions && regulation ? (speedTierCache.get(regulation) ?? null) : null,
  )

  // Fetch speed tiers whenever regulation changes (or on first mount with Champions mode)
  useEffect(() => {
    if (!useChampions || !regulation) {
      setSpeedTiers(null)
      return
    }
    const cached = speedTierCache.get(regulation)
    if (cached) {
      setSpeedTiers(cached)
      return
    }
    VgcService.getChampionsSpeedTiers(regulation).then((res) => {
      if (res.success && res.data) {
        speedTierCache.set(regulation, res.data)
        setSpeedTiers(res.data)
      }
    })
  }, [regulation, useChampions])

  const toggleMy   = (k: ModKey) => setMyMods(m   => ({ ...m, [k]: !m[k] }))
  const toggleFoes = (k: ModKey) => setFoesMods(m => ({ ...m, [k]: !m[k] }))

  const teamEntries = useMemo<SpeedEntry[]>(() => {
    return team.map((p) => {
      const apiEntry = legalPokemon.find((lp) => lp.name === p.name)
      if (!apiEntry) return null
      const baseSpe = apiEntry.baseStats.spe
      const speEv   = useChampions ? spToEv(p.evs.spe) : p.evs.spe
      const actual  = applyMods(calcStat(GEN9, 'spe', baseSpe, p.ivs.spe, speEv, level, p.nature), myMods)
      return { name: p.name, baseSpe, actual }
    })
      .filter((e): e is SpeedEntry => e !== null)
      .sort((a, b) => myMods.trickRoom ? a.actual - b.actual : b.actual - a.actual)
  }, [team, level, myMods, useChampions, legalPokemon])

  const foesEntries = useMemo<SpeedEntry[]>(() => {
    return many.map((p) => {
      const apiEntry = legalPokemon.find((lp) => lp.name === p.name)
      if (!apiEntry) return null
      const baseSpe = apiEntry.baseStats.spe
      const speEv   = useChampions ? spToEv(p.evs.spe) : p.evs.spe
      const actual  = applyMods(calcStat(GEN9, 'spe', baseSpe, p.ivs.spe, speEv, level, p.nature), foesMods)
      return { name: p.name, baseSpe, actual }
    })
      .filter((e): e is SpeedEntry => e !== null)
      .sort((a, b) => foesMods.trickRoom ? a.actual - b.actual : b.actual - a.actual)
  }, [many, level, foesMods, useChampions, legalPokemon])

  const teamNames = useMemo(() => new Set(team.map((p) => p.name)), [team])
  const manyNames = useMemo(() => new Set(many.map((p) => p.name)), [many])

  const refEntries = useMemo<RefEntry[]>(() => {
    // Use format-legal speed tiers when available, otherwise fall back to the API legal list.
    const source: { name: string; baseSpe: number }[] = speedTiers
      ? speedTiers.map((t) => ({ name: t.name, baseSpe: t.baseSpeed }))
      : legalPokemon.map((p) => ({ name: p.name, baseSpe: p.baseStats.spe }))

    return source
      .filter(({ name }) => !filter || name.toLowerCase().includes(filter.toLowerCase()))
      .map(({ name, baseSpe }) => {
        const neutral = applyMods(calcStat(GEN9, 'spe', baseSpe, 31, 0,   level, 'Hardy'), myMods)
        const plus    = applyMods(calcStat(GEN9, 'spe', baseSpe, 31, 252, level, 'Timid'), myMods)
        return { name, baseSpe, neutral, plus, isMine: teamNames.has(name), isFoe: manyNames.has(name) }
      })
      .sort((a, b) => myMods.trickRoom ? a.neutral - b.neutral : b.neutral - a.neutral)
      .slice(0, filter ? 200 : 120)
  }, [level, myMods, filter, teamNames, manyNames, speedTiers, legalPokemon])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Controls */}
      <div className="shrink-0 border-b border-surface-700/40 bg-surface-900/90 px-4 py-2.5 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-bold uppercase tracking-wider text-surface-500">Level</span>
          {([50, 100] as const).map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setLevel(lv)}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                level === lv
                  ? 'bg-primary-500/15 border-primary-500/35 text-primary-400'
                  : 'bg-surface-800/50 border-surface-700/50 text-surface-400 hover:text-surface-200'
              }`}
            >
              Lv {lv}
            </button>
          ))}
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter reference..."
            className="ml-auto w-40 bg-surface-900 border border-surface-700 rounded px-2 py-1 text-xs text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Two-column mod pills */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded px-2.5 py-1.5" style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)' }}>
            <ModPills mods={myMods} toggle={toggleMy} label="My Team" accentColor="rgb(251,146,60)" />
          </div>
          <div className="rounded px-2.5 py-1.5" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <ModPills mods={foesMods} toggle={toggleFoes} label="Rivals" accentColor="rgb(192,132,252)" />
          </div>
        </div>
      </div>

      {/* Scrollable card sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

        {/* My Team */}
        {teamEntries.length > 0 && (
          <div>
            <SectionDivider label="My Team" color="rgb(249,115,22)" />
            <div className="flex flex-wrap gap-1 items-end">
              {teamEntries.map((p) => (
                <SpdCard key={p.name} name={p.name} baseSpe={p.baseSpe} color="rgb(249,115,22)">
                  <div className="font-mono font-black text-[14px]" style={{ color: 'rgb(249,115,22)' }}>
                    {p.actual}
                  </div>
                </SpdCard>
              ))}
            </div>
          </div>
        )}

        {/* Rivals */}
        {foesEntries.length > 0 && (
          <div>
            <SectionDivider label="Rivals" color="rgb(168,85,247)" />
            <div className="flex flex-wrap gap-1 items-end">
              {foesEntries.map((p) => (
                <SpdCard key={p.name} name={p.name} baseSpe={p.baseSpe} color="rgb(168,85,247)">
                  <div className="font-mono font-black text-[14px]" style={{ color: 'rgb(168,85,247)' }}>
                    {p.actual}
                  </div>
                </SpdCard>
              ))}
            </div>
          </div>
        )}

        {/* Reference */}
        <div>
          <SectionDivider
            label={`Reference — top: +Spd 252 EVs / bottom: neutral · ${refEntries.length} Pokémon${speedTiers ? ' (format)' : ''}${filter ? ' filtered' : ''}`}
          />
          <div className="flex flex-wrap gap-1 items-end">
            {refEntries.map((p) => {
              const col = p.isMine ? 'rgb(249,115,22)' : p.isFoe ? 'rgb(168,85,247)' : undefined
              return (
                <SpdCard key={p.name} name={p.name} baseSpe={p.baseSpe} color={col}>
                  <div className="flex flex-col items-center">
                    <div className="font-mono font-black text-[11px]" style={{ color: col ?? 'rgb(203,213,225)' }}>
                      {p.plus}
                    </div>
                    <div className="font-mono text-[9px]" style={{ color: 'rgb(71,85,105)' }}>
                      {p.neutral}
                    </div>
                  </div>
                </SpdCard>
              )
            })}
            {refEntries.length === 0 && (
              <p className="text-surface-600 text-sm py-10 w-full text-center">
                No Pokémon match your filter
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
