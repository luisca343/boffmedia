/**
 * The 25 natures, and the one question anybody asks of them: which stat does
 * this nature raise, and which does it lower.
 *
 * A plain module rather than a constant inside `usePokemonData`, which is a
 * `'use client'` hook file that also pulls `VgcService`: the spread solver
 * below it is pure arithmetic and has no business dragging a data service and
 * React into a battle's damage panel. `usePokemonData` re-exports from here, so
 * there is still exactly one table.
 */

export interface NatureData {
  name: string
  plus: string | null
  minus: string | null
}

export const NATURES: NatureData[] = [
  { name: 'Adamant', plus: 'atk',  minus: 'spa' },
  { name: 'Bashful', plus: null,   minus: null  },
  { name: 'Bold',    plus: 'def',  minus: 'atk' },
  { name: 'Brave',   plus: 'atk',  minus: 'spe' },
  { name: 'Calm',    plus: 'spd',  minus: 'atk' },
  { name: 'Careful', plus: 'spd',  minus: 'spa' },
  { name: 'Docile',  plus: null,   minus: null  },
  { name: 'Gentle',  plus: 'spd',  minus: 'def' },
  { name: 'Hardy',   plus: null,   minus: null  },
  { name: 'Hasty',   plus: 'spe',  minus: 'def' },
  { name: 'Impish',  plus: 'def',  minus: 'spa' },
  { name: 'Jolly',   plus: 'spe',  minus: 'spa' },
  { name: 'Lax',     plus: 'def',  minus: 'spd' },
  { name: 'Lonely',  plus: 'atk',  minus: 'def' },
  { name: 'Mild',    plus: 'spa',  minus: 'def' },
  { name: 'Modest',  plus: 'spa',  minus: 'atk' },
  { name: 'Naive',   plus: 'spe',  minus: 'spd' },
  { name: 'Naughty', plus: 'atk',  minus: 'spd' },
  { name: 'Quiet',   plus: 'spa',  minus: 'spe' },
  { name: 'Quirky',  plus: null,   minus: null  },
  { name: 'Rash',    plus: 'spa',  minus: 'spd' },
  { name: 'Relaxed', plus: 'def',  minus: 'spe' },
  { name: 'Sassy',   plus: 'spd',  minus: 'spe' },
  { name: 'Serious', plus: null,   minus: null  },
  { name: 'Timid',   plus: 'spe',  minus: 'atk' },
]

/** How a nature scales one stat: `'plus'`, `'minus'` or `'neutral'`. */
export type NatureEffect = 'plus' | 'minus' | 'neutral'

export function natureEffect(nature: string, stat: string): NatureEffect {
  const n = NATURES.find((x) => x.name === nature)
  if (!n) return 'neutral'
  if (n.plus === stat) return 'plus'
  if (n.minus === stat) return 'minus'
  return 'neutral'
}

/**
 * A nature that produces the requested effect on `stat`, for probing the stat
 * formula. `Serious` for neutral; the rest are arbitrary members of their class
 * — only the multiplier matters here, never the name.
 */
export function probeNature(stat: string, effect: NatureEffect): string {
  if (effect === 'neutral') return 'Serious'
  const found = NATURES.find((n) => (effect === 'plus' ? n.plus : n.minus) === stat)
  return found?.name ?? 'Serious'
}
