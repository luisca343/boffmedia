import { PCPokemon } from '@/types/dto/pc-pokemon.dto'

export interface PokemonFilter {
  // Search criteria
  search?: string // Name, nickname, or Pokédex number
  
  // Type filters (multi-select)
  types?: string[]
  
  // Level range
  minLevel?: number
  maxLevel?: number
  
  // Special statuses
  isShiny?: boolean
  isLegendary?: boolean
  hasItem?: boolean
  isFavorited?: boolean
  
  // Gender filter
  gender?: 'male' | 'female' | 'genderless'
  
  // Nature filter
  nature?: string
  
  // Ability filter
  ability?: string
}

export interface FilterSort {
  field: 'level' | 'dex' | 'name' | 'dateAdded'
  direction: 'asc' | 'desc'
}

export interface FilterState {
  isActive: boolean
  searchTerm: string // Add search term to state
  filters: PokemonFilter
  sort: FilterSort
  currentPage: number
  resultsPerPage: number
}

export interface FilterResult {
  pokemon: PCPokemon[]
  totalResults: number
  totalPages: number
  currentPage: number
}

export interface FilterBoxData {
  type: 'filter'
  boxNumber: number // This will be a virtual filter box number (e.g., 1000, 1001, 1002...)
  title: string
  pokemon: (PCPokemon | null)[]
  originalBoxNumber: number // The box that was filtered
  filterState: FilterState
  resultSummary: {
    totalResults: number
    currentPage: number
    totalPages: number
  }
  // Map from filter slot index to original position - can be Map or object after serialization
  originalPositions: Map<number, { box: number; index: number }> | Record<string, { box: number; index: number }>
}

// POKEMON TYPES for filtering
export const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
] as const

export type PokemonType = typeof POKEMON_TYPES[number]

// LEGENDARY POKEMON (based on Pokédex numbers)
export const LEGENDARY_POKEMON_IDS = [
  144, 145, 146, 150, 151, // Gen 1 legendaries
  243, 244, 245, 249, 250, 251, // Gen 2 legendaries
  377, 378, 379, 380, 381, 382, 383, 384, // Gen 3 legendaries
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, // Gen 4 legendaries
] as const

// FILTER BOX CONSTANTS
export const FILTER_BOX_START = 1000 // Filter boxes start at 1000 to avoid conflicts with normal boxes
export const isFilterBox = (boxNumber: number) => boxNumber >= FILTER_BOX_START
export const getFilterBoxNumber = (page: number) => FILTER_BOX_START + page - 1
export const getFilterPageFromBoxNumber = (boxNumber: number) => boxNumber - FILTER_BOX_START + 1
