import { useState, useCallback, useMemo, useEffect } from 'react'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { FilterBoxData, PokemonFilter, FilterSort, isFilterBox, getFilterPageFromBoxNumber } from '../_types/filter.types'
import { useFilterManagement } from './useFilterManagement'

interface UsePCWithFiltersProps {
  uuid: string
  pcData: PCPokemon[]
  onPCDataUpdate: (data: PCPokemon[]) => void
  currentBox: number
  onBoxChange: (boxNumber: number) => void
  onPokemonMoved?: () => void // Optional callback for when Pokemon are moved
}

export function usePCWithFilters({
  uuid,
  pcData,
  onPCDataUpdate,
  currentBox,
  onBoxChange
}: UsePCWithFiltersProps) {
  const [filterBoxData, setFilterBoxData] = useState<FilterBoxData | null>(null)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // Filter management
  const {
    filterState,
    filterOptions,
    applyFilters,
    quickSearch,
    applySearchAndFilters,
    navigateFilterPage,
    clearFilters,
    updateSort,
    refreshFilterResults,
    optimisticFilterUpdate,
    rollbackFilter,
    isFilterActive
  } = useFilterManagement({
    allPokemon: pcData,
    currentBox,
    onBoxDataUpdate: setFilterBoxData
  })

  // Remove automatic refresh - we'll handle this optimistically now
  // useEffect(() => {
  //   if (isFilterActive) {
  //     refreshFilterResults()
  //   }
  // }, [pcData, isFilterActive, refreshFilterResults])

  // Handle filter panel
  const handleShowFilters = useCallback(() => {
    setShowFilterPanel(true)
  }, [])

  const handleApplyFilters = useCallback((searchTerm: string, filters: PokemonFilter, sort?: FilterSort) => {
    applySearchAndFilters(searchTerm, filters, sort)
  }, [applySearchAndFilters])

  // Handle clearing filters
  const handleClearFilters = useCallback(() => {
    clearFilters()
    setFilterBoxData(null)
    // Return to the original box
  }, [clearFilters])

  // Handle Pokemon removal from filter box
  const handlePokemonRemovedFromFilter = useCallback((filterSlotIndex: number) => {
    // No need to manually update filter box - refreshFilterResults will handle it
    // This function is kept for compatibility but the useEffect above will refresh the filter automatically
  }, [])

  // Handle filter navigation
  const handleFilterNavigation = useCallback((boxNumber: number) => {
    if (!isFilterActive || !filterBoxData) return

    // Check if this is a filter box navigation
    if (!isFilterBox(boxNumber)) return

    const targetPage = getFilterPageFromBoxNumber(boxNumber)
    const currentPage = filterBoxData.resultSummary.currentPage
    const totalPages = filterBoxData.resultSummary.totalPages

    // Navigate to the target page if it's valid
    if (targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
      if (targetPage > currentPage) {
        navigateFilterPage('next')
      } else {
        navigateFilterPage('prev')
      }
    }
  }, [isFilterActive, filterBoxData, navigateFilterPage])

  // Validate if a drop operation is allowed
  const canDropIntoSlot = useCallback((
    targetBoxNumber: number,
    targetIndex: number
  ): boolean => {
    // Can't drop into filter boxes (they're virtual)
    if (isFilterBox(targetBoxNumber)) {
      return false
    }
    return true
  }, [])

  // Get the current box data (either normal or filter)
  const getCurrentBoxData = useCallback(() => {
    return filterBoxData || null
  }, [filterBoxData])

  // Function to trigger filter refresh from outside
  const triggerFilterRefresh = useCallback(() => {
    if (isFilterActive) {
      refreshFilterResults()
    }
  }, [isFilterActive, refreshFilterResults])

  return {
    // Filter state
    isFilterActive,
    filterBoxData,
    filterState,
    filterOptions,

    // Dialog states
    showSearchDialog,
    showFilterPanel,
    setShowSearchDialog,
    setShowFilterPanel,

    // Handlers
    handleShowFilters,
    handleApplyFilters,
    handleClearFilters,
    handleFilterNavigation,
    handlePokemonRemovedFromFilter,

    // Utilities
    canDropIntoSlot,
    getCurrentBoxData,

    // Filter management
    updateSort,
    navigateFilterPage,
    triggerFilterRefresh,
    optimisticFilterUpdate,
    rollbackFilter
  }
}
