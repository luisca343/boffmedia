import { FaTimes, FaArchive } from 'react-icons/fa'
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
    if (count === 0) return { color: 'from-gray-600 to-gray-700', text: 'Vacía' }
    if (count < 10) return { color: 'from-green-600 to-green-700', text: 'Pocos' }
    if (count < 20) return { color: 'from-yellow-600 to-yellow-700', text: 'Media' }
    return { color: 'from-red-600 to-red-700', text: 'Llena' }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-purple-400/30 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-4 border-b border-purple-400/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FaArchive className="text-purple-300 text-xl" />
              <div>
                <h3 className="text-xl font-bold text-white">Seleccionar Caja</h3>
                <p className="text-purple-200 text-sm">Elige una caja para navegar</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              aria-label="Cerrar selector"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Box Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {boxes.map((box, index) => {
              const pokemonCount = getPokemonCount(box)
              const status = getBoxStatus(pokemonCount)
              const isCurrentBox = index === currentBox

              return (
                <button
                  key={index}
                  onClick={() => onBoxSelect(index)}
                  className={`relative bg-gradient-to-br ${status.color} p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                    isCurrentBox
                      ? 'border-yellow-400 shadow-yellow-400/50 shadow-lg scale-105'
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  {/* Current box indicator */}
                  {isCurrentBox && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      ★
                    </div>
                  )}

                  {/* Box icon */}
                  <div className="flex justify-center mb-2">
                    <FaArchive className="text-white text-2xl" />
                  </div>

                  {/* Box number */}
                  <div className="text-white font-bold text-lg mb-1">
                    Caja {index + 1}
                  </div>

                  {/* Pokemon count */}
                  <div className="text-white/80 text-sm mb-2">
                    {pokemonCount}/30 Pokémon
                  </div>

                  {/* Status indicator */}
                  <div className="bg-black/30 text-white text-xs px-2 py-1 rounded-full">
                    {status.text}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 bg-black/30 rounded-full h-2">
                    <div 
                      className="bg-white/60 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(pokemonCount / 30) * 100}%` }}
                    ></div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-purple-800/50 to-indigo-800/50 p-4 border-t border-purple-400/30">
          <div className="flex items-center justify-between text-sm">
            <div className="text-purple-200">
              Caja actual: <span className="text-white font-bold">Caja {currentBox + 1}</span>
            </div>
            <div className="flex items-center space-x-4 text-purple-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <span>Vacía</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span>Pocos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                <span>Media</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span>Llena</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}