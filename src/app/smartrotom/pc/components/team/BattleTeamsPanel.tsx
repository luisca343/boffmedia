import { useState } from 'react'
import { BattleTeam, BattleTeamData } from '@/types/dto/battle-team.dto'
import { PokemonW } from '@/generated/api'
import { FaTrophy, FaPlus, FaEdit, FaTrash, FaStar, FaRegStar } from 'react-icons/fa'
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
      <div className="bg-gradient-to-br from-yellow-800/20 via-orange-800/20 to-red-800/20 backdrop-blur-sm rounded-b-2xl border border-yellow-400/30 border-t-0 shadow-2xl h-full flex items-center justify-center">
        <p className="text-yellow-300">Cargando equipos de batalla...</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-yellow-800/20 via-orange-800/20 to-red-800/20 backdrop-blur-sm rounded-b-2xl border border-yellow-400/30 border-t-0 shadow-2xl h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-700/50 to-orange-700/50 p-3 border-b border-yellow-400/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaTrophy className="text-yellow-300 text-lg" />
            <div>
              <h3 className="text-white font-bold text-lg">Equipos de Batalla</h3>
              <p className="text-yellow-200 text-xs">
                {battleTeamsData.teams.length}/{battleTeamsData.maxTeams} equipos
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
            disabled={battleTeamsData.teams.length >= battleTeamsData.maxTeams}
            title="Crear nuevo equipo de batalla"
          >
            <FaPlus />
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingTeam) && (
        <div className="p-3 bg-black/20 border-b border-yellow-400/30 flex-shrink-0">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nombre del equipo"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full p-2 rounded bg-black/30 text-white border border-yellow-400/30 focus:border-yellow-400"
              maxLength={20}
            />
            <textarea
              placeholder="Descripción (opcional)"
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              className="w-full p-2 rounded bg-black/30 text-white border border-yellow-400/30 focus:border-yellow-400 resize-none"
              rows={2}
              maxLength={100}
            />
            <div className="flex space-x-2">
              <button
                onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
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
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teams List */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {battleTeamsData.teams.length === 0 ? (
          <div className="text-center text-yellow-300 py-8">
            <FaTrophy className="mx-auto text-3xl mb-2 opacity-50" />
            <p>No tienes equipos de batalla</p>
            <p className="text-sm">Crea tu primer equipo para Battle Frontier</p>
          </div>
        ) : (
          battleTeamsData.teams.map((team) => (
            <div
              key={team.id}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedTeam?.id === team.id
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-yellow-400/30 hover:border-yellow-400/60'
              } ${team.isActive ? 'bg-green-400/10' : ''}`}
              onClick={() => setSelectedTeam(selectedTeam?.id === team.id ? null : team)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {team.isActive ? (
                    <FaStar className="text-yellow-400" />
                  ) : (
                    <FaRegStar className="text-yellow-400/50" />
                  )}
                  <h4 className="text-white font-semibold">{team.name}</h4>
                </div>
                <div className="flex items-center space-x-1">
                  {!team.isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetActiveTeam(team.id)
                      }}
                      className="text-yellow-400 hover:text-yellow-300 p-1"
                      title="Establecer como equipo activo"
                    >
                      <FaRegStar />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEdit(team)
                    }}
                    className="text-blue-400 hover:text-blue-300 p-1"
                    title="Editar equipo"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTeam(team.id)
                    }}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Eliminar equipo"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              {team.description && (
                <p className="text-yellow-200 text-sm mb-2">{team.description}</p>
              )}
              
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: 6 }, (_, index) => {
                  const pokemon = team.pokemon[index]
                  return (
                    <div
                      key={index}
                      className={`aspect-square rounded border-2 border-dashed flex items-center justify-center ${
                        pokemon 
                          ? 'border-yellow-400/50 bg-yellow-400/10' 
                          : 'border-yellow-400/30 bg-black/20'
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
                        <div className="relative w-full h-full">
                          <PokemonSprite
                            id={pokemon.dex}
                            form={pokemon.form || 'base'}
                            palette={pokemon.palette || 'none'}
                            width={24}
                            height={24}
                            showStatus={false}
                          />
                        </div>
                      ) : (
                        <FaPlus className="text-yellow-400/50 text-xs" />
                      )}
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-2 text-xs text-yellow-300">
                {team.pokemon.filter(p => p !== null).length}/6 Pokémon
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
