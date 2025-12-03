import { useState } from 'react'
import { BattleTeam, BattleTeamData } from '@/types/dto/battle-team.dto'
import { PokemonW } from '@/generated/api'
import { FaTrophy, FaPlus, FaEdit, FaTrash, FaStar, FaRegStar } from 'react-icons/fa'
import { PiUsers, PiTarget, PiInfo } from 'react-icons/pi'
import { toast } from 'react-toastify'
import { WingullService } from '@/services/api/smartrotom/wingullService'
import { BattleTeamSlot } from './BattleTeamSlot'
import { SortableContext } from '@dnd-kit/sortable'
import { stablePositionStrategy } from '@/lib/drag-and-drop'

interface BattleTeamsPanelProps {
  battleTeamsData: BattleTeamData | undefined
  uuid: string
  onTeamsUpdate: () => void
  onPokemonAddToBattleTeam?: (teamId: string, position: number) => void
  onBattleTeamPokemonMove?: (
    source: { type: 'box' | 'team' | 'battleTeam', boxNumber?: number, teamId?: string, index: number },
    destination: { type: 'box' | 'team' | 'battleTeam', boxNumber?: number, teamId?: string, index: number }
  ) => void
}

export default function BattleTeamsPanel({ 
  battleTeamsData, 
  uuid, 
  onTeamsUpdate,
  onPokemonAddToBattleTeam,
  onBattleTeamPokemonMove 
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
      // Find the target team
      const targetTeam = battleTeamsData?.teams.find(team => team.id === teamId)
      if (!targetTeam) {
        toast.error('Equipo de batalla no encontrado')
        return
      }

      // Create a new pokemon array with the Pokemon removed (set to null)
      const updatedPokemon = [...targetTeam.pokemon]
      updatedPokemon[position] = null

      // Update the entire team using the simplified flow
      await WingullService.updateBattleTeam(uuid, {
        id: teamId,
        pokemon: updatedPokemon
      })

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
      <div className="bg-slate-900/40 backdrop-blur-sm rounded-b-2xl border border-slate-500/30 border-t-0 shadow-2xl h-full flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-slate-400 rounded-full border-t-transparent animate-spin" />
          <p className="text-slate-300 font-medium text-sm">Cargando equipos de combate...</p>
        </div>
      </div>
    )
  }

  return <>
    
  </>


  return (
    <div className="h-full flex flex-col space-y-3 overflow-y-auto">
      {/* Create Team Button */}
      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        disabled={battleTeamsData.teams.length >= battleTeamsData.maxTeams}
        className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-600/50 disabled:to-slate-600/50 border border-green-500/50 hover:border-green-400 disabled:border-slate-500/30 text-white p-3 rounded-xl transition-all duration-150 active:scale-95 backdrop-blur-sm shadow-lg flex items-center justify-center space-x-2"
      >
        <FaPlus className="text-sm" />
        <span className="font-medium text-sm">
          {battleTeamsData.teams.length >= battleTeamsData.maxTeams 
            ? `Límite alcanzado (${battleTeamsData.maxTeams})`
            : 'Crear Equipo de Batalla'
          }
        </span>
      </button>

      {/* Create/Edit Form */}
      {(showCreateForm || editingTeam) && (
        <div className="bg-slate-800/60 border border-slate-600/30 rounded-xl backdrop-blur-sm p-4">
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Nombre del equipo"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full p-3 bg-slate-900/60 border border-slate-600/50 text-slate-100 placeholder-slate-400 font-medium text-sm focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all duration-200 rounded-xl backdrop-blur-sm"
                maxLength={20}
              />
            </div>
            <div>
              <textarea
                placeholder="Descripción (opcional)"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                className="w-full p-3 bg-slate-900/60 border border-slate-600/50 text-slate-100 placeholder-slate-400 font-medium text-sm focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all duration-200 resize-none rounded-xl backdrop-blur-sm"
                rows={2}
                maxLength={100}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                className="flex-1 bg-green-600/80 hover:bg-green-500 border border-green-500/50 hover:border-green-400 text-white px-4 py-2 font-medium text-sm transition-all duration-150 active:scale-95 rounded-xl backdrop-blur-sm"
              >
                {editingTeam ? 'Actualizar' : 'Crear'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingTeam(null)
                  setNewTeamName('')
                  setNewTeamDescription('')
                }}
                className="flex-1 bg-red-600/80 hover:bg-red-500 border border-red-500/50 hover:border-red-400 text-white px-4 py-2 font-medium text-sm transition-all duration-150 active:scale-95 rounded-xl backdrop-blur-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teams as Individual Panels */}
      {battleTeamsData.teams.length === 0 ? (
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-500/30 shadow-xl p-8 text-center text-slate-300">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 border border-slate-600/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <FaTrophy className="text-3xl opacity-50" />
          </div>
          <h4 className="font-bold text-lg mb-2">No hay equipos de batalla</h4>
          <p className="font-medium text-sm text-slate-400">Crea tu primer equipo para el frente de batalla</p>
        </div>
      ) : (
        battleTeamsData.teams.map((team) => (
              <div
                key={team.id}
                className={`relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] overflow-hidden ${
                  selectedTeam?.id === team.id
                    ? 'border-blue-400/50 bg-gradient-to-br from-blue-900/20 to-slate-900/40 shadow-lg shadow-blue-500/10'
                    : 'border-slate-600/30 hover:border-slate-500/40'
                } ${team.isActive ? 'border-green-400/50 bg-gradient-to-br from-green-900/20 to-slate-900/40 shadow-lg shadow-green-500/10' : ''}`}
                onClick={() => setSelectedTeam(selectedTeam?.id === team.id ? null : team)}
              >
                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
                
                {/* Team Header with Name, Description and Actions all in one section */}
                <div className="relative bg-gradient-to-r from-slate-800/60 to-slate-700/60 p-3 border-b border-slate-600/30">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center backdrop-blur-sm flex-shrink-0 ${
                        team.isActive 
                          ? 'bg-green-500/20 border-green-400/50' 
                          : 'bg-yellow-500/20 border-yellow-400/50'
                      }`}>
                        {team.isActive ? (
                          <FaStar className="text-green-400 text-sm" />
                        ) : (
                          <FaRegStar className="text-yellow-400 text-sm" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-lg truncate">{team.name}</h4>
                        {team.description && (
                          <p className="text-slate-300 font-medium text-xs mt-0.5 line-clamp-1">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                      {!team.isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetActiveTeam(team.id)
                          }}
                          className="text-yellow-400 hover:text-yellow-300 p-2 border border-transparent hover:border-yellow-400/30 rounded-xl transition-all duration-150 active:scale-90 backdrop-blur-sm hover:bg-yellow-400/10"
                          title="Establecer como equipo activo"
                        >
                          <FaRegStar className="text-sm" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEdit(team)
                        }}
                        className="text-blue-400 hover:text-blue-300 p-2 border border-transparent hover:border-blue-400/30 rounded-xl transition-all duration-150 active:scale-90 backdrop-blur-sm hover:bg-blue-400/10"
                        title="Editar equipo"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTeam(team.id)
                        }}
                        className="text-red-400 hover:text-red-300 p-2 border border-transparent hover:border-red-400/30 rounded-xl transition-all duration-150 active:scale-90 backdrop-blur-sm hover:bg-red-400/10"
                        title="Eliminar equipo"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Active Status & Team Stats in Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      {team.isActive && (
                        <div className="flex items-center space-x-1">
                          <PiTarget className="text-green-400 text-sm" />
                          <span className="text-green-400 font-medium">Equipo activo</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <PiUsers className="text-slate-400" />
                        <span className="text-slate-300 font-medium">
                          {team.pokemon.filter(p => p !== null).length}/6 Pokémon
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            i < team.pokemon.filter(p => p !== null).length 
                              ? 'bg-green-400 shadow-sm shadow-green-400/50' 
                              : 'bg-slate-700 border border-slate-600/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Pokemon Slots Grid */}
                <div className="relative p-3 space-y-1.5">
                  <SortableContext 
                    items={Array.from({ length: 6 }, (_, i) => `battle-team-slot-${team.id}-${i}`)} 
                    strategy={stablePositionStrategy}
                  >
                    {Array.from({ length: 6 }, (_, index) => {
                      const pokemon = team.pokemon[index]
                      return (
                        <div key={index} className="w-full">
                          <BattleTeamSlot
                            id={`battle-team-slot-${team.id}-${index}`}
                            teamId={team.id}
                            pokemon={pokemon}
                            index={index}
                            onClick={(e) => {
                              e?.stopPropagation?.()
                              if (pokemon) {
                                handleRemovePokemonFromTeam(team.id, index)
                              } else if (onPokemonAddToBattleTeam) {
                                onPokemonAddToBattleTeam(team.id, index)
                              }
                            }}
                            showPositionIndicator={true}
                          />
                        </div>
                      )
                    })}
                  </SortableContext>
                </div>
              </div>
            ))
      )}
    </div>
  )
}