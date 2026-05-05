'use client'

import { calcStat, Generations } from '@smogon/calc'
import type { CalcPokemon, StatKey, BoostKey } from '../../_types/calculator'
import { NATURES } from '../../_hooks/usePokemonData'

const GEN9 = Generations.get(9)

const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
}

const STAT_KEYS: StatKey[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']

type BaseStats = { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }

interface Props {
  poke: CalcPokemon
  onChange: (patch: Partial<CalcPokemon>) => void
  useChampions?: boolean
  /** Optional baseStats from the API VgcPokemon entry — used when SPECIES_MAP lookup misses (e.g. forme name differences). */
  baseStats?: BaseStats
}

const BOOST_VALUES = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]

export function StatTable({ poke, onChange, useChampions = false, baseStats: apiBaseStats }: Props) {
  // Use API-provided baseStats — no @pkmn/dex fallback.
  const bs: BaseStats | undefined = apiBaseStats
  if (!bs) return null

  const nature = NATURES.find((n) => n.name === poke.nature)
  const plusStat = nature?.plus ?? null
  const minusStat = nature?.minus ?? null

  const evMax = useChampions ? 32 : 252
  const evTotal = useChampions ? 66 : 510

  const totalEvs = STAT_KEYS.reduce((sum, k) => sum + poke.evs[k], 0)

  function computeStat(key: StatKey): number {
    const ev = useChampions
      ? Math.floor((poke.evs[key] * 252) / 32)
      : poke.evs[key]
    return calcStat(GEN9, key, bs![key], poke.ivs[key], ev, poke.level, poke.nature)
  }

  function updateEv(key: StatKey, raw: string) {
    const val = Math.min(evMax, Math.max(0, parseInt(raw) || 0))
    onChange({ evs: { ...poke.evs, [key]: val } })
  }

  function updateIv(key: StatKey, raw: string) {
    const val = Math.min(31, Math.max(0, parseInt(raw) || 0))
    onChange({ ivs: { ...poke.ivs, [key]: val } })
  }

  const totalOver = totalEvs > evTotal

  function updateBoost(key: BoostKey, val: number) {
    onChange({ boosts: { ...poke.boosts, [key]: val } })
  }

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="border-b border-surface-700">
          <th className="text-left text-surface-500 font-semibold pb-1 pr-2">Stat</th>
          <th className="text-center text-surface-500 font-semibold pb-1 px-1">Base</th>
          <th className="text-center text-surface-500 font-semibold pb-1 px-1">Stage</th>
          <th className="text-center text-surface-500 font-semibold pb-1 px-1">IVs</th>
          <th className="text-center text-surface-500 font-semibold pb-1 px-1">
            {useChampions ? 'SP' : 'EVs'}
          </th>
          <th className="text-center text-surface-500 font-semibold pb-1 px-1">Total</th>
        </tr>
      </thead>
      <tbody>
        {STAT_KEYS.map((key) => {
          const isUp = plusStat === key
          const isDown = minusStat === key
          const computed = computeStat(key)
          const textClass = isUp
            ? 'text-success-400'
            : isDown
              ? 'text-error-400'
              : 'text-surface-300'
          const boost = key !== 'hp' ? poke.boosts[key as BoostKey] : 0
          const boostTextClass = boost > 0 ? 'text-success-400' : boost < 0 ? 'text-error-400' : 'text-surface-500'

          return (
            <tr key={key} className="border-b border-surface-800/50 last:border-0">
              <td className={`py-0.5 pr-2 font-semibold ${textClass}`}>
                {STAT_LABELS[key]}
                {isUp ? ' ↑' : isDown ? ' ↓' : ''}
              </td>
              <td className="text-center font-mono text-surface-400 px-1">
                {bs[key]}
              </td>
              <td className="text-center px-1">
                {key !== 'hp' ? (
                  <select
                    value={boost}
                    onChange={(e) => updateBoost(key as BoostKey, parseInt(e.target.value))}
                    className={`w-12 bg-surface-900 border border-surface-700 rounded text-center font-mono focus:outline-none focus:border-primary-500 text-xs py-0.5 ${boostTextClass}`}
                  >
                    {BOOST_VALUES.map((v) => (
                      <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-surface-600 text-[10px]">—</span>
                )}
              </td>
              <td className="text-center px-1">
                <input
                  type="number"
                  min={0}
                  max={31}
                  value={poke.ivs[key]}
                  onChange={(e) => updateIv(key, e.target.value)}
                  className="w-10 bg-surface-900 border border-surface-700 rounded text-center font-mono text-surface-200 focus:outline-none focus:border-primary-500 text-xs py-0.5"
                />
              </td>
              <td className="text-center px-1">
                <input
                  type="number"
                  min={0}
                  max={evMax}
                  step={useChampions ? 1 : 4}
                  value={poke.evs[key]}
                  onChange={(e) => updateEv(key, e.target.value)}
                  className={`w-10 bg-surface-900 border rounded text-center font-mono text-surface-200 focus:outline-none focus:border-primary-500 text-xs py-0.5 ${
                    totalOver ? 'border-error-500' : 'border-surface-700'
                  }`}
                />
              </td>
              <td className={`text-center font-mono font-bold px-1 ${textClass}`}>
                {computed}
              </td>
            </tr>
          )
        })}
        <tr className="border-t border-surface-700">
          <td colSpan={3} />
          <td
            className="pt-1 text-center text-surface-500 text-xs"
          >
            Total {useChampions ? 'SP' : 'EVs'}
          </td>
          <td
            className={`text-center font-mono font-bold pt-1 text-xs ${
              totalOver ? 'text-error-400' : 'text-surface-400'
            }`}
          >
            {totalEvs}
          </td>
          <td />
        </tr>
      </tbody>
    </table>
  )
}
