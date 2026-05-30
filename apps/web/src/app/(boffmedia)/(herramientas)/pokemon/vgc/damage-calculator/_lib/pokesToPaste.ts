import type { CalcPokemon, StatKey } from '../_types/calculator'

const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe',
}

const STAT_ORDER: StatKey[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']

/**
 * Converts a list of CalcPokemon to Showdown/PokéPaste format string.
 * When useChampions is true, SP values (0–32) are converted to EVs via floor(sp * 252 / 32).
 */
export function pokesToPaste(pokeList: CalcPokemon[], useChampions = false): string {
  return pokeList
    .filter((p) => p.name)
    .map((poke) => {
      const lines: string[] = []

      const item = poke.item && poke.item !== 'None' ? ` @ ${poke.item}` : ''
      lines.push(`${poke.name}${item}`)

      if (poke.ability) lines.push(`Ability: ${poke.ability}`)
      if (poke.level !== 50) lines.push(`Level: ${poke.level}`)
      if (poke.teraType && poke.teraType !== 'None') lines.push(`Tera Type: ${poke.teraType}`)

      const evParts: string[] = []
      for (const key of STAT_ORDER) {
        let val = poke.evs[key]
        if (useChampions) val = Math.floor(val * 252 / 32)
        if (val > 0) evParts.push(`${val} ${STAT_LABELS[key]}`)
      }
      if (evParts.length) lines.push(`EVs: ${evParts.join(' / ')}`)

      lines.push(`${poke.nature} Nature`)

      const ivParts: string[] = []
      for (const key of STAT_ORDER) {
        const val = poke.ivs[key]
        if (val !== 31) ivParts.push(`${val} ${STAT_LABELS[key]}`)
      }
      if (ivParts.length) lines.push(`IVs: ${ivParts.join(' / ')}`)

      for (const move of poke.moves) {
        if (move.name) lines.push(`- ${move.name}`)
      }

      return lines.join('\n')
    })
    .join('\n\n')
}
