'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBoffSession } from "@/services/useBoffSession"
import { WingullService } from '@/services/api/smartrotom/wingullService'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@boffmedia/shared'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ROWS_PER_BOX, COLS_PER_ROW, POKEMON_PER_BOX } from './utils/constants'
import { useGetBattleTeams } from '@/hooks/player/useGetBattleTeams'
import { usePCManagement } from './hooks/usePCManagement'
import { FilterBox } from './components/box/FilterBox'
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
    handleSecondaryBoxChange,
    toggleDualBoxMode,
    handlePokemonMove,
    clearSelections,
    setSecondaryBox
  } = usePCManagement({
    uuid,
    pcData,
    teamData,
    setPcData,
    setTeamData
  })

  // Create async wrapper for handlePokemonMove
  const asyncHandlePokemonMove = useCallback(async (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => {
    return handlePokemonMove(source, destination)
  }, [handlePokemonMove])

  // Filter-aware secondary box change handler - must be at component level
  const filterAwareSecondaryBoxChange = useCallback((newSecondaryBox: number | null, isFilterActive: boolean) => {
    if (newSecondaryBox === null) {
      handleSecondaryBoxChange(null)
      return
    }

    // If primary box is showing filters, allow secondary box to use the original box
    if (isFilterActive && newSecondaryBox === currentBox) {
      setSecondaryBox(newSecondaryBox)
      clearSelections()
    } else {
      handleSecondaryBoxChange(newSecondaryBox)
    }
  }, [currentBox, handleSecondaryBoxChange, setSecondaryBox, clearSelections])

  // Drag and drop setup using the lib
  const { activeDragItem, handleDragStart, handleDragEnd } = useActiveDragItem()
  const sensors = useDndSensors()

  // Helper function to safely get original position from filterBoxData
  const getOriginalPosition = useCallback((filterBoxData: any, index: number) => {
    if (!filterBoxData?.originalPositions) return null
    
    if (filterBoxData.originalPositions instanceof Map) {
      return filterBoxData.originalPositions.get(index)
    } else if (typeof filterBoxData.originalPositions === 'object') {
      return filterBoxData.originalPositions[index.toString()]
    }
    
    return null
  }, [])

  // Custom drag end handler for PC functionality
  const onDragEnd = useCallback(async (event: any, filterBoxRenderProps?: any) => {
    const { active, over } = event

    if (!over || !active.data.current || !over.data.current) {
      return
    }

    const activeData = active.data.current
    const overData = over.data.current

    // Check if trying to drop into a filter box (not allowed)
    if (filterBoxRenderProps?.canDropIntoSlot && 
        overData.type === 'box' && 
        !filterBoxRenderProps.canDropIntoSlot(overData.boxNumber, overData.index)) {
      toast.error('No puedes mover Pokémon a una caja de filtros. Solo puedes sacar Pokémon de estas cajas.')
      return
    }

    // Handle battle team drops
    if (overData.type === 'battleTeam') {
      try {
        await handleBattleTeamPokemonMove(
          {
            type: activeData.type,
            boxNumber: activeData.boxNumber,
            teamId: activeData.teamId,
            index: activeData.index
          },
          {
            type: overData.type,
            teamId: overData.teamId,
            index: overData.index
          }
        )
      } catch (error) {
        console.error('Error during battle team Pokemon move:', error)
      }
      return
    }

    // Handle battle team sources
    if (activeData.type === 'battleTeam') {
      try {
        await handleBattleTeamPokemonMove(
          {
            type: activeData.type,
            teamId: activeData.teamId,
            index: activeData.index
          },
          {
            type: overData.type,
            boxNumber: overData.boxNumber,
            teamId: overData.teamId,
            index: overData.index
          }
        )
      } catch (error) {
        console.error('Error during battle team Pokemon move:', error)
      }
      return
    }

    // Check if dragging from a filter box and get the original position
    let sourceInfo = {
      type: activeData.type,
      boxNumber: activeData.boxNumber,
      index: activeData.index
    }

    let isFromFilterBox = false
    let filterSlotIndex = -1

    // If we have filter box data and this is a drag from a filter box
    if (filterBoxRenderProps?.isFilterActive && 
        filterBoxRenderProps?.filterBoxData && 
        activeData.type === 'box' && 
        activeData.isFilterBox) {
      
      const { filterBoxData } = filterBoxRenderProps
      const originalPos = getOriginalPosition(filterBoxData, activeData.index)
      
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
      // Use the optimistic Pokemon move function from FilterBox if available
      if (filterBoxRenderProps?.optimisticPokemonMove) {
        await filterBoxRenderProps.optimisticPokemonMove(
          sourceInfo,
          {
            type: overData.type,
            boxNumber: overData.boxNumber,
            index: overData.index
          }
        )

        // If we moved from filter box, remove it from the filter display
        if (isFromFilterBox && filterSlotIndex >= 0 && filterBoxRenderProps?.handlePokemonRemovedFromFilter) {
          filterBoxRenderProps.handlePokemonRemovedFromFilter(filterSlotIndex)
        }
      } else {
        await asyncHandlePokemonMove(
          sourceInfo,
          {
            type: overData.type,
            boxNumber: overData.boxNumber,
            index: overData.index
          }
        )
      }
    } catch (error) {
      console.error('Error during Pokemon move:', error)
    }
  }, [asyncHandlePokemonMove])

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
    if (!uuid || !battleTeamsData) return

    try {
      // Find the target team
      const targetTeam = battleTeamsData.teams.find(team => team.id === teamId)
      if (!targetTeam) {
        toast.error('Equipo de batalla no encontrado')
        return
      }

      // Create a new pokemon array for the team
      const updatedPokemon = [...targetTeam.pokemon]
      updatedPokemon[position] = pokemon.pokemon // Add the Pokemon to the specified position

      // Update the entire team using the simplified flow
      await WingullService.updateBattleTeam(uuid, {
        id: teamId,
        pokemon: updatedPokemon
      })

      await refetchBattleTeams()
      toast.success(`${pokemon.pokemon.name} añadido al equipo de batalla`)
    } catch (error) {
      console.error('Error adding Pokemon to battle team:', error)
      toast.error('Error al añadir Pokémon al equipo de batalla')
    }
  }

  // Handle battle team Pokemon moves
  const handleBattleTeamPokemonMove = async (
    source: { type: 'box' | 'team' | 'battleTeam', boxNumber?: number, teamId?: string, index: number },
    destination: { type: 'box' | 'team' | 'battleTeam', boxNumber?: number, teamId?: string, index: number }
  ) => {
    console.log('handleBattleTeamPokemonMove called with:', { source, destination })
    
    if (!uuid || !battleTeamsData) {
      console.log('Early return - missing data:', { uuid: !!uuid, battleTeamsData: !!battleTeamsData })
      return
    }

    try {
      // Handle moves within battle teams or from PC to battle teams
      if (source.type === 'box' && destination.type === 'battleTeam') {
        console.log('Moving from PC to battle team')
        
        // Moving from PC to battle team
        const pokemon = source.boxNumber !== undefined ? 
          pcData.find(p => p.box === source.boxNumber && p.index === source.index) : null
        
        console.log('Found pokemon:', !!pokemon, pokemon?.pokemon?.name)
        console.log('Battle teams data:', battleTeamsData?.teams?.length, 'teams')
        console.log('Looking for team ID:', destination.teamId)
        console.log('Available team IDs:', battleTeamsData?.teams?.map(t => t.id))
        
        if (pokemon && destination.teamId) {
          // Find the target team
          const targetTeam = battleTeamsData.teams.find(team => team.id === destination.teamId)
          console.log('Found target team:', !!targetTeam, targetTeam?.name)
          
          if (!targetTeam) {
            console.log('Target team not found! Returning early.')
            return
          }

          // Create a new pokemon array for the team
          const updatedPokemon = [...targetTeam.pokemon]
          updatedPokemon[destination.index] = pokemon.pokemon

          // we need to create a pokemonSlot for the pokemon, with its box and index
          const pokemonSlot = {
            box: pokemon.box,
            slot: pokemon.index,
          }

          console.log('About to call updateBattleTeam with:', {
            teamId: destination.teamId,
            pokemonCount: updatedPokemon.filter(p => p !== null).length
          })

          // Update the entire team
          await WingullService.updateBattleTeam(uuid, {
            id: destination.teamId,
            teamSlot: destination.index,
            pokemon: pokemonSlot
          } as any)
        }
      } else if (source.type === 'battleTeam' && destination.type === 'battleTeam') {
        // Moving within battle teams or between battle teams
        if (source.teamId && destination.teamId && battleTeamsData) {
          const sourceTeam = battleTeamsData.teams.find(team => team.id === source.teamId)
          const destinationTeam = battleTeamsData.teams.find(team => team.id === destination.teamId)
          
          if (!sourceTeam || !destinationTeam) return

          const sourcePokemon = sourceTeam.pokemon[source.index]

          if (source.teamId === destination.teamId) {
            // Moving within the same team
            const updatedPokemon = [...sourceTeam.pokemon]
            // Remove from source position
            updatedPokemon[source.index] = null
            // Add to destination position
            updatedPokemon[destination.index] = sourcePokemon

            await WingullService.updateBattleTeam(uuid, {
              id: source.teamId,
              pokemon: updatedPokemon
            })
          } else {
            // Moving between different teams - need to update both teams
            const updatedSourcePokemon = [...sourceTeam.pokemon]
            const updatedDestinationPokemon = [...destinationTeam.pokemon]
            
            // Remove from source team
            updatedSourcePokemon[source.index] = null
            // Add to destination team
            updatedDestinationPokemon[destination.index] = sourcePokemon

            // Update both teams
            await Promise.all([
              WingullService.updateBattleTeam(uuid, {
                id: source.teamId,
                pokemon: updatedSourcePokemon
              }),
              WingullService.updateBattleTeam(uuid, {
                id: destination.teamId,
                pokemon: updatedDestinationPokemon
              })
            ])
          }
        }
      }
      
      await Promise.all([fetchPCData(), fetchTeamData(), refetchBattleTeams()])
      toast.success('Pokémon movido exitosamente')
    } catch (error) {
      toast.error('Error al mover Pokémon')
      console.error('Error moving battle team pokemon:', error)
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
          <FilterBox
            uuid={uuid}
            pcData={pcData}
            teamData={teamData}
            onPCDataUpdate={setPcData}
            currentBox={currentBox}
            onBoxChange={handleBoxChange}
            onPokemonMove={asyncHandlePokemonMove}
          >
            {(filterBoxRenderProps) => {
              const { 
                isFilterActive,
                filterBoxData,
                filterState,
                filterOptions,
                showFilterPanel,
                setShowFilterPanel,
                handleShowFilters,
                handleClearFilters,
                handleApplyFilters,
                updateSort,
                navigateFilterPage,
                optimisticPokemonMove,
                handlePokemonRemovedFromFilter,
                canDropIntoSlot
              } = filterBoxRenderProps

              // Calculate the box data based on filter state
              const primaryBoxData = isFilterActive && filterBoxData 
                ? filterBoxData 
                : currentBoxData
              
              const calculatedSecondaryBoxData = isDualBoxMode 
                ? (secondaryBox !== null ? (boxes[secondaryBox] || { 
                    boxNumber: secondaryBox, 
                    pokemon: new Array(POKEMON_PER_BOX).fill(null) 
                  }) : null)
                : null

              return (
                <DndContext
                  sensors={sensors}
                  collisionDetection={COLLISION_STRATEGIES.custom}
                  onDragStart={handleDragStart}
                  onDragEnd={(event) => onDragEnd(event, filterBoxRenderProps)}
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
                            onPokemonMove={optimisticPokemonMove}
                          />
                        ) : (
                          <BattleTeamsPanel
                            battleTeamsData={battleTeamsData}
                            uuid={uuid}
                            onTeamsUpdate={refetchBattleTeams}
                            onBattleTeamPokemonMove={handleBattleTeamPokemonMove}
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
                      primaryBoxData={primaryBoxData}
                      secondaryBoxData={calculatedSecondaryBoxData}
                      selectedPokemon={selectedPokemon}
                      onPokemonClick={handlePokemonClick}
                      onPokemonMove={optimisticPokemonMove}
                      totalBoxes={totalBoxes}
                      onPrimaryBoxChange={handleBoxChange}
                      onSecondaryBoxChange={(boxNumber) => filterAwareSecondaryBoxChange(boxNumber, isFilterActive)}
                      rows={ROWS_PER_BOX}
                      cols={COLS_PER_ROW}
                      battleTeams={battleTeamsData?.teams}
                      onAddToBattleTeam={handleAddToBattleTeam}
                      onShowBoxSelection={() => setShowBoxSelection(true)}
                      onShowSecondaryBoxSelection={() => setShowSecondaryBoxSelection(true)}
                      onShowSearch={handleShowFilters}
                      onShowFilters={handleShowFilters}
                      onClearFilters={handleClearFilters}
                      onModifyFilters={handleShowFilters}
                      onNavigateFilterPage={navigateFilterPage}
                    />
                  </motion.div>

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

                  {/* Unified Filter Dialog */}
                  <FilterPanel
                    isOpen={showFilterPanel}
                    onClose={() => setShowFilterPanel(false)}
                    filters={filterState.filters}
                    searchTerm={filterState.searchTerm}
                    sort={filterState.sort}
                    onFiltersChange={(filters) => {
                      // Update the filters immediately for preview purposes
                      // This allows users to see changes as they make them
                    }}
                    onSortChange={updateSort}
                    onApply={(searchTerm, filters, sort) => {
                      handleApplyFilters(searchTerm, filters, sort)
                      setShowFilterPanel(false)
                    }}
                    filterOptions={filterOptions}
                  />

                  {/* Secondary Box Selection Dialog - moved inside to access filter state */}
                  <BoxSelectionDialog
                    isOpen={showSecondaryBoxSelection}
                    boxes={boxes}
                    currentBox={secondaryBox!}
                    onBoxSelect={(boxNumber) => filterAwareSecondaryBoxChange(boxNumber, isFilterActive)}
                    onClose={() => setShowSecondaryBoxSelection(false)}
                  />
                </DndContext>
              )
            }}
          </FilterBox>
        </motion.div>
        {/* Box Selection Dialog */}
        <BoxSelectionDialog
          isOpen={showBoxSelection}
          boxes={boxes}
          currentBox={currentBox}
          onBoxSelect={handleBoxChange}
          onClose={() => setShowBoxSelection(false)}
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
    </motion.div>
  )
}