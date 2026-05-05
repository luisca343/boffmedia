'use client'

import { useMemo } from 'react'
import { useCalculatorStore } from '../../_store/calculatorStore'
import { useLegalPokemon } from '../../_hooks/useLegalPokemon'
import { getSpriteUrl, handleSpriteError } from '../../_lib/spriteUtils'

// ─── Gen 9 type chart ─────────────────────────────────────────────────────────
// Only non-neutral (≠1) entries are listed; everything else defaults to 1.
const TYPE_EFF: Record<string, Record<string, number>> = {
  Normal:   { Ghost: 0, Rock: 0.5, Steel: 0.5 },
  Fire:     { Fire: 0.5, Water: 0.5, Rock: 0.5, Dragon: 0.5, Grass: 2, Ice: 2, Bug: 2, Steel: 2 },
  Water:    { Water: 0.5, Grass: 0.5, Dragon: 0.5, Fire: 2, Ground: 2, Rock: 2 },
  Electric: { Ground: 0, Electric: 0.5, Grass: 0.5, Dragon: 0.5, Water: 2, Flying: 2 },
  Grass:    { Fire: 0.5, Grass: 0.5, Poison: 0.5, Flying: 0.5, Bug: 0.5, Dragon: 0.5, Steel: 0.5, Water: 2, Ground: 2, Rock: 2 },
  Ice:      { Fire: 0.5, Water: 0.5, Ice: 0.5, Steel: 0.5, Grass: 2, Ground: 2, Flying: 2, Dragon: 2 },
  Fighting: { Ghost: 0, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Fairy: 0.5, Normal: 2, Ice: 2, Rock: 2, Dark: 2, Steel: 2 },
  Poison:   { Steel: 0, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Grass: 2, Fairy: 2 },
  Ground:   { Flying: 0, Grass: 0.5, Bug: 0.5, Fire: 2, Electric: 2, Poison: 2, Rock: 2, Steel: 2 },
  Flying:   { Electric: 0.5, Rock: 0.5, Steel: 0.5, Grass: 2, Fighting: 2, Bug: 2 },
  Psychic:  { Dark: 0, Psychic: 0.5, Steel: 0.5, Fighting: 2, Poison: 2 },
  Bug:      { Fire: 0.5, Fighting: 0.5, Flying: 0.5, Ghost: 0.5, Steel: 0.5, Fairy: 0.5, Grass: 2, Psychic: 2, Dark: 2 },
  Rock:     { Fighting: 0.5, Ground: 0.5, Steel: 0.5, Fire: 2, Ice: 2, Flying: 2, Bug: 2 },
  Ghost:    { Normal: 0, Dark: 0.5, Ghost: 2, Psychic: 2 },
  Dragon:   { Fairy: 0, Steel: 0.5, Dragon: 2 },
  Dark:     { Fighting: 0.5, Dark: 0.5, Fairy: 0.5, Ghost: 2, Psychic: 2 },
  Steel:    { Fire: 0.5, Water: 0.5, Electric: 0.5, Steel: 0.5, Ice: 2, Rock: 2, Fairy: 2 },
  Fairy:    { Fire: 0.5, Poison: 0.5, Steel: 0.5, Fighting: 2, Dragon: 2, Dark: 2 },
}

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
]

const TYPE_COLORS: Record<string, string> = {
  Normal: '#9ca3af', Fire: '#f97316', Water: '#3b82f6', Electric: '#f59e0b',
  Grass: '#84cc16', Ice: '#67e8f9', Fighting: '#ef4444', Poison: '#a855f7',
  Ground: '#b45309', Flying: '#60a5fa', Psychic: '#ec4899', Bug: '#65a30d',
  Rock: '#78716c', Ghost: '#6366f1', Dragon: '#6d28d9', Dark: '#94a3b8',
  Steel: '#cbd5e1', Fairy: '#f9a8d4',
}

