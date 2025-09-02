import { FaDesktop, FaSyncAlt, FaDatabase } from 'react-icons/fa'

interface PCHeaderProps {
  currentBox: number;
  totalBoxes: number;
  pokemonCount: number;
  teamCount: number;
  onRefresh: () => void;
}

export default function PCHeader({ 
  currentBox, 
  totalBoxes, 
  pokemonCount,
  teamCount, 
  onRefresh 
}: PCHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-purple-800/90 via-indigo-800/90 to-blue-800/90 backdrop-blur-md border-b-2 border-purple-500/50 shadow-xl">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-purple-700/50 px-4 py-2 rounded-xl border border-purple-400/30">
              <FaDesktop className="text-purple-300 mr-3 text-xl" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Sistema de Almacenamiento PC
                </h1>
                <p className="text-purple-200 text-sm">
                  Administra tus Pokémon capturados
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-indigo-700/50 px-4 py-2 rounded-xl border border-indigo-400/30">
              <FaDatabase className="text-indigo-300 mr-2" />
              <div className="text-center">
                <div className="text-white font-bold text-lg">{pokemonCount}</div>
                <div className="text-indigo-200 text-xs">PC</div>
              </div>
            </div>

            <div className="flex items-center bg-green-700/50 px-4 py-2 rounded-xl border border-green-400/30">
              <div className="text-center">
                <div className="text-white font-bold text-lg">{teamCount}/6</div>
                <div className="text-green-200 text-xs">Equipo</div>
              </div>
            </div>
            
            <div className="flex items-center bg-blue-700/50 px-4 py-2 rounded-xl border border-blue-400/30">
              <div className="text-center">
                <div className="text-white font-bold text-lg">
                  Caja {currentBox + 1} / {totalBoxes}
                </div>
                <div className="text-blue-200 text-xs">Caja Actual</div>
              </div>
            </div>
            
            <button
              onClick={onRefresh}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 border border-green-400/30 transition-all duration-200 hover:scale-105 shadow-lg"
              title="Actualizar datos del PC"
            >
              <FaSyncAlt className="text-sm" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
