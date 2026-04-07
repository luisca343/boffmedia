// Default filters for PC filter system
export const DEFAULT_FILTERS: PokemonFilter = {
  minLevel: 1,
  maxLevel: 100
}
import { useState, useCallback, useMemo } from 'react'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { 
  PokemonFilter, 
  FilterSort, 
  FilterState, 
  FilterBoxData,
  getFilterBoxNumber 
} from '../types/filter.types'
import { 
  filterAndSortPokemon, 
  paginateResults, 
  getFilterOptions, 
  hasActiveFilters,
  clearAllFilters
} from '../utils/filterUtils'

interface UseFilterManagementProps {
  allPokemon: PCPokemon[]
  currentBox: number
  onBoxDataUpdate: (boxData: FilterBoxData) => void
}

const RESULTS_PER_PAGE = 30 // Same as normal box capacity

export function useFilterManagement({ 
  allPokemon, 
  currentBox, 
  onBoxDataUpdate 
}: UseFilterManagementProps) {
    const [filterState, setFilterState] = useState<FilterState>({
      isActive: false,
      searchTerm: '',
      filters: { ...DEFAULT_FILTERS },
      sort: { field: 'dex', direction: 'asc' },
      currentPage: 1,
      resultsPerPage: RESULTS_PER_PAGE
    })

  // Memoized filter options based on all Pokemon
  const filterOptions = useMemo(() => 
    getFilterOptions(allPokemon), 
    [allPokemon]
  )

  // Memoized filtered and sorted results
  const filteredResults = useMemo(() => {
    if (!filterState.isActive || !hasActiveFilters(filterState.filters)) {
      return { pokemon: [], totalResults: 0, totalPages: 0, currentPage: 1 }
    }

    const filtered = filterAndSortPokemon(
      allPokemon, 
      filterState.filters, 
      filterState.sort
    )

    return paginateResults(
      filtered, 
      filterState.currentPage, 
      filterState.resultsPerPage
    )
  }, [allPokemon, filterState.filters, filterState.sort, filterState.currentPage])

  // Apply filters and activate filter mode
  const applyFilters = useCallback((
    filters: PokemonFilter, 
    sort: FilterSort = filterState.sort
  ) => {
    const newState: FilterState = {
      isActive: true,
      searchTerm: filters.search || '',
      filters,
      sort,
      currentPage: 1,
      resultsPerPage: RESULTS_PER_PAGE
    }

    setFilterState(newState)

    // Create filter box data
    const results = filterAndSortPokemon(allPokemon, filters, sort)
    const paginatedResults = paginateResults(results, 1, RESULTS_PER_PAGE)

    // Pad results to fill box (30 slots)
    const paddedPokemon: (PCPokemon | null)[] = [
      ...paginatedResults.pokemon,
      ...Array(RESULTS_PER_PAGE - paginatedResults.pokemon.length).fill(null)
    ]

    // Create mapping from filter slot index to original position
    const originalPositions = new Map<number, { box: number; index: number }>()
    paginatedResults.pokemon.forEach((pokemon, filterIndex) => {
      if (pokemon) {
        originalPositions.set(filterIndex, {
          box: pokemon.box,
          index: pokemon.index
        })
      }
    })

    const filterBoxData: FilterBoxData = {
      type: 'filter',
      boxNumber: getFilterBoxNumber(paginatedResults.currentPage),
      title: getFilterTitle(filters, paginatedResults.currentPage),
      pokemon: paddedPokemon,
      originalBoxNumber: currentBox,
      filterState: newState,
      resultSummary: {
        totalResults: paginatedResults.totalResults,
        currentPage: paginatedResults.currentPage,
        totalPages: paginatedResults.totalPages
      },
      originalPositions
    }

    onBoxDataUpdate(filterBoxData)
  }, [allPokemon, currentBox, filterState.sort, onBoxDataUpdate])

  // Quick search (preserves existing filters and adds/updates search term)
  const quickSearch = useCallback((
    searchTerm: string, 
    sort: FilterSort = filterState.sort
  ) => {
    const combinedFilters: PokemonFilter = {
      ...filterState.filters,
      search: searchTerm || undefined // Remove search if empty
    }
    
    applyFilters(combinedFilters, sort)
  }, [applyFilters, filterState.filters, filterState.sort])

  // Combined search and filter function  
  const applySearchAndFilters = useCallback((
    searchTerm: string,
    filters: PokemonFilter,
    sort: FilterSort = filterState.sort
  ) => {
    const combinedFilters: PokemonFilter = {
      ...filters,
      search: searchTerm || undefined
    }

    applyFilters(combinedFilters, sort)
  }, [applyFilters, filterState.sort])

  // Navigate between filter result pages (with looping)
  const navigateFilterPage = useCallback((direction: 'prev' | 'next') => {
    if (!filterState.isActive) return

    const totalPages = filteredResults.totalPages
    if (totalPages <= 1) return // No navigation needed with only one page

    let newPage: number
    if (direction === 'prev') {
      // Loop to last page if at first page, otherwise go to previous
      newPage = filterState.currentPage === 1 ? totalPages : filterState.currentPage - 1
    } else {
      // Loop to first page if at last page, otherwise go to next
      newPage = filterState.currentPage === totalPages ? 1 : filterState.currentPage + 1
    }

    if (newPage === filterState.currentPage) return

    const newState = { 
      ...filterState, 
      currentPage: newPage 
    }
    setFilterState(newState)

    // Update box data with new page
    const results = filterAndSortPokemon(allPokemon, filterState.filters, filterState.sort)
    const paginatedResults = paginateResults(results, newPage, RESULTS_PER_PAGE)

    const paddedPokemon: (PCPokemon | null)[] = [
      ...paginatedResults.pokemon,
      ...Array(RESULTS_PER_PAGE - paginatedResults.pokemon.length).fill(null)
    ]

    // Create mapping from filter slot index to original position
    const originalPositions = new Map<number, { box: number; index: number }>()
    paginatedResults.pokemon.forEach((pokemon, filterIndex) => {
      if (pokemon) {
        originalPositions.set(filterIndex, {
          box: pokemon.box,
          index: pokemon.index
        })
      }
    })

    const filterBoxData: FilterBoxData = {
      type: 'filter',
      boxNumber: getFilterBoxNumber(newPage),
      title: getFilterTitle(filterState.filters, newPage),
      pokemon: paddedPokemon,
      originalBoxNumber: currentBox,
      filterState: newState,
      resultSummary: {
        totalResults: paginatedResults.totalResults,
        currentPage: paginatedResults.currentPage,
        totalPages: paginatedResults.totalPages
      },
      originalPositions
    }

    onBoxDataUpdate(filterBoxData)
  }, [filterState, filteredResults.totalPages, allPokemon, currentBox, onBoxDataUpdate])

  // Clear all filters and return to normal box view
  const clearFilters = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      isActive: false,
      searchTerm: '',
      filters: { ...DEFAULT_FILTERS },
      currentPage: 1
    }))
    // ...existing code...
  }, [])

  // Update sort without changing filters
  const updateSort = useCallback((sort: FilterSort) => {
    if (!filterState.isActive) return

    const newState = { 
      ...filterState, 
      sort,
      currentPage: 1 // Reset to first page when sorting
    }
    setFilterState(newState)

    // Re-apply filters with new sort
    applyFilters(filterState.filters, sort)
  }, [filterState, applyFilters])

  // Optimistic filter update: immediately update filter results assuming a Pokemon move will succeed
  const optimisticFilterUpdate = useCallback((
    updatedPcData: PCPokemon[]
  ): FilterBoxData | null => {
    if (!filterState.isActive) return null

    const results = filterAndSortPokemon(updatedPcData, filterState.filters, filterState.sort)
    const paginatedResults = paginateResults(results, filterState.currentPage, RESULTS_PER_PAGE)

    const paddedPokemon: (PCPokemon | null)[] = [
      ...paginatedResults.pokemon,
      ...Array(RESULTS_PER_PAGE - paginatedResults.pokemon.length).fill(null)
    ]

    // Create mapping from filter slot index to original position
    const originalPositions = new Map<number, { box: number; index: number }>()
    paginatedResults.pokemon.forEach((pokemon, filterIndex) => {
      if (pokemon) {
        originalPositions.set(filterIndex, {
          box: pokemon.box,
          index: pokemon.index
        })
      }
    })

    const filterBoxData: FilterBoxData = {
      type: 'filter',
      boxNumber: getFilterBoxNumber(filterState.currentPage),
      title: getFilterTitle(filterState.filters, filterState.currentPage),
      pokemon: paddedPokemon,
      originalBoxNumber: currentBox,
      filterState: filterState,
      resultSummary: {
        totalResults: paginatedResults.totalResults,
        currentPage: paginatedResults.currentPage,
        totalPages: paginatedResults.totalPages
      },
      originalPositions
    }

    onBoxDataUpdate(filterBoxData)
    return filterBoxData
  }, [filterState, currentBox, onBoxDataUpdate])

  // Refresh current filter results (called when Pokemon data changes)
  const refreshFilterResults = useCallback(() => {
    return optimisticFilterUpdate(allPokemon)
  }, [optimisticFilterUpdate, allPokemon])

  // Rollback filter to previous state
  const rollbackFilter = useCallback((previousFilterBoxData: FilterBoxData | null) => {
    if (previousFilterBoxData && filterState.isActive) {
      onBoxDataUpdate(previousFilterBoxData)
    }
  }, [filterState.isActive, onBoxDataUpdate])

  return {
    filterState,
    filterOptions,
    filteredResults,
    applyFilters,
    quickSearch,
    applySearchAndFilters,
    navigateFilterPage,
    clearFilters,
    updateSort,
    refreshFilterResults,
    optimisticFilterUpdate,
    rollbackFilter,
    isFilterActive: filterState.isActive,
    hasFilters: hasActiveFilters(filterState.filters)
  }
}