function getTypeEff(atkType: string, defTypes: string[]): number {
  let mult = 1
  for (const dt of defTypes) {
    mult *= TYPE_EFF[atkType]?.[dt] ?? 1
  }
  return mult
}

// Best effectiveness a Pokémon with pokemonTypes can achieve against a single defenderType using STAB.
function getBestOffenseEff(pokemonTypes: string[], defenderType: string): number {
  return Math.max(...pokemonTypes.map((pt) => getTypeEff(pt, [defenderType])))
}

function effLabel(eff: number): string {
  if (eff === 0)    return 'Immune'
  if (eff === 0.25) return '¼×'
  if (eff === 0.5)  return '½×'
  if (eff === 1)    return ''
  if (eff === 4)    return '4×'
  return '2×'
}

function effCellStyle(eff: number): React.CSSProperties {
  if (eff === 0)    return { background: 'rgba(100,116,139,0.12)', color: 'rgb(71,85,105)' }
  if (eff <= 0.25)  return { background: 'rgba(34,197,94,0.20)',   color: 'rgb(34,197,94)'  }
  if (eff < 1)      return { background: 'rgba(74,222,128,0.10)',  color: 'rgb(74,222,128)' }
  if (eff === 1)    return {}
  if (eff >= 4)     return { background: 'rgba(239,68,68,0.18)',   color: '#ef4444'         }
  return               { background: 'rgba(251,191,36,0.10)',  color: 'rgb(251,191,36)' }
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const col = TYPE_COLORS[type] ?? '#9ca3af'
  return (
    <span
      className="px-1 py-0.5 rounded text-[8px] font-bold leading-none whitespace-nowrap"
      style={{ background: `${col}33`, border: `1px solid ${col}66`, color: col }}
    >
      {type}
    </span>
  )
}

// ─── Coverage Table ───────────────────────────────────────────────────────────

interface TeamPoke { name: string; types: string[] }

