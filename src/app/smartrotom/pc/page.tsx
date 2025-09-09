'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBoffSession } from "@/services/useBoffSession"
import { WingullService } from '@/services/api/smartrotom/wingullService'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ROWS_PER_BOX, COLS_PER_ROW } from './utils/constants'
import { useGetBattleTeams } from '@/hooks/player/useGetBattleTeams'
import { usePCManagement } from './hooks/usePCManagement'
import PCHeader from './components/layout/PCHeader'
import BoxNavigation from './components/box/BoxNavigation'
import TeamPanel from './components/team/TeamPanel'
import BattleTeamsPanel from './components/team/BattleTeamsPanel'
import DualBoxGrid from './components/box/DualBoxGrid'
import PokemonDetails from './components/details/PokemonDetails'
import LoadingOverlay from './components/layout/LoadingOverlay'
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
    clearSelections
  } = usePCManagement({
    uuid,
    pcData,
    teamData,
    setPcData,
    setTeamData
  })

  // Drag and drop setup using the lib
  const { activeDragItem, handleDragStart, handleDragEnd } = useActiveDragItem()
  const sensors = useDndSensors()

  // Custom drag end handler for PC functionality
  const onDragEnd = useCallback((event: any) => {
    const { active, over } = event

    if (!over || !active.data.current || !over.data.current) {
      return
    }

    const activeData = active.data.current
    const overData = over.data.current

    // Call the existing handlePokemonMove function with the appropriate parameters
    handlePokemonMove(
      {
        type: activeData.type,
        boxNumber: activeData.boxNumber,
        index: activeData.index
      },
      {
        type: overData.type,
        boxNumber: overData.boxNumber,
        index: overData.index
      }
    )
  }, [handlePokemonMove])

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
            onShowBoxSelection={() => setShowBoxSelection(true)}
            onToggleDualBoxMode={toggleDualBoxMode}
          />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <BoxNavigation
            currentBox={currentBox}
            secondaryBox={secondaryBox}
            isDualBoxMode={isDualBoxMode}
            totalBoxes={totalBoxes}
            boxes={boxes}
            onBoxChange={handleBoxChange}
            onSecondaryBoxChange={handleSecondaryBoxChange}
            selectedPokemon={selectedPokemon}
            onPokemonClick={handlePokemonClick}
            onPokemonMove={handlePokemonMove}
            battleTeams={battleTeamsData?.teams}
            onAddToBattleTeam={handleAddToBattleTeam}
            showBoxSelection={showBoxSelection}
            onShowBoxSelection={setShowBoxSelection}
          />
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
              primaryBoxData={currentBoxData}
              secondaryBoxData={isDualBoxMode ? secondaryBoxData : null}
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
            />
          </motion.div>
        </motion.div>
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
    </motion.div>
  )
}