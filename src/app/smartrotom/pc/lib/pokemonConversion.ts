import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'

/**
 * Converts a PC Pokemon to a Team Pokemon format
 */
export const convertPCToTeam = (pcPokemon: PCPokemon): PokemonW => {
  return {
    dex: pcPokemon.pokemon.dex,
    nature: pcPokemon.pokemon.nature,
    species: pcPokemon.pokemon.species,
    form: pcPokemon.pokemon.form || undefined,
    palette: pcPokemon.pokemon.palette || undefined,
    name: pcPokemon.pokemon.name,
    level: pcPokemon.pokemon.level,
    item: pcPokemon.pokemon.item,
    ability: pcPokemon.pokemon.ability,
    moves: pcPokemon.pokemon.moves.filter(move => move !== null) as string[],
    ivs: pcPokemon.pokemon.ivs.map(iv => iv.toString()),
    evs: pcPokemon.pokemon.evs.map(ev => ev.toString()),
    stats: pcPokemon.pokemon.stats.map(stat => stat.toString())
  }
}

/**
 * Converts a Team Pokemon to a PC Pokemon format
 */
export const convertTeamToPC = (
  teamPokemon: PokemonW,
  index: number,
  boxNumber: number
): PCPokemon => {
  return {
    pokemon: {
      dex: teamPokemon.dex,
      nature: teamPokemon.nature,
      species: teamPokemon.species,
      form: teamPokemon.form || '',
      palette: teamPokemon.palette || 'none',
      name: teamPokemon.name,
      level: teamPokemon.level,
      item: teamPokemon.item,
      ability: teamPokemon.ability,
      moves: [...teamPokemon.moves, null, null, null, null].slice(0, 4) as (string | null)[],
      ivs: teamPokemon.ivs.map(iv => parseInt(iv)),
      evs: teamPokemon.evs.map(ev => parseInt(ev)),
      stats: teamPokemon.stats.map(stat => parseInt(stat)),
      types: []
    },
    index,
    box: boxNumber
  }
}

/**
 * Creates a normalized Pokemon move arrays ensuring 4 moves
 */
export const normalizeMoveArray = (moves: string[]): (string | null)[] => {
  return [...moves, null, null, null, null].slice(0, 4) as (string | null)[]
}

/**
 * Validates if a Pokemon object has required fields
 */
export const isValidPokemon = (pokemon: any): boolean => {
  return !!(
    pokemon &&
    pokemon.dex &&
    pokemon.species &&
    pokemon.name &&
    typeof pokemon.level === 'number'
  )
}

/**
 * Gets a unique identifier for a Pokemon
 */
export const getPokemonId = (pokemon: PCPokemon): string => {
  return `${pokemon.box}-${pokemon.index}`
}

/**
 * Creates a Pokemon copy with updated position
 */
export const updatePokemonPosition = (
  pokemon: PCPokemon,
  newIndex: number,
  newBox?: number
): PCPokemon => {
  return {
    ...pokemon,
    index: newIndex,
    box: newBox !== undefined ? newBox : pokemon.box
  }
}