// Helper function to generate filter box titles
function getFilterTitle(filters: PokemonFilter, page: number): string {
  if (filters.search) {
    return `Búsqueda: "${filters.search}" (${page})`
  }
  
  if (filters.types && filters.types.length > 0) {
    const typeString = filters.types.length === 1 
      ? filters.types[0]
      : `${filters.types.length} tipos`
    return `Filtro: ${typeString} (${page})`
  }
  
  const activeFilters = []
  if (filters.isShiny) activeFilters.push('Shiny')
  if (filters.isLegendary) activeFilters.push('Legendario')
  if (filters.hasItem) activeFilters.push('Con objeto')
  if (filters.minLevel || filters.maxLevel) {
    if (filters.minLevel && filters.maxLevel) {
      activeFilters.push(`Nv.${filters.minLevel}-${filters.maxLevel}`)
    } else if (filters.minLevel) {
      activeFilters.push(`Nv.${filters.minLevel}+`)
    } else if (filters.maxLevel) {
      activeFilters.push(`Nv.${filters.maxLevel}-`)
    }
  }
  
  if (activeFilters.length > 0) {
    const filterString = activeFilters.length === 1 
      ? activeFilters[0]
      : `${activeFilters.length} filtros`
    return `Filtro: ${filterString} (${page})`
  }
  
  return `Resultados (${page})`
}
