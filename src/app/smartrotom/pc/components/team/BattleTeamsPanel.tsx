import { useState } from 'react'
import { BattleTeam, BattleTeamData } from '@/types/dto/battle-team.dto'
import { PokemonW } from '@/generated/api'
import { FaTrophy, FaPlus, FaEdit, FaTrash, FaStar, FaRegStar } from 'react-icons/fa'
import { PiUsers, PiTarget, PiInfo } from 'react-icons/pi'
import { toast } from 'react-toastify'
import { WingullService } from '@/services/api/smartrotom/wingullService'
import { PokemonSprite } from '@/app/smartrotom/pokedex/_components/PokemonSprite'

interface BattleTeamsPanelProps {
  battleTeamsData: BattleTeamData | undefined
  uuid: string
  onTeamsUpdate: () => void
  onPokemonAddToBattleTeam?: (teamId: string, position: number) => void
}

export default function BattleTeamsPanel({ 
  battleTeamsData, 
  uuid, 
  onTeamsUpdate,
  onPokemonAddToBattleTeam 
}: BattleTeamsPanelProps) {
  const [selectedTeam, setSelectedTeam] = useState<BattleTeam | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<BattleTeam | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDescription, setNewTeamDescription] = useState('')

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error('El nombre del equipo es requerido')
      return
    }

    if (battleTeamsData && battleTeamsData.teams.length >= battleTeamsData.maxTeams) {
      toast.error(`Máximo ${battleTeamsData.maxTeams} equipos de batalla permitidos`)
      return
    }

    try {
      await WingullService.createBattleTeam(uuid, {
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined
      })
      
      setNewTeamName('')
      setNewTeamDescription('')
      setShowCreateForm(false)
      onTeamsUpdate()
      toast.success('Equipo de batalla creado exitosamente')
    } catch (error) {
      toast.error('Error al crear el equipo de batalla')
      console.error('Error creating battle team:', error)
    }
  }

  const handleUpdateTeam = async () => {
    if (!editingTeam || !newTeamName.trim()) {
      toast.error('El nombre del equipo es requerido')
      return
    }

    try {
      await WingullService.updateBattleTeam(uuid, {
        id: editingTeam.id,
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined
      })
      
      setEditingTeam(null)
      setNewTeamName('')
      setNewTeamDescription('')
      onTeamsUpdate()
      toast.success('Equipo de batalla actualizado')
    } catch (error) {
      toast.error('Error al actualizar el equipo de batalla')
      console.error('Error updating battle team:', error)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este equipo de batalla?')) {
      return
    }

    try {
      await WingullService.deleteBattleTeam(uuid, teamId)
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null)
      }
      onTeamsUpdate()
      toast.success('Equipo de batalla eliminado')
    } catch (error) {
      toast.error('Error al eliminar el equipo de batalla')
      console.error('Error deleting battle team:', error)
    }
  }

  const handleSetActiveTeam = async (teamId: string) => {
    try {
      await WingullService.setActiveBattleTeam(uuid, teamId)
      onTeamsUpdate()
      toast.success('Equipo activo cambiado')
    } catch (error) {
      toast.error('Error al cambiar el equipo activo')
      console.error('Error setting active team:', error)
    }
  }

  const handleRemovePokemonFromTeam = async (teamId: string, position: number) => {
    try {
      await WingullService.removePokemonFromBattleTeam(uuid, { teamId, position })
      onTeamsUpdate()
      toast.success('Pokémon removido del equipo de batalla')
    } catch (error) {
      toast.error('Error al remover Pokémon del equipo')
      console.error('Error removing pokemon from battle team:', error)
    }
  }

  const startEdit = (team: BattleTeam) => {
    setEditingTeam(team)
    setNewTeamName(team.name)
    setNewTeamDescription(team.description || '')
  }

  if (!battleTeamsData) {
    return (
      <div className="bg-white border-4 border-black h-full flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-black rounded-full border-t-transparent animate-spin" />
          <p className="text-black font-mono text-sm">CARGANDO EQUIPOS DE COMBATE...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-4 border-black h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-300 border-b-4 border-black p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black border-2 border-gray-600 flex items-center justify-center">
              <FaTrophy className="text-white text-sm" />
            </div>
            <div>
              <h3 className="text-black font-mono font-bold text-lg">EQUIPOS DE COMBATE</h3>
              <div className="flex items-center space-x-2">
                <p className="text-gray-700 font-mono text-xs">
                  {battleTeamsData.teams.length}/{battleTeamsData.maxTeams} EQUIPOS
                </p>
                {battleTeamsData.teams.find(t => t.isActive) && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-black animate-pulse" />
                    <span className="text-xs text-black font-mono">ACTIVO</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 border-2 border-green-500 hover:border-green-400 disabled:border-gray-500 text-white p-2 transition-all duration-150 active:scale-95"
            disabled={battleTeamsData.teams.length >= battleTeamsData.maxTeams}
            title="CREAR NUEVO EQUIPO DE COMBATE"
          >
            <FaPlus className="text-sm" />
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      <div className={`bg-blue-800 border-b-4 border-blue-700 transition-all duration-300 overflow-hidden ${
        (showCreateForm || editingTeam) ? 'max-h-40 p-3' : 'max-h-0 p-0'
      }`}>
        <div className="space-y-2">
          <div>
            <input
              type="text"
              placeholder="TEAM NAME"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full p-2 bg-blue-900 border-2 border-blue-600 text-yellow-200 font-mono text-sm focus:border-yellow-400 transition-colors"
              maxLength={20}
            />
          </div>
          <div>
            <textarea
              placeholder="DESCRIPTION (OPTIONAL)"
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              className="w-full p-2 bg-blue-900 border-2 border-blue-600 text-yellow-200 font-mono text-sm focus:border-yellow-400 transition-colors resize-none"
              rows={2}
              maxLength={100}
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
              className="bg-green-600 hover:bg-green-500 border-2 border-green-500 hover:border-green-400 text-white px-3 py-1 font-mono text-sm transition-all duration-150 active:scale-95"
            >
              {editingTeam ? 'UPDATE' : 'CREATE'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setEditingTeam(null)
                setNewTeamName('')
                setNewTeamDescription('')
              }}
              className="bg-red-600 hover:bg-red-500 border-2 border-red-500 hover:border-red-400 text-white px-3 py-1 font-mono text-sm transition-all duration-150 active:scale-95"
            >
              CANCELAR
            </button>
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {battleTeamsData.teams.length === 0 ? (
          <div className="text-center text-blue-300 py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-800 border-2 border-blue-700 flex items-center justify-center">
              <FaTrophy className="text-2xl opacity-50" />
            </div>
            <h4 className="font-mono font-bold mb-2">NO HAY EQUIPOS DE COMBATE</h4>
            <p className="font-mono text-xs text-blue-400">CREA TU PRIMER EQUIPO PARA EL FRENTE DE BATALLA</p>
          </div>
        ) : (
          <div className="space-y-2">
            {battleTeamsData.teams.map((team) => (
              <div
                key={team.id}
                className={`border-2 p-3 cursor-pointer transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] ${
                  selectedTeam?.id === team.id
                    ? 'border-yellow-400 bg-blue-800'
                    : 'border-blue-700 hover:border-blue-600 bg-blue-850'
                } ${team.isActive ? 'bg-green-900 border-green-600' : ''}`}
                onClick={() => setSelectedTeam(selectedTeam?.id === team.id ? null : team)}
              >
                {/* Team Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 border flex items-center justify-center ${
                      team.isActive 
                        ? 'bg-green-400 border-green-300' 
                        : 'bg-yellow-400 border-yellow-300'
                    }`}>
                      {team.isActive ? (
                        <FaStar className="text-green-800 text-xs" />
                      ) : (
                        <FaRegStar className="text-yellow-800 text-xs" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-yellow-200 font-mono font-bold">{team.name}</h4>
                      {team.isActive && (
                        <div className="flex items-center space-x-1">
                          <PiTarget className="text-green-400 text-xs" />
                          <span className="text-green-400 text-xs font-mono">ACTIVE TEAM</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1">
                    {!team.isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetActiveTeam(team.id)
                        }}
                        className="text-yellow-400 hover:text-yellow-300 p-1 border border-transparent hover:border-yellow-400 transition-all duration-150 active:scale-90"
                        title="SET AS ACTIVE TEAM"
                      >
                        <FaRegStar className="text-sm" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEdit(team)
                      }}
                      className="text-blue-400 hover:text-blue-300 p-1 border border-transparent hover:border-blue-400 transition-all duration-150 active:scale-90"
                      title="EDIT TEAM"
                    >
                      <FaEdit className="text-sm" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTeam(team.id)
                      }}
                      className="text-red-400 hover:text-red-300 p-1 border border-transparent hover:border-red-400 transition-all duration-150 active:scale-90"
                      title="DELETE TEAM"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
                
                {/* Team Description */}
                {team.description && (
                  <p className="text-blue-200 font-mono text-xs mb-3 bg-blue-900 border border-blue-700 p-2">
                    {team.description}
                  </p>
                )}
                
                {/* Pokemon Grid */}
                <div className="grid grid-cols-6 gap-1 mb-2">
                  {Array.from({ length: 6 }, (_, index) => {
                    const pokemon = team.pokemon[index]
                    return (
                      <div
                        key={index}
                        className={`aspect-square border-2 flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 ${
                          pokemon 
                            ? 'border-green-500 bg-green-900 hover:border-green-400 hover:bg-green-800' 
                            : 'border-blue-600 bg-blue-800 border-dashed hover:border-blue-500'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (pokemon) {
                            handleRemovePokemonFromTeam(team.id, index)
                          } else if (onPokemonAddToBattleTeam) {
                            onPokemonAddToBattleTeam(team.id, index)
                          }
                        }}
                      >
                        {pokemon ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <PokemonSprite
                              id={pokemon.dex}
                              form={pokemon.form || 'base'}
                              palette={pokemon.palette || 'none'}
                              width={28}
                              height={28}
                              showStatus={false}
                            />
                            {/* Position indicator */}
                            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-800 border border-blue-600 flex items-center justify-center">
                              <span className="text-blue-200 text-[8px] font-mono font-bold">{index + 1}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <FaPlus className="text-blue-400 text-xs mb-1" />
                            <span className="text-blue-400 text-[8px] font-mono font-bold">{index + 1}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Team Stats */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <PiUsers className="text-blue-400" />
                      <span className="text-blue-200 font-mono">
                        {team.pokemon.filter(p => p !== null).length}/6 POKEMON
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 border ${
                          i < team.pokemon.filter(p => p !== null).length 
                            ? 'bg-green-400 border-green-300' 
                            : 'bg-blue-800 border-blue-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}