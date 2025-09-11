import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonFilter, FilterSort, LEGENDARY_POKEMON_IDS } from '../types/filter.types'

/**
 * Check if a Pokémon matches the given filters
 */
export function matchesPokemonFilters(pokemon: PCPokemon, filters: PokemonFilter): boolean {
  const pokemonData = pokemon.pokemon

  // Search filter (name, nickname, or Pokédex number)
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    const pokemonName = pokemonData.species?.toLowerCase() || ''
    const pokemonNickname = pokemonData.name?.toLowerCase() || ''
    const pokemonDex = pokemonData.dex?.toString() || ''
    
    if (!pokemonName.includes(searchTerm) && 
        !pokemonNickname.includes(searchTerm) && 
        !pokemonDex.includes(searchTerm)) {
      return false
    }
  }

  // Type filters (multi-select)
  if (filters.types && filters.types.length > 0) {
    const pokemonTypes = pokemonData.types || []
    const hasMatchingType = filters.types.some(filterType => 
      pokemonTypes.some(pokemonType => 
        pokemonType?.toLowerCase() === filterType.toLowerCase()
      )
    )
    if (!hasMatchingType) {
      return false
    }
  }

  // Level range
  if (filters.minLevel !== undefined && pokemonData.level < filters.minLevel) {
    return false
  }
  if (filters.maxLevel !== undefined && pokemonData.level > filters.maxLevel) {
    return false
  }

  // Shiny filter
  if (filters.isShiny !== undefined) {
    const isShiny = pokemonData.palette === 'shiny'
    if (filters.isShiny !== isShiny) {
      return false
    }
  }

  // Legendary filter
  if (filters.isLegendary !== undefined) {
    const isLegendary = LEGENDARY_POKEMON_IDS.includes(pokemonData.dex as any)
    if (filters.isLegendary !== isLegendary) {
      return false
    }
  }

  // Has item filter
  if (filters.hasItem !== undefined) {
    const hasItem = pokemonData.item && 
                   pokemonData.item !== 'item.minecraft.air' && 
                   pokemonData.item !== 'none'
    if (filters.hasItem !== hasItem) {
      return false
    }
  }

  // Gender filter
  if (filters.gender) {
    const pokemonGender = pokemonData.gender?.toLowerCase()
    if (filters.gender === 'genderless') {
      if (pokemonGender && pokemonGender !== 'none' && pokemonGender !== 'genderless') {
        return false
      }
    } else {
      if (pokemonGender !== filters.gender) {
        return false
      }
    }
  }

  // Nature filter
  if (filters.nature) {
    const pokemonNature = pokemonData.nature?.toLowerCase()
    if (pokemonNature !== filters.nature.toLowerCase()) {
      return false
    }
  }

  // Ability filter
  if (filters.ability) {
    const pokemonAbility = pokemonData.ability?.toLowerCase()
    if (pokemonAbility !== filters.ability.toLowerCase()) {
      return false
    }
  }

  return true
}

/**
 * Sort Pokémon based on the given sort criteria
 */
export function sortPokemon(pokemon: PCPokemon[], sort: FilterSort): PCPokemon[] {
  return [...pokemon].sort((a, b) => {
    let comparison = 0

    switch (sort.field) {
      case 'level':
        comparison = a.pokemon.level - b.pokemon.level
        break
      case 'dex':
        comparison = a.pokemon.dex - b.pokemon.dex
        break
      case 'name':
        comparison = a.pokemon.species.localeCompare(b.pokemon.species)
        break
      case 'dateAdded':
        // For now, use box and index as a proxy for date added
        // In the future, this could be a proper timestamp
        comparison = (a.box * 1000 + a.index) - (b.box * 1000 + b.index)
        break
      default:
        comparison = 0
    }

    return sort.direction === 'desc' ? -comparison : comparison
  })
}

/**
 * Filter and sort all Pokémon from PC data
 */
export function filterAndSortPokemon(
  allPokemon: PCPokemon[], 
  filters: PokemonFilter, 
  sort: FilterSort
): PCPokemon[] {
  // First filter
  let filteredPokemon = allPokemon.filter(pokemon => 
    matchesPokemonFilters(pokemon, filters)
  )

  // Then sort
  filteredPokemon = sortPokemon(filteredPokemon, sort)

  return filteredPokemon
}

/**
 * Paginate filtered results
 */
export function paginateResults(
  pokemon: PCPokemon[], 
  page: number, 
  itemsPerPage: number
): {
  pokemon: PCPokemon[]
  totalResults: number
  totalPages: number
  currentPage: number
} {
  const totalResults = pokemon.length
  const totalPages = Math.ceil(totalResults / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPokemon = pokemon.slice(startIndex, endIndex)

  return {
    pokemon: paginatedPokemon,
    totalResults,
    totalPages,
    currentPage: page
  }
}

/**
 * Get all unique values for filter options from PC data
 */
export function getFilterOptions(allPokemon: PCPokemon[]) {
  const types = new Set<string>()
  const natures = new Set<string>()
  const abilities = new Set<string>()
  let minLevel = Number.MAX_SAFE_INTEGER
  let maxLevel = 0

  allPokemon.forEach(pokemon => {
    const pokemonData = pokemon.pokemon

    // Collect types
    if (pokemonData.types) {
      pokemonData.types.forEach(type => {
        if (type) types.add(type.toLowerCase())
      })
    }

    // Collect natures
    if (pokemonData.nature) {
      natures.add(pokemonData.nature)
    }

    // Collect abilities
    if (pokemonData.ability) {
      abilities.add(pokemonData.ability)
    }

    // Track level range
    if (pokemonData.level < minLevel) minLevel = pokemonData.level
    if (pokemonData.level > maxLevel) maxLevel = pokemonData.level
  })

  return {
    types: Array.from(types).sort(),
    natures: Array.from(natures).sort(),
    abilities: Array.from(abilities).sort(),
    levelRange: { min: minLevel === Number.MAX_SAFE_INTEGER ? 1 : minLevel, max: maxLevel }
  }
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: PokemonFilter): boolean {
  return Boolean(
    filters.search ||
    (filters.types && filters.types.length > 0) ||
    filters.minLevel !== undefined ||
    filters.maxLevel !== undefined ||
    filters.isShiny !== undefined ||
    filters.isLegendary !== undefined ||
    filters.hasItem !== undefined ||
    filters.isFavorited !== undefined ||
    filters.gender ||
    filters.nature ||
    filters.ability
  )
}

/**
 * Clear all filters
 */
export function clearAllFilters(): PokemonFilter {
  return {}
}
