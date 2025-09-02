import { useCallback } from 'react'
import { toast } from 'react-toastify'
import { DragSource, DragDestination } from '../types/dragDrop'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'
import { WingullService } from '@/services/api/smartrotom/wingullService'
import { 
  convertPCToTeam, 
  convertTeamToPC, 
  updatePokemonPosition 
} from '../lib/pokemonConversion'

interface UsePokemonMovementProps {
  uuid: string
  pcData: PCPokemon[]
  teamData: PokemonW[]
  setPcData: (data: PCPokemon[]) => void
  setTeamData: (data: PokemonW[]) => void
}

export const usePokemonMovement = ({
  uuid,
  pcData,
  teamData,
  setPcData,
  setTeamData
}: UsePokemonMovementProps) => {

  // Handle API call for Pokemon movement
  const moveWithAPI = useCallback(async (
    source: DragSource,
    destination: DragDestination
  ) => {
    if (!uuid) return false

    try {
      // Convert team moves to box = -1 for API
      const sourceBox = source.type === 'team' ? -1 : source.boxNumber!
      const destinationBox = destination.type === 'team' ? -1 : destination.boxNumber!

      await WingullService.movePokemonInPC(uuid, {
        sourceBox,
        sourceIndex: source.index,
        destinationBox,
        destinationIndex: destination.index
      })

      return true
    } catch (error) {
      console.error('Error moving Pokemon:', error)
      return false
    }
  }, [uuid])

  // Update local state for box to team moves
  const handleBoxToTeamMove = useCallback((
    source: DragSource,
    destination: DragDestination
  ) => {
    const sourcePokemon = pcData.find(p => p.box === source.boxNumber && p.index === source.index)
    if (!sourcePokemon) return

    const teamPokemon = convertPCToTeam(sourcePokemon)

    // Handle team replacement or addition
    if (destination.index < teamData.length && teamData[destination.index]) {
      // Replace existing team member
      const replacedPokemon = teamData[destination.index]
      
      // Remove from PC
      const newPcData = pcData.filter(p => !(p.box === source.boxNumber && p.index === source.index))
      
      // Replace in team
      const newTeamData = [...teamData]
      newTeamData[destination.index] = teamPokemon
      
      // Add replaced Pokemon back to PC at the source location
      const replacedPcPokemon = convertTeamToPC(replacedPokemon, source.index, source.boxNumber!)
      
      setPcData([...newPcData, replacedPcPokemon])
      setTeamData(newTeamData)
    } else {
      // Add to team if there's space
      const newPcData = pcData.filter(p => !(p.box === source.boxNumber && p.index === source.index))
      setPcData(newPcData)
      
      const newTeamData = [...teamData]
      newTeamData[destination.index] = teamPokemon
      setTeamData(newTeamData)
    }
  }, [pcData, teamData, setPcData, setTeamData])

  // Update local state for team to box moves
  const handleTeamToBoxMove = useCallback((
    source: DragSource,
    destination: DragDestination
  ) => {
    const sourcePokemon = teamData[source.index]
    if (!sourcePokemon) return

    const destinationPokemon = pcData.find(p => p.box === destination.boxNumber && p.index === destination.index)
    
    if (destinationPokemon) {
      // Swap team Pokemon with PC Pokemon
      const newTeamData = [...teamData]
      newTeamData[source.index] = convertPCToTeam(destinationPokemon)
      
      const newPcData = pcData.map(p => 
        p.box === destination.boxNumber && p.index === destination.index
          ? convertTeamToPC(sourcePokemon, destination.index, destination.boxNumber!)
          : p
      )
      
      setPcData(newPcData)
      setTeamData(newTeamData)
    } else {
      // Don't allow team to be completely empty
      if (teamData.filter(p => p !== null).length <= 1) {
        toast.error('No puedes dejar el equipo completamente vacío')
        return
      }
      
      // Move to empty slot
      const newTeamData = [...teamData]
      newTeamData.splice(source.index, 1)
      setTeamData(newTeamData)
      
      const newPcPokemon = convertTeamToPC(sourcePokemon, destination.index, destination.boxNumber!)
      const newPcData = [...pcData, newPcPokemon]
      setPcData(newPcData)
    }
  }, [pcData, teamData, setPcData, setTeamData])

  // Update local state for box to box moves
  const handleBoxToBoxMove = useCallback((
    source: DragSource,
    destination: DragDestination
  ) => {
    const sourcePokemon = pcData.find(p => p.box === source.boxNumber && p.index === source.index)
    const destinationPokemon = pcData.find(p => p.box === destination.boxNumber && p.index === destination.index)
    
    if (!sourcePokemon) return

    if (destinationPokemon) {
      // Swap positions
      const newPcData = pcData.map(p => {
        if (p.box === source.boxNumber && p.index === source.index) {
          return updatePokemonPosition(p, destination.index, destination.boxNumber!)
        } else if (p.box === destination.boxNumber && p.index === destination.index) {
          return updatePokemonPosition(p, source.index, source.boxNumber!)
        }
        return p
      })
      setPcData(newPcData)
    } else {
      // Move to empty slot
      const newPcData = pcData.map(p => 
        p.box === source.boxNumber && p.index === source.index
          ? updatePokemonPosition(p, destination.index, destination.boxNumber!)
          : p
      )
      setPcData(newPcData)
    }
  }, [pcData, setPcData])

  // Update local state for team to team moves (reordering)
  const handleTeamToTeamMove = useCallback((
    source: DragSource,
    destination: DragDestination
  ) => {
    if (source.index === destination.index) return

    const newTeamData = [...teamData]
    
    // If destination has a Pokemon, swap them
    if (newTeamData[destination.index] && newTeamData[source.index]) {
      const temp = newTeamData[source.index]
      newTeamData[source.index] = newTeamData[destination.index]
      newTeamData[destination.index] = temp
      setTeamData(newTeamData)
    } else {
      // Simple move to empty slot
      const [movedPokemon] = newTeamData.splice(source.index, 1)
      newTeamData.splice(destination.index, 0, movedPokemon)
      setTeamData(newTeamData)
    }
  }, [teamData, setTeamData])

  // Main move handler
  const handlePokemonMove = useCallback(async (
    source: DragSource,
    destination: DragDestination
  ) => {
    console.log(`Movimiento registrado: ${source.type}[${source.index}] → ${destination.type}[${destination.index}]`)

    try {
      // Make API call first for better UX
      await moveWithAPI(source, destination)

      // Update local state based on move type
      if (source.type === 'box' && destination.type === 'team') {
        handleBoxToTeamMove(source, destination)
      } else if (source.type === 'team' && destination.type === 'box') {
        handleTeamToBoxMove(source, destination)
      } else if (source.type === 'box' && destination.type === 'box') {
        handleBoxToBoxMove(source, destination)
      } else if (source.type === 'team' && destination.type === 'team') {
        handleTeamToTeamMove(source, destination)
      }

      // Success feedback is minimal to avoid spam
      // toast.success('Pokémon movido exitosamente')
    } catch (error) {
      console.error('Error moving Pokemon:', error)
      
      // Fallback to local state update only
      if (source.type === 'box' && destination.type === 'team') {
        handleBoxToTeamMove(source, destination)
      } else if (source.type === 'team' && destination.type === 'box') {
        handleTeamToBoxMove(source, destination)
      } else if (source.type === 'box' && destination.type === 'box') {
        handleBoxToBoxMove(source, destination)
      } else if (source.type === 'team' && destination.type === 'team') {
        handleTeamToTeamMove(source, destination)
      }

      // toast.info('Movimiento aplicado localmente')
    }
  }, [
    moveWithAPI,
    handleBoxToTeamMove,
    handleTeamToBoxMove,
    handleBoxToBoxMove,
    handleTeamToTeamMove
  ])

  return {
    handlePokemonMove
  }
}
