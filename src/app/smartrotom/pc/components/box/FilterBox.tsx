import { useCallback } from 'react'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'
import { FilterBoxData } from '../../types/filter.types'
import { usePCWithFilters } from '../../hooks/usePCWithFilters'

interface FilterBoxProps {
  uuid: string
  pcData: PCPokemon[]
  teamData: (PokemonW | null)[]
  onPCDataUpdate: (data: PCPokemon[]) => void
  currentBox: number
  onBoxChange: (boxNumber: number) => void
  onPokemonMove: (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => Promise<void>
  children: (filterBoxProps: FilterBoxRenderProps) => React.ReactNode
}

export interface FilterBoxRenderProps {
  // Filter state
  isFilterActive: boolean
  filterBoxData: FilterBoxData | null
  filterState: any
  filterOptions: any

  // Dialog states
  showSearchDialog: boolean
  showFilterPanel: boolean
  setShowSearchDialog: (show: boolean) => void
  setShowFilterPanel: (show: boolean) => void

  // Handlers
  handleShowFilters: () => void
  handleApplyFilters: (filters: any) => void
  handleClearFilters: () => void
  handlePokemonRemovedFromFilter: (filterSlotIndex: number) => void

  // Utilities
  canDropIntoSlot: (targetBoxNumber: number, targetIndex: number) => boolean
  updateSort: (sort: any) => void
  navigateFilterPage: (direction: 'prev' | 'next') => void

  // Optimistic updates
  optimisticPokemonMove: (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => Promise<void>
}

export function FilterBox({
  uuid,
  pcData,
  teamData,
  onPCDataUpdate,
  currentBox,
  onBoxChange,
  onPokemonMove,
  children
}: FilterBoxProps) {
  // Filter system integration
  const {
    isFilterActive,
    filterBoxData,
    filterState,
    filterOptions,
    showSearchDialog,
    showFilterPanel,
    setShowSearchDialog,
    setShowFilterPanel,
    handleShowFilters,
    handleApplyFilters,
    handleClearFilters,
    canDropIntoSlot,
    updateSort,
    navigateFilterPage,
    handlePokemonRemovedFromFilter,
    optimisticFilterUpdate,
    rollbackFilter
  } = usePCWithFilters({
    uuid,
    pcData,
    onPCDataUpdate,
    currentBox,
    onBoxChange
  })

  // Helper function to simulate Pokemon move for optimistic filter updates
  const simulatePokemonMove = useCallback((
    currentPcData: PCPokemon[],
    currentTeamData: (PokemonW | null)[],
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ): PCPokemon[] => {
    if (source.type === 'box' && destination.type === 'box') {
      // Box to box move
      const sourcePokemon = currentPcData.find(p => p.box === source.boxNumber && p.index === source.index)
      const destinationPokemon = currentPcData.find(p => p.box === destination.boxNumber && p.index === destination.index)
      
      if (!sourcePokemon) return currentPcData

      if (destinationPokemon) {
        // Swap positions
        return currentPcData.map(p => {
          if (p.box === source.boxNumber && p.index === source.index) {
            return { ...p, box: destination.boxNumber!, index: destination.index }
          } else if (p.box === destination.boxNumber && p.index === destination.index) {
            return { ...p, box: source.boxNumber!, index: source.index }
          }
          return p
        })
      } else {
        // Move to empty slot
        return currentPcData.map(p => 
          p.box === source.boxNumber && p.index === source.index
            ? { ...p, box: destination.boxNumber!, index: destination.index }
            : p
        )
      }
    } else if (source.type === 'team' && destination.type === 'box') {
      // Team to box move - Pokemon is added to PC
      const sourcePokemon = currentTeamData[source.index]
      if (!sourcePokemon) return currentPcData

      const destinationPokemon = currentPcData.find(p => p.box === destination.boxNumber && p.index === destination.index)
      
      if (destinationPokemon) {
        // Swap - remove destination Pokemon from PC and add team Pokemon
        const filteredPcData = currentPcData.filter(p => !(p.box === destination.boxNumber && p.index === destination.index))
        const newPcPokemon: PCPokemon = {
          box: destination.boxNumber!,
          index: destination.index,
          pokemon: sourcePokemon as any
        }
        return [...filteredPcData, newPcPokemon]
      } else {
        const newPcPokemon: PCPokemon = {
          box: destination.boxNumber!,
          index: destination.index,
          pokemon: sourcePokemon as any
        }
        return [...currentPcData, newPcPokemon]
      }
    } else if (source.type === 'box' && destination.type === 'team') {
        const sourcePokemon = currentPcData.find(p => p.box === source.boxNumber && p.index === source.index)
        return currentPcData.map(p => {
            if (p.box === source.boxNumber && p.index === source.index) {
                return { ...p, pokemon: currentTeamData[destination.index] as any }
            }
            return p
        })
    }

    // Team to team moves don't affect PC data
    return currentPcData
  }, [])

  // Optimistic Pokemon move handler with filter updates
  const optimisticPokemonMove = useCallback(async (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => {
    // Store current filter state for potential rollback
    let previousFilterBoxData: FilterBoxData | null = null
    if (isFilterActive && filterBoxData) {
      previousFilterBoxData = JSON.parse(JSON.stringify(filterBoxData))
    }

    try {
      // 1. Simulate what the PC data will look like after the move for filter update
      if (isFilterActive) {
        const simulatedPcData = simulatePokemonMove(pcData, teamData, source, destination)
        optimisticFilterUpdate(simulatedPcData)
      }

      // 2. Perform the actual Pokemon move (optimistic update)
      await onPokemonMove(source, destination)

      // Success - both Pokemon move and filter update were successful
    } catch (error) {
      console.error('Error in optimistic Pokemon move:', error)
      
      // 3. Rollback filter state if it was updated
      if (previousFilterBoxData && isFilterActive) {
        rollbackFilter(previousFilterBoxData)
      }
      
      // Pokemon move rollback is handled by usePokemonMovement
      throw error // Re-throw to maintain error handling flow
    }
  }, [onPokemonMove, isFilterActive, filterBoxData, optimisticFilterUpdate, rollbackFilter, pcData, teamData, simulatePokemonMove])

  // Create the render props object
  const filterBoxRenderProps: FilterBoxRenderProps = {
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
    handlePokemonRemovedFromFilter,

    // Utilities
    canDropIntoSlot,
    updateSort,
    navigateFilterPage,

    // Optimistic updates
    optimisticPokemonMove
  }

  return children(filterBoxRenderProps)
}
