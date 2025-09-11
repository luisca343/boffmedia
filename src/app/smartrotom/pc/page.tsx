'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBoffSession } from "@/services/useBoffSession"
import { WingullService } from '@/services/api/smartrotom/wingullService'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'
import { FilterBoxData } from './types/filter.types'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ROWS_PER_BOX, COLS_PER_ROW } from './utils/constants'
import { useGetBattleTeams } from '@/hooks/player/useGetBattleTeams'
import { usePCManagement } from './hooks/usePCManagement'
import { usePCWithFilters } from './hooks/usePCWithFilters'
import PCHeader from './components/layout/PCHeader'
import BoxSelectionDialog from './components/box/BoxSelectionDialog'
import TeamPanel from './components/team/TeamPanel'
import BattleTeamsPanel from './components/team/BattleTeamsPanel'
import DualBoxGrid from './components/box/DualBoxGrid'
import PokemonDetails from './components/details/PokemonDetails'
import LoadingOverlay from './components/layout/LoadingOverlay'
import { FilterPanel } from './components/filter/FilterPanel'
import PlayOnMountAudio from '@components/common/PlayOnMountAudio'
import PlayOnUnmountAudio from '@components/common/PlayOnUnmountAudio'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { TeamSlot } from './components/team/TeamSlot'
import PokemonSlot from './components/box/PokemonSlot'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { useActiveDragItem, useDndSensors, COLLISION_STRATEGIES, DROP_ANIMATIONS } from '@/lib/dnd-kit-setup'

