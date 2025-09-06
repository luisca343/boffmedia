'use client'

import { useState, useEffect } from 'react'
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
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

export default function PCPage() {
  const { session } = useBoffSession()
  const [pcData, setPcData] = useState<PCPokemon[]>([])
  const [teamData, setTeamData] = useState<(PokemonW | null)[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'team' | 'battleTeams'>('team')
  const [showBoxSelection, setShowBoxSelection] = useState(false)

  // Drag and drop state
  const [activeDragItem, setActiveDragItem] = useState<any>(null)

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItem(event.active.data.current)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragItem(null)

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
  }

  return (
    <div className="relative h-full w-full bg-gray-200 overflow-hidden flex flex-col">
      <PlayOnMountAudio src="/smartrotom/audio/apps/pc/TURN_ON.wav" volume={0.25} />
      <PlayOnUnmountAudio src="/smartrotom/audio/apps/pc/TURN_OFF.wav" volume={0.25} />
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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

      <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0">
        {/* Side Panel - Team or Battle Teams */}
        <div className="w-80 flex-shrink-0 min-h-0 flex flex-col">
          {/* Tab Buttons */}
          <div className="relative bg-gray-400 border-4 border-black border-b-0 flex overflow-hidden mb-0 flex-shrink-0">
            {/* Tab background indicator */}
            <div 
              className={`absolute top-0 bottom-0 bg-gray-600 border-2 border-gray-500 transition-all duration-300 ${
                activeTab === 'team' ? 'left-0 w-1/2' : 'left-1/2 w-1/2'
              }`}
            />
            
            <button
              onClick={() => setActiveTab('team')}
              className={`relative flex-1 px-4 py-3 font-mono text-sm font-bold transition-all duration-150 z-10 active:scale-95 ${
                activeTab === 'team'
                  ? 'text-white'
                  : 'text-black hover:text-white'
              }`}
            >
              CURRENT TEAM
            </button>
            <button
              onClick={() => setActiveTab('battleTeams')}
              className={`relative flex-1 px-4 py-3 font-mono text-sm font-bold transition-all duration-150 z-10 active:scale-95 ${
                activeTab === 'battleTeams'
                  ? 'text-white'
                  : 'text-black hover:text-white'
              }`}
            >
              BATTLE TEAMS
            </button>
          </div>

          {/* Panel Content */}
          <div className={`flex-1 min-h-0 transition-opacity duration-200 ${
            activeTab === 'team' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
          }`}>
            <TeamPanel 
              teamData={teamData}
              selectedPokemon={selectedTeamPokemon}
              onPokemonClick={handleTeamPokemonClick}
              onPokemonMove={handlePokemonMove}
            />
          </div>

          <div className={`flex-1 min-h-0 transition-opacity duration-200 ${
            activeTab === 'battleTeams' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
          }`}>
            <BattleTeamsPanel
              battleTeamsData={battleTeamsData}
              uuid={uuid}
              onTeamsUpdate={refetchBattleTeams}
            />
          </div>
        </div>

        {/* PC Grid */}
        <div className="flex-1 min-w-0 min-h-0">
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
        </div>
      </div>

      {/* Pokemon Details Modal */}
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

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}
      
      {/* Toast Container */}
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
        toastClassName="!bg-gray-300 !border-2 !border-black !text-black !font-mono"
        progressClassName="!bg-black"
      />

        <DragOverlay>
          {activeDragItem && activeDragItem.pokemon && (
            <div className="w-12 h-12 bg-gray-300 border-2 border-black flex items-center justify-center opacity-75">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${activeDragItem.pokemon.id}.png`}
                alt={activeDragItem.pokemon.name}
                className="w-8 h-8 pixelated"
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}