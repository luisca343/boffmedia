import { useState } from 'react'
import { BattleTeam, BattleTeamData } from '@/types/dto/battle-team.dto'
import { PokemonW } from '@/generated/api'
import { FaTrophy, FaPlus, FaEdit, FaTrash, FaStar, FaRegStar } from 'react-icons/fa'
import { PiUsers, PiTarget, PiInfo } from 'react-icons/pi'
import { toast } from 'react-toastify'
import { WingullService } from '@/services/api/smartrotom/wingullService'
import { PokemonSprite } from '@/app/smartrotom/pokedex/_components/PokemonSprite'
import { motion, AnimatePresence } from 'framer-motion'

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
      <div className="bg-slate-900/40 backdrop-blur-sm rounded-b-2xl border border-slate-500/30 border-t-0 shadow-2xl h-full flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <motion.div
            className="w-8 h-8 border-2 border-amber-400/50 rounded-full border-t-amber-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-slate-300">Cargando equipos de batalla...</p>
        </div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const teamVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-b-2xl border border-slate-500/30 border-t-0 shadow-2xl h-full flex flex-col overflow-hidden">
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-4 border-b border-slate-500/30 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm"
            >
              <FaTrophy className="text-amber-300 text-lg" />
            </motion.div>
            <div>
              <h3 className="text-white font-bold text-xl">Equipos de Batalla</h3>
              <div className="flex items-center space-x-2">
                <p className="text-slate-300 text-sm font-medium">
                  {battleTeamsData.teams.length}/{battleTeamsData.maxTeams} equipos
                </p>
                {battleTeamsData.teams.find(t => t.isActive) && (
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-300">Activo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <motion.button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:opacity-50 text-white p-3 rounded-xl transition-colors flex items-center justify-center backdrop-blur-sm border border-white/10"
            disabled={battleTeamsData.teams.length >= battleTeamsData.maxTeams}
            title="Crear nuevo equipo de batalla"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlus className="text-sm" />
          </motion.button>
        </div>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showCreateForm || editingTeam) && (
          <motion.div
            className="p-4 bg-slate-800/50 border-b border-slate-500/30 flex-shrink-0"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Nombre del equipo"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-700/50 text-white border border-slate-500/50 focus:border-blue-400/50 focus:bg-slate-700/70 transition-all backdrop-blur-sm"
                  maxLength={20}
                />
              </div>
              <div>
                <textarea
                  placeholder="Descripción (opcional)"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-700/50 text-white border border-slate-500/50 focus:border-blue-400/50 focus:bg-slate-700/70 transition-all backdrop-blur-sm resize-none"
                  rows={2}
                  maxLength={100}
                />
              </div>
              <div className="flex space-x-2">
                <motion.button
                  onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {editingTeam ? 'Actualizar' : 'Crear'}
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingTeam(null)
                    setNewTeamName('')
                    setNewTeamDescription('')
                  }}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancelar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teams List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {battleTeamsData.teams.length === 0 ? (
          <motion.div 
            className="text-center text-slate-400 py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/30 rounded-2xl flex items-center justify-center">
              <FaTrophy className="text-3xl opacity-50" />
            </div>
            <h4 className="text-lg font-semibold mb-2">No tienes equipos de batalla</h4>
            <p className="text-sm text-slate-500">Crea tu primer equipo para Battle Frontier</p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {battleTeamsData.teams.map((team) => (
              <motion.div
                key={team.id}
                variants={teamVariants}
                className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all backdrop-blur-sm overflow-hidden ${
                  selectedTeam?.id === team.id
                    ? 'border-blue-400/60 bg-blue-400/10'
                    : 'border-slate-500/40 hover:border-slate-400/60 bg-slate-800/30'
                } ${team.isActive ? 'bg-green-400/5 border-green-400/40' : ''}`}
                onClick={() => setSelectedTeam(selectedTeam?.id === team.id ? null : team)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-black/5 pointer-events-none" />
                
                <div className="relative">
                  {/* Team Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border backdrop-blur-sm ${
                        team.isActive 
                          ? 'bg-green-400/20 border-green-400/40' 
                          : 'bg-amber-400/20 border-amber-400/40'
                      }`}>
                        {team.isActive ? (
                          <FaStar className="text-green-400 text-sm" />
                        ) : (
                          <FaRegStar className="text-amber-400 text-sm" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-lg">{team.name}</h4>
                        {team.isActive && (
                          <div className="flex items-center space-x-1">
                            <PiTarget className="text-green-400 text-xs" />
                            <span className="text-green-400 text-xs font-medium">Equipo Activo</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      {!team.isActive && (
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetActiveTeam(team.id)
                          }}
                          className="text-amber-400 hover:text-amber-300 p-2 rounded-lg hover:bg-amber-400/10 transition-colors"
                          title="Establecer como equipo activo"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FaRegStar className="text-sm" />
                        </motion.button>
                      )}
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEdit(team)
                        }}
                        className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-400/10 transition-colors"
                        title="Editar equipo"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaEdit className="text-sm" />
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTeam(team.id)
                        }}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
                        title="Eliminar equipo"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaTrash className="text-sm" />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Team Description */}
                  {team.description && (
                    <p className="text-slate-300 text-sm mb-4 bg-slate-700/20 p-2 rounded-lg border border-slate-600/30">
                      {team.description}
                    </p>
                  )}
                  
                  {/* Pokemon Grid */}
                  <div className="grid grid-cols-6 gap-2 mb-3">
                    {Array.from({ length: 6 }, (_, index) => {
                      const pokemon = team.pokemon[index]
                      return (
                        <motion.div
                          key={index}
                          className={`aspect-square rounded-xl border-2 flex items-center justify-center backdrop-blur-sm transition-all ${
                            pokemon 
                              ? 'border-green-400/50 bg-green-400/10 hover:border-green-400/70 hover:bg-green-400/15' 
                              : 'border-slate-500/40 bg-slate-700/20 border-dashed hover:border-slate-400/60'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (pokemon) {
                              handleRemovePokemonFromTeam(team.id, index)
                            } else if (onPokemonAddToBattleTeam) {
                              onPokemonAddToBattleTeam(team.id, index)
                            }
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {pokemon ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <PokemonSprite
                                id={pokemon.dex}
                                form={pokemon.form || 'base'}
                                palette={pokemon.palette || 'none'}
                                width={32}
                                height={32}
                                showStatus={false}
                              />
                              {/* Small position indicator */}
                              <div className="absolute -top-1 -left-1 w-4 h-4 bg-slate-800/80 border border-slate-500/50 rounded-full flex items-center justify-center">
                                <span className="text-slate-300 text-[10px] font-bold">{index + 1}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <FaPlus className="text-slate-500 text-sm mb-1" />
                              <span className="text-slate-500 text-[10px] font-medium">{index + 1}</span>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                  
                  {/* Team Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <PiUsers className="text-slate-400" />
                        <span className="text-slate-300 font-medium">
                          {team.pokemon.filter(p => p !== null).length}/6 Pokémon
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            i < team.pokemon.filter(p => p !== null).length 
                              ? 'bg-green-400' 
                              : 'bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}