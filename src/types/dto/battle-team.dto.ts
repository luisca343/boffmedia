import { PokemonW } from '@/generated/api'

export interface BattleTeam {
  id: string
  name: string
  description?: string
  pokemon: (PokemonW | null)[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BattleTeamSlot {
  teamId: string
  position: number
  pokemon: PokemonW | null
}

export interface CreateBattleTeamRequest {
  name: string
  description?: string
}

export interface UpdateBattleTeamRequest {
  id: string
  name?: string
  description?: string
  pokemon?: (PokemonW | null)[]
}

export interface AddPokemonToBattleTeamRequest {
  teamId: string
  position: number
  pokemonId: string // This will be the identifier from PC
}

export interface RemovePokemonFromBattleTeamRequest {
  teamId: string
  position: number
}

export interface BattleTeamData {
  teams: BattleTeam[]
  maxTeams: number
  activeTeamId?: string
}
