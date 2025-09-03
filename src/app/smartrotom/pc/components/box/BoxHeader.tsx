import { FaArchive, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
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
  const colorScheme = isSecondary ? {
    bg: 'from-green-700/50 to-emerald-700/50',
    border: 'border-green-400/40',
    text: 'text-green-300',
    button: 'bg-green-600 hover:bg-green-700 border-green-400/50',
    progress: 'bg-green-400/60'
  } : {
    bg: 'from-purple-700/50 to-indigo-700/50',
    border: 'border-purple-400/40',
    text: 'text-purple-300',
    button: 'bg-purple-600 hover:bg-purple-700 border-purple-400/50',
    progress: 'bg-purple-400/60'
  }

  return (
    <div className={`bg-gradient-to-r ${colorScheme.bg} p-3 border-b ${colorScheme.border} flex-shrink-0`}>
      <div className="flex items-center justify-between">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          className={`p-2 rounded-lg border ${colorScheme.button} text-white transition-all duration-200 hover:scale-105 shadow-sm`}
          title="Caja anterior"
        >
          <FaChevronLeft className="text-sm" />
        </button>

        {/* Box Info */}
        <div className="flex items-center space-x-3 flex-1 justify-center">
          <FaArchive className={`${colorScheme.text} text-lg`} />
          <div className="text-center">
            <h3 className="text-white font-bold">
              Caja {boxData.boxNumber + 1}
            </h3>
            <p className={`${colorScheme.text} text-xs`}>
              {pokemonCount}/30 Pokémon
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="w-16 bg-black/30 rounded-full h-2">
            <div 
              className={`${colorScheme.progress} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${(pokemonCount / 30) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Next Button */}
          <button
            onClick={handleNext}
            className={`p-2 rounded-lg border ${colorScheme.button} text-white transition-all duration-200 hover:scale-105 shadow-sm`}
            title="Siguiente caja"
          >
            <FaChevronRight className="text-sm" />
          </button>

          {/* Deselect Button (only for secondary box) */}
          {isSecondary && onDeselect && (
            <button
              onClick={onDeselect}
              className="p-2 rounded-lg border bg-red-600 hover:bg-red-700 border-red-400/50 text-white transition-all duration-200 hover:scale-105 shadow-sm text-xs"
              title="Cerrar caja secundaria"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
