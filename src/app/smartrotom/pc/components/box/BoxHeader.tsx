import { FaArchive, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa'
import { PCBoxData } from '@/types/dto/pc-pokemon.dto'

interface BoxHeaderProps {
  boxData: PCBoxData
  totalBoxes: number
  isSecondary?: boolean
  onBoxChange: (boxNumber: number) => void
  onDeselect?: () => void
}

export default function BoxHeader({ 
  boxData, 
  totalBoxes, 
  isSecondary = false, 
  onBoxChange,
  onDeselect 
}: BoxHeaderProps) {
  const getPokemonCount = (boxData: PCBoxData) => {
    return boxData.pokemon.filter(p => p !== null).length
  }

  const handlePrevious = () => {
    const newBox = boxData.boxNumber === 0 ? totalBoxes - 1 : boxData.boxNumber - 1
    onBoxChange(newBox)
  }

  const handleNext = () => {
    const newBox = boxData.boxNumber === totalBoxes - 1 ? 0 : boxData.boxNumber + 1
    onBoxChange(newBox)
  }

  const pokemonCount = getPokemonCount(boxData)

  return (
    <div className={`${
      isSecondary ? 'bg-gray-400' : 'bg-gray-300'
    } border-b-4 border-black p-3`}>
      <div className="flex items-center justify-between">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          className={`${
            isSecondary 
              ? 'bg-gray-600 hover:bg-gray-500 border-gray-500 hover:border-gray-400' 
              : 'bg-gray-600 hover:bg-gray-500 border-gray-500 hover:border-gray-400'
          } border-2 text-white p-2 transition-all duration-150 active:scale-95`}
          title="PREVIOUS BOX"
        >
          <FaChevronLeft className="text-sm" />
        </button>

        {/* Box Info */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 ${
            isSecondary ? 'bg-black' : 'bg-black'
          } border-2 ${
            isSecondary ? 'border-gray-600' : 'border-gray-600'
          } flex items-center justify-center`}>
            <FaArchive className={`${
              isSecondary ? 'text-white' : 'text-white'
            } text-lg`} />
          </div>
          <div>
            <h3 className="text-black font-mono font-bold text-lg">
              BOX {boxData.boxNumber + 1}
            </h3>
            <p className="text-gray-700 font-mono text-xs">
              {pokemonCount}/30 POKEMON
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Next Button */}
          <button
            onClick={handleNext}
            className={`${
              isSecondary 
                ? 'bg-gray-600 hover:bg-gray-500 border-gray-500 hover:border-gray-400' 
                : 'bg-gray-600 hover:bg-gray-500 border-gray-500 hover:border-gray-400'
            } border-2 text-white p-2 transition-all duration-150 active:scale-95`}
            title="NEXT BOX"
          >
            <FaChevronRight className="text-sm" />
          </button>

          {/* Deselect Button (only for secondary box) */}
          {isSecondary && onDeselect && (
            <button
              onClick={onDeselect}
              className="bg-red-600 hover:bg-red-500 border-2 border-red-500 hover:border-red-400 text-white p-2 transition-all duration-150 active:scale-95"
              title="CLOSE SECONDARY BOX"
            >
              <FaTimes className="text-sm" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}