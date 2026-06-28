'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
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

// Per-Pokémon item speed multipliers
function applyItemMod(spd: number, item: string): number {
  if (item === 'Choice Scarf')  return Math.floor(spd * 1.5)
  if (item === 'Iron Ball' || item === 'Lagging Tail' || item === 'Macho Brace') return Math.floor(spd * 0.5)
  return spd
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
  { k: 'tailwind',    label: 'tailwind',    bg: 'rgba(6,182,212,0.15)',  bc: 'rgba(6,182,212,0.5)',  col: 'rgb(103,232,249)' },
  { k: 'choiceScarf', label: 'scarf',       bg: 'rgba(249,115,22,0.15)', bc: 'rgba(249,115,22,0.5)', col: 'rgb(251,146,60)'  },
  { k: 'paralyzed',   label: 'para',        bg: 'rgba(239,68,68,0.15)',  bc: 'rgba(239,68,68,0.5)',  col: '#ef4444'          },
  { k: 'trickRoom',   label: 'trickRoom',   bg: 'rgba(168,85,247,0.15)', bc: 'rgba(168,85,247,0.5)', col: 'rgb(192,132,252)' },
  { k: 'boostPlus1',  label: 'boostPlus1',  bg: 'rgba(132,204,22,0.15)', bc: 'rgba(132,204,22,0.5)', col: 'rgb(163,230,53)'  },
  { k: 'boostPlus2',  label: 'boostPlus2',  bg: 'rgba(132,204,22,0.25)', bc: 'rgba(132,204,22,0.7)', col: 'rgb(163,230,53)'  },
  { k: 'boostMinus1', label: 'boostMinus1', bg: 'rgba(239,68,68,0.12)',  bc: 'rgba(239,68,68,0.4)',  col: '#ef4444'          },
  { k: 'boostMinus2', label: 'boostMinus2', bg: 'rgba(239,68,68,0.22)',  bc: 'rgba(239,68,68,0.7)',  col: '#ef4444'          },
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
  const t = useTranslations('vgc.calc.speedView')
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap mr-1" style={{ color: accentColor }}>
        {t(label as any)}
      </span>
      {MOD_DEFS.map(({ k, label: pl, bg, bc, col }) => (
        <button
          key={k}
          type="button"
          onClick={() => toggle(k)}
          className="px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all"
          style={mods[k] ? { background: bg, borderColor: bc, color: col } : IDLE_MOD_STYLE}
        >
          {t(pl as any)}
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
  const t = useTranslations('vgc.calc.speedView')
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
        {t('baseSpeed', { speed: baseSpe })}
      </div>
    </div>
  )
}

// ─── Rivals Comparison List ───────────────────────────────────────────────────

interface CompEntry {
  name: string
  baseSpe: number
  actual: number
  item: string
  side: 'mine' | 'foe'
}

function speedResult(a: number, b: number, tr: boolean): 'faster' | 'tie' | 'slower' {
  const delta = tr ? b - a : a - b
  if (delta > 0) return 'faster'
  if (delta === 0) return 'tie'
  return 'slower'
}

const RESULT_STYLE = {
  faster: { outline: '2px solid #22c55e', title: 'fasterThan' },
  tie:    { outline: '2px solid #eab308', title: 'tiesWith'   },
  slower: { outline: '2px solid #ef4444', title: 'slowerThan' },
} as const

function SpeedRelIcons({
  entry,
  opponents,
  trickRoom,
}: {
  entry: CompEntry
  opponents: CompEntry[]
  trickRoom: boolean
}) {
  const t = useTranslations('vgc.calc.speedView')
  if (!opponents.length) return null
  return (
    <div className="flex gap-1 flex-wrap mt-1">
      {opponents.map((opp, i) => {
        const res = speedResult(entry.actual, opp.actual, trickRoom)
        const { outline, title } = RESULT_STYLE[res]
        return (
          <img
            key={i}
            src={getSpriteUrl(opp.name)}
            onError={handleSpriteError}
            width={20} height={20}
            className="object-contain rounded-sm"
            style={{ imageRendering: 'pixelated', outline, outlineOffset: 1 }}
            title={`${t(title as any)} ${opp.name} (${opp.actual})`}
            alt={opp.name}
          />
        )
      })}
    </div>
  )
}

function RivalsComparisonList({
  myEntries,
  foeEntries,
  trickRoom,
}: {
  myEntries: CompEntry[]
  foeEntries: CompEntry[]
  trickRoom: boolean
}) {
  const t = useTranslations('vgc.calc.speedView')
  const merged = useMemo(() => {
    return [...myEntries, ...foeEntries]
      .sort((a, b) => trickRoom ? a.actual - b.actual : b.actual - a.actual)
  }, [myEntries, foeEntries, trickRoom])

  if (merged.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-dim text-sm py-12">
        {t('emptyState')}
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden border border-edge/40">
      {merged.map((entry, i) => {
        const isMine = entry.side === 'mine'
        const color = isMine ? 'rgb(249,115,22)' : 'rgb(168,85,247)'
        const hasItem = entry.item && entry.item !== 'None' && entry.item !== ''
        const isScarf = entry.item === 'Choice Scarf'
        const isSlowItem = entry.item === 'Iron Ball' || entry.item === 'Lagging Tail' || entry.item === 'Macho Brace'
        const opponents = isMine ? foeEntries : myEntries

        return (
          <div
            key={`${entry.side}-${entry.name}-${i}`}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-edge-strong/30 last:border-b-0"
            style={{ background: isMine ? 'rgba(249,115,22,0.04)' : 'rgba(168,85,247,0.04)' }}
          >
            {/* Rank */}
            <span className="text-xs font-bold w-5 shrink-0 text-right" style={{ color: 'rgb(71,85,105)' }}>
              {i + 1}
            </span>

            {/* Sprite */}
            <img
              src={getSpriteUrl(entry.name)}
              onError={handleSpriteError}
              width={36} height={36}
              className="object-contain shrink-0"
              style={{ imageRendering: 'pixelated' }}
              alt={entry.name}
            />

            {/* Name + meta + speed rel icons */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight" style={{ color }}>{entry.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] text-ink-dim">{t('baseSpeed', { speed: entry.baseSpe })}</span>
                {hasItem && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={
                      isScarf
                        ? { background: 'rgba(249,115,22,0.15)', color: 'rgb(251,146,60)', border: '1px solid rgba(249,115,22,0.3)' }
                        : isSlowItem
                        ? { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }
                        : { background: 'rgba(100,116,139,0.12)', color: 'rgb(148,163,184)', border: '1px solid rgba(100,116,139,0.2)' }
                    }
                  >
                    {entry.item}
                  </span>
                )}
                <span
                  className="text-[9px] font-bold px-1 rounded"
                  style={{ background: isMine ? 'rgba(249,115,22,0.12)' : 'rgba(168,85,247,0.12)', color }}
                >
                  {isMine ? t('myTeam') : t('rival')}
                </span>
              </div>
              <SpeedRelIcons entry={entry} opponents={opponents} trickRoom={trickRoom} />
            </div>

            {/* Speed value */}
            <span className="font-mono font-black text-2xl shrink-0" style={{ color }}>
              {entry.actual}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface SpeedEntry { name: string; baseSpe: number; actual: number; item: string }
interface RefEntry   { name: string; baseSpe: number; neutral: number; plus: number; isMine: boolean; isFoe: boolean }

interface Props { useChampions: boolean }

export function SpeedView({ useChampions }: Props) {
  const t = useTranslations('vgc.calc.speedView')
  const { team, many, regulation } = useCalculatorStore()
  const legalPokemon = useLegalPokemon(regulation)
  const [level, setLevel] = useState<50 | 100>(50)
  const [myMods,   setMyMods]   = useState<Mods>({ ...EMPTY_MODS })
  const [foesMods, setFoesMods] = useState<Mods>({ ...EMPTY_MODS })
  const [filter, setFilter] = useState('')
  const [vsRivalsOnly, setVsRivalsOnly] = useState(false)
  const [speedTiers, setSpeedTiers] = useState<SpeedTierEntry[] | null>(() =>
    useChampions && regulation ? (speedTierCache.get(regulation) ?? null) : null,
  )

  const hasRivals = many.length > 0

  // Auto-switch to rivals mode when rivals are added for the first time
  useEffect(() => {
    if (hasRivals) setVsRivalsOnly(true)
  }, [hasRivals])

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
      const base    = calcStat(GEN9, 'spe', baseSpe, p.ivs.spe, speEv, level, p.nature)
      const actual  = applyItemMod(applyMods(base, myMods), p.item)
      return { name: p.name, baseSpe, actual, item: p.item }
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
      const base    = calcStat(GEN9, 'spe', baseSpe, p.ivs.spe, speEv, level, p.nature)
      const actual  = applyItemMod(applyMods(base, foesMods), p.item)
      return { name: p.name, baseSpe, actual, item: p.item }
    })
      .filter((e): e is SpeedEntry => e !== null)
      .sort((a, b) => foesMods.trickRoom ? a.actual - b.actual : b.actual - a.actual)
  }, [many, level, foesMods, useChampions, legalPokemon])

  const teamNames = useMemo(() => new Set(team.map((p) => p.name)), [team])
  const manyNames = useMemo(() => new Set(many.map((p) => p.name)), [many])

  const compEntries = useMemo<CompEntry[]>(() => {
    return [
      ...teamEntries.map((e) => ({ ...e, side: 'mine' as const })),
      ...foesEntries.map((e) => ({ ...e, side: 'foe'  as const })),
    ]
  }, [teamEntries, foesEntries])

  const refEntries = useMemo<RefEntry[]>(() => {
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

  const showRivals = hasRivals && vsRivalsOnly

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Controls */}
      <div className="shrink-0 border-b border-edge/40 bg-layer-1/90 px-4 py-2.5 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">{t('level')}</span>
          {([50, 100] as const).map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setLevel(lv)}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                level === lv
                  ? 'bg-primary/15 border-primary/35 text-primary-hover'
                  : 'bg-layer-2/50 border-edge/50 text-ink-muted hover:text-ink'
              }`}
            >
              Lv {lv}
            </button>
          ))}

          {/* Rivals toggle */}
          {hasRivals && (
            <div className="flex items-center gap-1 ml-2 rounded-md border border-edge/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setVsRivalsOnly(true)}
                className={`px-2.5 py-1 text-xs font-semibold transition-all ${
                  vsRivalsOnly
                    ? 'bg-secondary/20 text-secondary-hover border-r border-secondary/30'
                    : 'text-ink-muted hover:text-ink border-r border-edge/50'
                }`}
              >
                {t('vsRivals')}
              </button>
              <button
                type="button"
                onClick={() => setVsRivalsOnly(false)}
                className={`px-2.5 py-1 text-xs font-semibold transition-all ${
                  !vsRivalsOnly
                    ? 'bg-primary/15 text-primary-hover'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {t('allPokemon')}
              </button>
            </div>
          )}

          {!showRivals && (
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t('filterPlaceholder')}
              className="ml-auto w-40 bg-layer-1 border border-edge rounded px-2 py-1 text-xs text-ink placeholder:text-ink-dim focus:outline-none focus:border-primary"
            />
          )}
        </div>

        {/* Two-column mod pills */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded px-2.5 py-1.5" style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)' }}>
            <ModPills mods={myMods} toggle={toggleMy} label="modMyTeam" accentColor="rgb(251,146,60)" />
          </div>
          <div className="rounded px-2.5 py-1.5" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <ModPills mods={foesMods} toggle={toggleFoes} label="modRivals" accentColor="rgb(192,132,252)" />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

        {/* ── Rivals comparison mode ── */}
        {showRivals ? (
          <>
            <div>
              <SectionDivider label={t('comparisonTitle')} color="rgb(148,163,184)" />
              <RivalsComparisonList
                myEntries={compEntries.filter((e) => e.side === 'mine')}
                foeEntries={compEntries.filter((e) => e.side === 'foe')}
                trickRoom={myMods.trickRoom}
              />
            </div>
          </>
        ) : (
          <>
            {/* My Team */}
            {teamEntries.length > 0 && (
              <div>
                <SectionDivider label={t('sectionMyTeam')} color="rgb(249,115,22)" />
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
                <SectionDivider label={t('sectionRivals')} color="rgb(168,85,247)" />
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
                label={t('referenceTitle', {
                  count: refEntries.length,
                  format: speedTiers ? t('formatSuffix') : '',
                  filter: filter ? t('filterSuffix') : '',
                })}
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
                  <p className="text-ink-dim text-sm py-10 w-full text-center">
                    {t('noFilterMatch')}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
