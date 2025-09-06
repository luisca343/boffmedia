import { FaTimes, FaArchive } from 'react-icons/fa'
import { PiTarget } from 'react-icons/pi'
import { PCBoxData } from '@/types/dto/pc-pokemon.dto'

interface BoxSelectionPopupProps {
  boxes: PCBoxData[];
  currentBox: number;
  onBoxSelect: (boxNumber: number) => void;
  onClose: () => void;
}

export default function BoxSelectionPopup({ 
  boxes, 
  currentBox, 
  onBoxSelect, 
  onClose 
}: BoxSelectionPopupProps) {
  const getPokemonCount = (box: PCBoxData) => {
    return box.pokemon.filter(p => p !== null).length
  }

  const getBoxStatus = (count: number) => {
    if (count === 0) return { 
      color: 'from-gray-600 to-gray-700', 
      text: 'EMPTY',
      bgColor: 'bg-gray-200',
      borderColor: 'border-gray-600'
    }
    if (count < 10) return { 
      color: 'from-gray-500 to-gray-600', 
      text: 'LOW',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-500'
    }
    if (count < 20) return { 
      color: 'from-gray-400 to-gray-500', 
      text: 'MEDIUM',
      bgColor: 'bg-white',
      borderColor: 'border-gray-400'
    }
    if (count < 30) return { 
      color: 'from-gray-600 to-gray-700', 
      text: 'HIGH',
      bgColor: 'bg-gray-300',
      borderColor: 'border-gray-600'
    }
    return { 
      color: 'from-black to-gray-800', 
      text: 'FULL',
      bgColor: 'bg-gray-400',
      borderColor: 'border-black'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-300 border-4 border-black max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-400 border-b-4 border-black p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black border-2 border-gray-600 flex items-center justify-center">
                <FaArchive className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-black font-mono font-bold text-xl">BOX SELECTOR</h3>
                <p className="text-gray-700 font-mono text-sm">CHOOSE A BOX TO NAVIGATE</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-500 border-2 border-gray-500 hover:border-gray-400 text-white p-2 transition-all duration-150 active:scale-95"
              aria-label="CLOSE SELECTOR"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Box Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {boxes.map((box, index) => {
              const pokemonCount = getPokemonCount(box)
              const status = getBoxStatus(pokemonCount)
              const isCurrentBox = index === currentBox

              return (
                <button
                  key={index}
                  onClick={() => onBoxSelect(index)}
                  className={`relative ${status.bgColor} border-4 p-4 transition-all duration-150 hover:scale-105 active:scale-95 ${
                    isCurrentBox
                      ? 'border-black bg-gray-500'
                      : `${status.borderColor} hover:border-gray-800`
                  }`}
                >
                  {/* Current box indicator */}
                  {isCurrentBox && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-black border-2 border-gray-600 flex items-center justify-center">
                      <PiTarget className="text-white text-sm" />
                    </div>
                  )}

                  {/* Box icon */}
                  <div className="flex justify-center mb-3">
                    <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center">
                      <FaArchive className="text-black text-lg" />
                    </div>
                  </div>

                  {/* Box info */}
                  <div>
                    <div className="text-black font-mono font-bold text-lg mb-1">
                      BOX {index + 1}
                    </div>
                    
                    <div className="text-gray-700 font-mono text-sm mb-3">
                      {pokemonCount}/30 POKEMON
                    </div>

                    {/* Status indicator */}
                    <div className="bg-white border-2 border-black text-black font-mono text-xs px-2 py-1 mb-3">
                      {status.text}
                    </div>

                    {/* Progress bar */}
                    <div className="bg-white border-2 border-black h-3">
                      <div 
                        className="bg-black h-full transition-all duration-500"
                        style={{ width: `${(pokemonCount / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-400 border-t-4 border-black p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-700 font-mono">
              CURRENT BOX: <span className="text-black font-bold">BOX {currentBox + 1}</span>
            </div>
            <div className="flex items-center space-x-4 text-gray-700 font-mono text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-200 border border-gray-600" />
                <span>EMPTY</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-100 border border-gray-500" />
                <span>LOW</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white border border-gray-400" />
                <span>MEDIUM</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-black border border-black" />
                <span>FULL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}