export default function PCPage() {
  const { session } = useBoffSession()
  const [pcData, setPcData] = useState<PCPokemon[]>([])
  const [teamData, setTeamData] = useState<(PokemonW | null)[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'team' | 'battleTeams'>('team')
  const [showBoxSelection, setShowBoxSelection] = useState(false)
  const [showSecondaryBoxSelection, setShowSecondaryBoxSelection] = useState(false)

  const uuid = session?.user?.smartRotomUser?.uuid || ''
  const { battleTeamsData, refetch: refetchBattleTeams } = useGetBattleTeams(uuid)

  // Use the PC management hook
  const {
    currentBox,
    secondaryBox,
    isDualBoxMode,
    boxes,
    totalBoxes,
    currentBoxData,
    secondaryBoxData,
    selectedPokemon,
    selectedTeamPokemon,
    handlePokemonClick,
    handleTeamPokemonClick,
    handleBoxChange,
    handleSecondaryBoxChange: originalHandleSecondaryBoxChange,
    toggleDualBoxMode,
    handlePokemonMove,
    clearSelections
  } = usePCManagement({
    uuid,
    pcData,
    teamData,
    setPcData,
    setTeamData
  })

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
    handleShowSearch,
    handleSearch,
    handleShowFilters,
    handleApplyFilters,
    handleClearFilters,
    canDropIntoSlot,
    updateSort,
    navigateFilterPage,
    handlePokemonRemovedFromFilter,
    triggerFilterRefresh,
    optimisticFilterUpdate,
    rollbackFilter
  } = usePCWithFilters({
    uuid,
    pcData,
    onPCDataUpdate: setPcData,
    currentBox,
    onBoxChange: handleBoxChange
  })

  // Create filter-aware secondary box change handler
  const handleSecondaryBoxChange = useCallback((boxNumber: number | null) => {
    if (boxNumber === null) {
      originalHandleSecondaryBoxChange(null)
      return
    }

    // Check if we're trying to set the same box number
    if (boxNumber === currentBox) {
      // Allow it if one of the boxes is a filter box
      const isPrimaryFilterBox = isFilterActive && filterBoxData && filterBoxData.boxNumber === currentBox
      const wouldBeSecondaryFilterBox = isFilterActive && filterBoxData && filterBoxData.boxNumber === boxNumber
      
      if (isPrimaryFilterBox || wouldBeSecondaryFilterBox) {
        // One box is showing filtered results, the other is showing normal box
        // Allow them to have the same box number since they're different views
        originalHandleSecondaryBoxChange(boxNumber)
        return
      }
    }

    // Use the original handler for all other cases (including the automatic conflict resolution)
    originalHandleSecondaryBoxChange(boxNumber)
  }, [originalHandleSecondaryBoxChange, currentBox, isFilterActive, filterBoxData])

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
        // Swap - remove destination Pokemon from PC (it goes to team)
        return currentPcData.filter(p => !(p.box === destination.boxNumber && p.index === destination.index))
      } else {
        // Add team Pokemon to PC (simplified - we'd need full conversion logic)
        // For filter purposes, we just add a placeholder that will match the real result
        const newPcPokemon: PCPokemon = {
          box: destination.boxNumber!,
          index: destination.index,
          pokemon: sourcePokemon as any // Simplified for filter simulation
        }
        return [...currentPcData, newPcPokemon]
      }
    } else if (source.type === 'box' && destination.type === 'team') {
      // Box to team move - Pokemon is removed from PC
      return currentPcData.filter(p => !(p.box === source.boxNumber && p.index === source.index))
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
      await handlePokemonMove(source, destination)

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
  }, [handlePokemonMove, isFilterActive, filterBoxData, optimisticFilterUpdate, rollbackFilter, pcData, teamData, simulatePokemonMove])

  // Drag and drop setup using the lib
  const { activeDragItem, handleDragStart, handleDragEnd } = useActiveDragItem()
  const sensors = useDndSensors()

  // Custom drag end handler for PC functionality
  const onDragEnd = useCallback(async (event: any) => {
    const { active, over } = event

    if (!over || !active.data.current || !over.data.current) {
      return
    }

    const activeData = active.data.current
    const overData = over.data.current

    // Check if trying to drop into a filter box
    if (overData.type === 'box' && !canDropIntoSlot(overData.boxNumber, overData.index)) {
      toast.error('No puedes mover Pokémon a una caja de filtros. Solo puedes sacar Pokémon de estas cajas.')
      return
    }

    // Check if dragging from a filter box - need to use original position
    let sourceInfo = {
      type: activeData.type,
      boxNumber: activeData.boxNumber,
      index: activeData.index
    }

    let isFromFilterBox = false
    let filterSlotIndex = -1

    // If dragging from a filter box, get the original position
    if (filterBoxData && activeData.type === 'box' && activeData.boxNumber === filterBoxData.boxNumber) {
      const originalPos = filterBoxData.originalPositions.get(activeData.index)
      if (originalPos) {
        sourceInfo = {
          type: 'box',
          boxNumber: originalPos.box,
          index: originalPos.index
        }
        isFromFilterBox = true
        filterSlotIndex = activeData.index
      }
    }

    try {
      // Call the optimistic move function instead of the regular one
      await optimisticPokemonMove(
        sourceInfo,
        {
          type: overData.type,
          boxNumber: overData.boxNumber,
          index: overData.index
        }
      )

      // If we moved from filter box, remove it from the filter display
      if (isFromFilterBox && filterSlotIndex >= 0) {
        handlePokemonRemovedFromFilter(filterSlotIndex)
      }

      // No need for manual refresh - optimistic update handles this
    } catch (error) {
      // Handle any errors from Pokemon movement
      console.error('Error during Pokemon move:', error)
      // The error handling in optimisticPokemonMove will already handle rollback
    }
  }, [optimisticPokemonMove, canDropIntoSlot, filterBoxData, handlePokemonRemovedFromFilter])

  const fetchPCData = async () => {
    if (!session?.user?.smartRotomUser?.uuid) return
    
    setIsLoading(true)
    try {
      const response = await WingullService.getPC(session.user.smartRotomUser.uuid)
      if (response.data) {
        setPcData(response.data)
      } else {
        toast.error('Error al cargar los datos del PC')
      }
    } catch (error) {
      console.error('Error fetching PC data:', error)
      toast.error('Error al cargar los datos del PC')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamData = async () => {
    if (!session?.user?.smartRotomUser?.uuid) return
    
    try {
      const response = await WingullService.getTeam(session.user.smartRotomUser.uuid)
      if (response.data) {
        setTeamData(response.data)
      }
    } catch (error) {
      console.error('Error fetching team data:', error)
      toast.error('Error al cargar los datos del equipo')
    }
  }

  const fetchAllData = async () => {
    await Promise.all([fetchPCData(), fetchTeamData()])
  }

  useEffect(() => {
    if (session?.user?.smartRotomUser?.uuid) {
      fetchAllData()
    }
  }, [session])

  // Handle adding Pokemon to battle team
  const handleAddToBattleTeam = async (teamId: string, position: number, pokemon: PCPokemon) => {
    if (!uuid) return

    try {
      // For now, we'll create a unique identifier for the pokemon
      const pokemonId = `${pokemon.box}-${pokemon.index}`
      
      await WingullService.addPokemonToBattleTeam(uuid, {
        teamId,
        position,
        pokemonId
      })

      await refetchBattleTeams()
      toast.success(`${pokemon.pokemon.name} añadido al equipo de batalla`)
    } catch (error) {
      console.error('Error adding Pokemon to battle team:', error)
      toast.error('Error al añadir Pokémon al equipo de batalla')
    }
  }

  // Navigation functions for PokemonDetails
  const handleNavigatePrevious = () => {
    if (!selectedPokemon) return
    
    const currentBoxPokemon = currentBoxData.pokemon.filter(p => p !== null) as PCPokemon[]
    const currentIndex = currentBoxPokemon.findIndex(p => 
      p.box === selectedPokemon.box && p.index === selectedPokemon.index
    )
    
    // Circular navigation: if at first, go to last
    if (currentIndex <= 0) {
      const lastPokemon = currentBoxPokemon[currentBoxPokemon.length - 1]
      handlePokemonClick(lastPokemon)
    } else {
      const previousPokemon = currentBoxPokemon[currentIndex - 1]
      handlePokemonClick(previousPokemon)
    }
  }

  const handleNavigateNext = () => {
    if (!selectedPokemon) return
    
    const currentBoxPokemon = currentBoxData.pokemon.filter(p => p !== null) as PCPokemon[]
    const currentIndex = currentBoxPokemon.findIndex(p => 
      p.box === selectedPokemon.box && p.index === selectedPokemon.index
    )
    
    // Circular navigation: if at last, go to first
    if (currentIndex >= currentBoxPokemon.length - 1) {
      const firstPokemon = currentBoxPokemon[0]
      handlePokemonClick(firstPokemon)
    } else {
      const nextPokemon = currentBoxPokemon[currentIndex + 1]
      handlePokemonClick(nextPokemon)
    }
  }

  const canNavigatePrevious = () => {
    if (!selectedPokemon) return false
    const currentBoxPokemon = currentBoxData.pokemon.filter(p => p !== null) as PCPokemon[]
    return currentBoxPokemon.length > 1 // Can navigate if there's more than one Pokémon
  }

  const canNavigateNext = () => {
    if (!selectedPokemon) return false
    const currentBoxPokemon = currentBoxData.pokemon.filter(p => p !== null) as PCPokemon[]
    return currentBoxPokemon.length > 1 // Can navigate if there's more than one Pokémon
  }

  // Animation variants from old page
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  }
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  }
  const tabVariants = {
    active: {
      scale: 1,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.2 }
    },
    inactive: {
      scale: 0.98,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    }
  }

  return (
    <motion.div 
      className="relative h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-sm overflow-hidden flex flex-col"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-700/10 via-transparent to-transparent pointer-events-none" />
      <PlayOnMountAudio src="/smartrotom/audio/apps/pc/TURN_ON.wav" volume={0.25} />
      <PlayOnUnmountAudio src="/smartrotom/audio/apps/pc/TURN_OFF.wav" volume={0.25} />
      <DndContext
        sensors={sensors}
        collisionDetection={COLLISION_STRATEGIES.custom}
        onDragStart={handleDragStart}
        onDragEnd={(event) => handleDragEnd(event, onDragEnd)}
      >
        <motion.div variants={sectionVariants}>
          <PCHeader 
            currentBox={currentBox}
            totalBoxes={totalBoxes}
            pokemonCount={pcData.length}
            teamCount={teamData.length}
            isDualBoxMode={isDualBoxMode}
            onRefresh={fetchAllData}
            onToggleDualBoxMode={toggleDualBoxMode}
          />
        </motion.div>
        <motion.div variants={sectionVariants}>
          {/* BoxSelectionDialog now handles its own state management */}
        </motion.div>
        <motion.div 
          className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0"
          variants={sectionVariants}
        >
          {/* Side Panel - Team or Battle Teams */}
          <div className="w-80 flex-shrink-0 min-h-0 flex flex-col">
            {/* Enhanced Tab Buttons */}
            <motion.div 
              className="relative bg-slate-900/40 backdrop-blur-sm rounded-t-2xl border border-slate-500/30 flex overflow-hidden mb-0 flex-shrink-0"
              variants={sectionVariants}
            >
              {/* Tab background indicator */}
              <motion.div
                className="absolute top-0 bottom-0 bg-gradient-to-r from-slate-700/60 to-slate-600/60 backdrop-blur-sm border border-slate-500/40 rounded-t-xl"
                animate={{
                  left: activeTab === 'team' ? '0%' : '50%',
                  width: '50%'
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
              <motion.button
                onClick={() => setActiveTab('team')}
                className={`relative flex-1 px-4 py-3 text-sm font-medium transition-colors z-10 ${
                  activeTab === 'team'
                    ? 'text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
                variants={tabVariants}
                animate={activeTab === 'team' ? 'active' : 'inactive'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Equipo Activo
              </motion.button>
              <motion.button
                onClick={() => setActiveTab('battleTeams')}
                className={`relative flex-1 px-4 py-3 text-sm font-medium transition-colors z-10 ${
                  activeTab === 'battleTeams'
                    ? 'text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
                variants={tabVariants}
                animate={activeTab === 'battleTeams' ? 'active' : 'inactive'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Equipos de Batalla
              </motion.button>
            </motion.div>
            {/* Panel Content with smooth transitions */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                className="flex-1 min-h-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'team' ? (
                  <TeamPanel 
                    teamData={teamData}
                    selectedPokemon={selectedTeamPokemon}
                    onPokemonClick={handleTeamPokemonClick}
                    onPokemonMove={handlePokemonMove}
                  />
                ) : (
                  <BattleTeamsPanel
                    battleTeamsData={battleTeamsData}
                    uuid={uuid}
                    onTeamsUpdate={refetchBattleTeams}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          {/* PC Grid */}
          <motion.div 
            className="flex-1 min-w-0 min-h-0"
            variants={sectionVariants}
          >
            <DualBoxGrid 
              primaryBoxData={filterBoxData && filterBoxData.boxNumber === currentBox ? filterBoxData : currentBoxData}
              secondaryBoxData={isDualBoxMode ? (filterBoxData && filterBoxData.boxNumber === secondaryBox ? filterBoxData : secondaryBoxData) : null}
              selectedPokemon={selectedPokemon}
              onPokemonClick={handlePokemonClick}
              onPokemonMove={handlePokemonMove}
              totalBoxes={totalBoxes}
              onPrimaryBoxChange={handleBoxChange}
              onSecondaryBoxChange={handleSecondaryBoxChange}
              rows={ROWS_PER_BOX}
              cols={COLS_PER_ROW}
              battleTeams={battleTeamsData?.teams}
              onAddToBattleTeam={handleAddToBattleTeam}
              onShowBoxSelection={() => setShowBoxSelection(true)}
              onShowSecondaryBoxSelection={() => setShowSecondaryBoxSelection(true)}
              onShowSearch={handleShowFilters}
              onShowFilters={handleShowFilters}
              onClearFilters={handleClearFilters}
              onNavigateFilterPage={navigateFilterPage}
            />
          </motion.div>
        </motion.div>
        {/* Box Selection Dialog */}
        <BoxSelectionDialog
          isOpen={showBoxSelection}
          boxes={boxes}
          currentBox={currentBox}
          onBoxSelect={handleBoxChange}
          onClose={() => setShowBoxSelection(false)}
        />
        <BoxSelectionDialog
          isOpen={showSecondaryBoxSelection}
          boxes={boxes}
          currentBox={secondaryBox!}
          onBoxSelect={handleSecondaryBoxChange}
          onClose={() => setShowSecondaryBoxSelection(false)}
        />
        {/* Pokemon Details Modal */}
        <AnimatePresence>
          {(selectedPokemon || selectedTeamPokemon) && (
            <PokemonDetails
              pokemon={selectedPokemon}
              teamPokemon={selectedTeamPokemon}
              onClose={clearSelections}
              onNavigatePrevious={handleNavigatePrevious}
              onNavigateNext={handleNavigateNext}
              canNavigatePrevious={canNavigatePrevious()}
              canNavigateNext={canNavigateNext()}
            />
          )}
        </AnimatePresence>
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && <LoadingOverlay />}
        </AnimatePresence>
        {/* Enhanced Toast Container */}
        <ToastContainer 
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastClassName="!bg-slate-800/90 !backdrop-blur-sm !border !border-slate-500/30 !text-slate-100"
          progressClassName="!bg-blue-400"
        />
      <DragOverlay 
        dropAnimation={DROP_ANIMATIONS.none}
        modifiers={[snapCenterToCursor]}
      >
        {activeDragItem && activeDragItem.pokemon && (
          <div>
            {activeDragItem.type === 'team' ? (
              <TeamSlot
                id={activeDragItem.pokemon.id}
                pokemon={activeDragItem.pokemon}
                index={-1}
                isSelected={false}
                onClick={() => {}}
              />
            ) : (
              <PokemonSlot
                id={activeDragItem.pokemon.id}
                pokemon={activeDragItem.pokemon}
                index={activeDragItem.pokemon.index}
                isSelected={false}
                onClick={() => {}}
                currentBox={activeDragItem.boxNumber}
              />
            )}
          </div>
        )}
      </DragOverlay>
      </DndContext>

      {/* Unified Filter Dialog */}
      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        filters={filterState.filters}
        searchTerm={filterState.searchTerm}
        sort={filterState.sort}
        onFiltersChange={(filters) => {
          handleApplyFilters(filters)
        }}
        onSearchChange={(searchTerm) => {
          handleSearch(searchTerm, filterState.sort)
        }}
        onSortChange={updateSort}
        onApply={(searchTerm, filters, sort) => {
          const combinedFilters = { ...filters, search: searchTerm }
          handleApplyFilters(combinedFilters)
          updateSort(sort)
        }}
        filterOptions={filterOptions}
      />
    </motion.div>
  )
}