function CovTable({
  teamPokes,
  mode,
}: {
  teamPokes: TeamPoke[]
  mode: 'offense' | 'defense'
}) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-[10px]">
        <thead>
          <tr>
            <th className="w-20 min-w-[80px] border-b border-surface-700/40 bg-surface-900 sticky left-0 z-10" />
            {teamPokes.map((p) => (
              <th key={p.name} className="min-w-[40px] border-b border-surface-700/40 bg-surface-900 px-1 py-1 text-center">
                <img
                  src={getSpriteUrl(p.name)}
                  onError={handleSpriteError}
                  width={24} height={24}
                  className="object-contain mx-auto"
                  style={{ imageRendering: 'pixelated' }}
                  alt={p.name}
                />
              </th>
            ))}
            {/* Summary column header */}
            <th
              className="min-w-[32px] border-b border-surface-700/40 px-1 py-1 text-center"
              style={{ background: mode === 'offense' ? 'rgba(239,68,68,0.08)' : 'rgba(252,165,165,0.08)' }}
            >
              <span className="text-[8px] font-bold" style={{ color: mode === 'offense' ? 'rgb(252,165,165)' : 'rgb(252,165,165)' }}>
                {mode === 'offense' ? 'NVE' : 'Weak'}
              </span>
            </th>
            <th
              className="min-w-[32px] border-b border-surface-700/40 px-1 py-1 text-center"
              style={{ background: 'rgba(74,222,128,0.08)' }}
            >
              <span className="text-[8px] font-bold text-green-400">
                {mode === 'offense' ? 'SE' : 'Res'}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ALL_TYPES.map((rowType) => {
            const effs = mode === 'offense'
              ? teamPokes.map((p) => getBestOffenseEff(p.types, rowType))
              : teamPokes.map((p) => getTypeEff(rowType, p.types))
            const badCount = mode === 'offense'
              ? effs.filter((e) => e > 0 && e < 1).length
              : effs.filter((e) => e >= 2).length
            const goodCount = mode === 'offense'
              ? effs.filter((e) => e >= 2).length
              : effs.filter((e) => e > 0 && e < 1).length
            const col = TYPE_COLORS[rowType] ?? '#9ca3af'
            return (
              <tr key={rowType} className="border-b border-surface-800/30 hover:bg-surface-900/30">
                <td className="sticky left-0 z-10 bg-surface-950 px-1.5 py-0.5">
                  <span
                    className="px-1 py-0.5 rounded text-[8px] font-bold leading-none whitespace-nowrap"
                    style={{ background: `${col}33`, border: `1px solid ${col}66`, color: col }}
                  >
                    {rowType}
                  </span>
                </td>
                {effs.map((eff, j) => (
                  <td
                    key={j}
                    className="text-center font-bold py-0.5 px-1 text-[9px]"
                    style={effCellStyle(eff)}
                  >
                    {effLabel(eff)}
                  </td>
                ))}
                <td
                  className="text-center font-bold text-[9px] py-0.5 px-1"
                  style={badCount > 0 ? { background: mode === 'offense' ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.06)', color: '#ef4444' } : { color: 'rgb(51,65,85)' }}
                >
                  {badCount || ''}
                </td>
                <td
                  className="text-center font-bold text-[9px] py-0.5 px-1"
                  style={goodCount > 0 ? { background: 'rgba(74,222,128,0.06)', color: 'rgb(74,222,128)' } : { color: 'rgb(51,65,85)' }}
                >
                  {goodCount || ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Insights ─────────────────────────────────────────────────────────────────

function InsightRow({ poke, children }: { poke: TeamPoke; children: React.ReactNode }) {
  const col = TYPE_COLORS[poke.types[0]] ?? '#6b7280'
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-surface-800/30 last:border-b-0">
      <div
        className="w-9 h-9 rounded flex items-center justify-center shrink-0"
        style={{ background: `${col}22`, border: `1px solid ${col}55` }}
      >
        <img
          src={getSpriteUrl(poke.name)}
          onError={handleSpriteError}
          width={28} height={28}
          className="object-contain"
          style={{ imageRendering: 'pixelated' }}
          alt={poke.name}
        />
      </div>
      <div className="flex-1 min-w-0 text-[10px] text-surface-400 leading-snug">
        {children}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TypeCalcView() {
  const { team, regulation } = useCalculatorStore()
  const legalPokemon = useLegalPokemon(regulation)

  const teamPokes = useMemo<TeamPoke[]>(() => {
    return team.map((p) => {
      const apiEntry = legalPokemon.find((lp) => lp.name === p.name)
      return apiEntry ? { name: p.name, types: apiEntry.types } : null
    }).filter((e): e is TeamPoke => e !== null)
  }, [team, legalPokemon])

  const offInsights = useMemo(() => {
    return teamPokes.map((p) => {
      let se = 0, nve = 0, imm = 0
      for (const defT of ALL_TYPES) {
        const e = getBestOffenseEff(p.types, defT)
        if (e >= 2) se++
        else if (e === 0) imm++
        else if (e < 1) nve++
      }
      return { ...p, se, nve, imm }
    })
  }, [teamPokes])

  const defInsights = useMemo(() => {
    return teamPokes.map((p) => {
      let weak = 0, resist = 0, imm = 0, quad = 0
      for (const t of ALL_TYPES) {
        const e = getTypeEff(t, p.types)
        if (e >= 4) { weak++; quad++ }
        else if (e >= 2) weak++
        else if (e === 0) imm++
        else if (e < 1) resist++
      }
      return { ...p, weak, resist, imm, quad }
    })
  }, [teamPokes])

  const bestOffType = useMemo(() => {
    if (!teamPokes.length) return null
    let best = '', bestN = 0
    for (const defT of ALL_TYPES) {
      const n = teamPokes.filter((p) => getBestOffenseEff(p.types, defT) >= 2).length
      if (n > bestN) { bestN = n; best = defT }
    }
    return bestN > 0 ? { type: best, count: bestN } : null
  }, [teamPokes])

  const bestDefType = useMemo(() => {
    if (!teamPokes.length) return null
    let best = '', bestN = 0
    for (const t of ALL_TYPES) {
      const n = teamPokes.filter((p) => { const e = getTypeEff(t, p.types); return e > 0 && e < 1 }).length
      if (n > bestN) { bestN = n; best = t }
    }
    return bestN > 0 ? { type: best, count: bestN } : null
  }, [teamPokes])

  if (teamPokes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
        <div className="text-4xl opacity-15">🔮</div>
        <p className="text-surface-500 text-sm font-semibold">Add Pokémon to your team</p>
        <p className="text-surface-700 text-xs">Switch to the 1v1 or matrix tabs to configure your team, then come back here.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 flex flex-col gap-4 max-w-full">

        {/* ── Insights ── */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: 'rgba(8,12,24,0.97)', border: '1px solid rgba(51,65,85,0.4)' }}
        >
          <div className="px-3 py-2 border-b border-surface-700/30">
            <span className="text-[10px] font-black tracking-widest uppercase text-primary-400">Insights</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-surface-700/30">
            {/* Offensive */}
            <div className="px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-orange-400 mb-2">⚔ Offensive coverage</div>
              {offInsights.map((p) => (
                <InsightRow key={p.name} poke={p}>
                  Can hit <strong>{p.se}</strong> types SE
                  {p.nve > 0 && <>, <span className="text-surface-600">{p.nve} not very effective</span></>}
                  {p.imm > 0 && <>, <span className="text-surface-700">{p.imm} immune</span></>}
                </InsightRow>
              ))}
              {bestOffType && (
                <div className="mt-2 rounded px-2 py-1.5 text-[10px]" style={{ background: 'rgba(30,41,59,0.6)' }}>
                  <span className="text-surface-500">Best covered:</span>{' '}
                  <TypeBadge type={bestOffType.type} />
                  <span className="text-surface-500 ml-1">({bestOffType.count} members hit SE)</span>
                </div>
              )}
            </div>
            {/* Defensive */}
            <div className="px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 mb-2">🛡 Defensive profile</div>
              {defInsights.map((p) => (
                <InsightRow key={p.name} poke={p}>
                  {p.imm > 0 && <><strong>{p.imm}</strong> immune, </>}
                  <strong>{p.resist}</strong> resists
                  {p.weak > 0 && (
                    <>, <span className="text-red-400">{p.weak} weak{p.quad > 0 ? ` (${p.quad}×4)` : ''}</span></>
                  )}
                </InsightRow>
              ))}
              {bestDefType && (
                <div className="mt-2 rounded px-2 py-1.5 text-[10px]" style={{ background: 'rgba(30,41,59,0.6)' }}>
                  <span className="text-surface-500">Most resisted by:</span>{' '}
                  <TypeBadge type={bestDefType.type} />
                  <span className="text-surface-500 ml-1">({bestDefType.count} members)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Coverage matrices ── */}
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: 'rgba(8,12,24,0.97)', border: '1px solid rgba(51,65,85,0.4)' }}
          >
            <div className="px-3 py-2 border-b border-surface-700/30">
              <span className="text-[10px] font-black tracking-widest uppercase text-orange-400">⚔ Offensive Coverage</span>
              <p className="text-[9px] text-surface-600 mt-0.5">Your team's STAB coverage vs each defender type</p>
            </div>
            <div className="p-2">
              <CovTable teamPokes={teamPokes} mode="offense" />
            </div>
          </div>

          <div
            className="rounded-lg overflow-hidden"
            style={{ background: 'rgba(8,12,24,0.97)', border: '1px solid rgba(51,65,85,0.4)' }}
          >
            <div className="px-3 py-2 border-b border-surface-700/30">
              <span className="text-[10px] font-black tracking-widest uppercase text-cyan-400">🛡 Defensive Coverage</span>
              <p className="text-[9px] text-surface-600 mt-0.5">Your team's resistances and weaknesses</p>
            </div>
            <div className="p-2">
              <CovTable teamPokes={teamPokes} mode="defense" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
