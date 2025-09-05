import { useState } from 'react'
import { PCBoxData, PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { BattleTeam } from '@/types/dto/battle-team.dto'
import BoxSelectionPopup from './BoxSelectionPopup'
import { AnimatePresence } from 'framer-motion'

interface BoxNavigationProps {
  currentBox: number;
  secondaryBox?: number | null;
  isDualBoxMode?: boolean;
  totalBoxes: number;
  boxes: PCBoxData[];
  onBoxChange: (boxNumber: number) => void;
  onSecondaryBoxChange?: (boxNumber: number | null) => void;
  selectedPokemon?: PCPokemon | null;
  onPokemonClick?: (pokemon: PCPokemon | null) => void;
  onPokemonMove?: (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => void;
  battleTeams?: BattleTeam[];
  onAddToBattleTeam?: (teamId: string, position: number, pokemon: PCPokemon) => void;
  showBoxSelection?: boolean;
  onShowBoxSelection?: (show: boolean) => void;
}

export default function BoxNavigation({ 
  currentBox, 
  secondaryBox,
  boxes,
  onBoxChange,
  onSecondaryBoxChange,
  showBoxSelection = false,
  onShowBoxSelection
}: BoxNavigationProps) {
  const [selectingForSecondary, setSelectingForSecondary] = useState(false)

  const handleBoxSelect = (boxNumber: number) => {
    if (selectingForSecondary && onSecondaryBoxChange) {
      onSecondaryBoxChange(boxNumber === currentBox ? null : boxNumber)
      setSelectingForSecondary(false)
    } else {
      onBoxChange(boxNumber)
    }
    onShowBoxSelection?.(false)
  }

  const handleClose = () => {
    onShowBoxSelection?.(false)
    setSelectingForSecondary(false)
  }

  return (
    <AnimatePresence>
      {showBoxSelection && (
        <BoxSelectionPopup
          boxes={boxes}
          currentBox={selectingForSecondary ? (secondaryBox || currentBox) : currentBox}
          onBoxSelect={handleBoxSelect}
          onClose={handleClose}
        />
      )}
    </AnimatePresence>
  )
}