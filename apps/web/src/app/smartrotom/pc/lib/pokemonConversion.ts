import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@boffmedia/shared'

/**
 * Converts a PC Pokemon to a Team Pokemon format
 */
export const convertPCToTeam = (pcPokemon: PCPokemon): PokemonW => {
  return {
    ...pcPokemon.pokemon
  }
}

/**
 * Converts a Team Pokemon to a PC Pokemon format
 */
export const convertTeamToPC = (
  teamPokemon: PokemonW ,
  index: number,
  boxNumber: number
): PCPokemon => {
  return {
    pokemon: {
     ...teamPokemon
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
