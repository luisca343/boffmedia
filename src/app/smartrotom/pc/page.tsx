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
import PCHeader from './components/PCHeader'
import BoxNavigation from './components/BoxNavigation'
import TeamPanel from './components/TeamPanel'
import BattleTeamsPanel from './components/BattleTeamsPanel'
import PokemonGrid from './components/PokemonGrid'
import PokemonDetails from './components/PokemonDetails'
import LoadingOverlay from './components/LoadingOverlay'

export default function PCPage() {
  const { session } = useBoffSession()
  const [pcData, setPcData] = useState<PCPokemon[]>([])
  const [teamData, setTeamData] = useState<PokemonW[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'team' | 'battleTeams'>('team')

  const uuid = session?.user?.smartRotomUser?.uuid || ''
  const { battleTeamsData, refetch: refetchBattleTeams } = useGetBattleTeams(uuid)

  // Use the PC management hook
  const {
    currentBox,
    boxes,
    totalBoxes,
    currentBoxData,
    selectedPokemon,
    selectedTeamPokemon,
    handlePokemonClick,
    handleTeamPokemonClick,
    handleBoxChange,
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

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 overflow-hidden flex flex-col">
      <PCHeader 
        currentBox={currentBox}
        totalBoxes={totalBoxes}
        pokemonCount={pcData.length}
        teamCount={teamData.length}
        onRefresh={fetchAllData}
      />
      
      <BoxNavigation
        currentBox={currentBox}
        totalBoxes={totalBoxes}
        boxes={boxes}
        onBoxChange={handleBoxChange}
      />

      <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0">
        {/* Side Panel - Team or Battle Teams */}
        <div className="w-80 flex-shrink-0 min-h-0 flex flex-col">
          {/* Tab Buttons */}
          <div className="bg-black/20 rounded-t-2xl border border-purple-400/30 flex overflow-hidden mb-0 flex-shrink-0">
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'team'
                  ? 'bg-green-700/50 text-white border-b-2 border-green-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-700/30'
              }`}
            >
              Equipo Activo
            </button>
            <button
              onClick={() => setActiveTab('battleTeams')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'battleTeams'
                  ? 'bg-yellow-700/50 text-white border-b-2 border-yellow-400'
                  : 'text-purple-300 hover:text-white hover:bg-purple-700/30'
              }`}
            >
              Equipos de Batalla
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 min-h-0">
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
          </div>
        </div>

        {/* PC Grid */}
        <div className="flex-1 min-w-0 min-h-0">
          <PokemonGrid 
            boxData={currentBoxData}
            selectedPokemon={selectedPokemon}
            onPokemonClick={handlePokemonClick}
            onPokemonMove={handlePokemonMove}
            currentBox={currentBox}
            rows={ROWS_PER_BOX}
            cols={COLS_PER_ROW}
            battleTeams={battleTeamsData?.teams}
            onAddToBattleTeam={handleAddToBattleTeam}
          />
        </div>
      </div>

      {(selectedPokemon || selectedTeamPokemon) && (
        <PokemonDetails
          pokemon={selectedPokemon}
          teamPokemon={selectedTeamPokemon}
          onClose={clearSelections}
        />
      )}

      {isLoading && <LoadingOverlay />}
      
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
      />
    </div>
  )
}