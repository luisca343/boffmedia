import { FaDesktop, FaSyncAlt, FaDatabase } from 'react-icons/fa'
import { LuGrid3X3 } from 'react-icons/lu'
import { FaExchangeAlt } from 'react-icons/fa'

interface PCHeaderProps {
  currentBox: number;
  totalBoxes: number;
  pokemonCount: number;
  teamCount: number;
  isDualBoxMode?: boolean;
  onRefresh: () => void;
  onShowBoxSelection?: () => void;
  onToggleDualBoxMode?: () => void;
}

export default function PCHeader({ 
  currentBox, 
  totalBoxes, 
  pokemonCount,
  teamCount, 
  isDualBoxMode = false,
  onRefresh,
  onShowBoxSelection,
  onToggleDualBoxMode
}: PCHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 backdrop-blur-md border-b-2 border-purple-500/50 shadow-xl">
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
            {/* 
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
            */}
            
            {/* Dual box mode toggle */}
            {onToggleDualBoxMode && (
              <button
                onClick={onToggleDualBoxMode}
                className={`px-4 py-2 rounded-xl flex items-center space-x-2 border transition-all duration-200 hover:scale-105 shadow-lg ${
                  isDualBoxMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-400/30' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400/30'
                }`}
                title={isDualBoxMode ? "Cambiar a modo caja única" : "Activar modo dual caja"}
              >
                <FaExchangeAlt />
                <span className="hidden md:inline">
                  {isDualBoxMode ? "Una Caja" : "Dos Cajas"}
                </span>
              </button>
            )}

            {/* Box selection button */}
            {onShowBoxSelection && (
              <button
                onClick={onShowBoxSelection}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 border border-yellow-400/30 transition-all duration-200 hover:scale-105 shadow-lg"
                title="Ver todas las cajas"
              >
                <LuGrid3X3 />
                <span className="hidden md:inline">Ver Todas</span>
              </button>
            )}
            
            <button
              onClick={onRefresh}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 border border-green-400/30 transition-all duration-200 hover:scale-105 shadow-lg"
              title="Actualizar datos del PC"
            >
              <FaSyncAlt className="text-sm" />
              <span className="hidden md:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
