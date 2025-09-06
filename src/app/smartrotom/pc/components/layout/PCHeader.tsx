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
    <div className="bg-gray-300 border-b-4 border-black">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-200 border-2 border-black px-4 py-3">
              <div className="w-10 h-10 bg-black border-2 border-gray-600 flex items-center justify-center mr-3">
                <FaDesktop className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-mono font-bold text-black">
                  PC STORAGE SYSTEM
                </h1>
                <p className="text-gray-700 font-mono text-sm">
                  MANAGE YOUR CAPTURED POKEMON
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Stats cards */}
            <div className="flex items-center bg-gray-200 border-2 border-black px-3 py-2">
              <FaDatabase className="text-black mr-2" />
              <div className="text-center">
                <div className="text-black font-mono font-bold text-sm">{pokemonCount}</div>
                <div className="text-gray-700 font-mono text-xs">PC</div>
              </div>
            </div>

            <div className="flex items-center bg-gray-200 border-2 border-black px-3 py-2">
              <div className="text-center">
                <div className="text-black font-mono font-bold text-sm">{teamCount}/6</div>
                <div className="text-gray-700 font-mono text-xs">TEAM</div>
              </div>
            </div>
            
            <div className="flex items-center bg-gray-200 border-2 border-black px-3 py-2">
              <div className="text-center">
                <div className="text-black font-mono font-bold text-sm">
                  BOX {currentBox + 1} / {totalBoxes}
                </div>
                <div className="text-gray-700 font-mono text-xs">CURRENT BOX</div>
              </div>
            </div>
            
            {/* Action buttons */}
            {onToggleDualBoxMode && (
              <button
                onClick={onToggleDualBoxMode}
                className="px-4 py-2 border-2 flex items-center space-x-2 font-mono text-sm font-bold transition-all duration-150 hover:scale-105 active:scale-95 bg-gray-600 hover:bg-gray-500 text-white border-gray-500 hover:border-gray-400"
                title={isDualBoxMode ? "SWITCH TO SINGLE BOX MODE" : "ACTIVATE DUAL BOX MODE"}
              >
                <FaExchangeAlt />
                <span className="hidden md:inline">
                  {isDualBoxMode ? "ONE BOX" : "TWO BOXES"}
                </span>
              </button>
            )}

            {onShowBoxSelection && (
              <button
                onClick={onShowBoxSelection}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 border-2 border-gray-500 hover:border-gray-400 flex items-center space-x-2 font-mono text-sm font-bold transition-all duration-150 hover:scale-105 active:scale-95"
                title="VIEW ALL BOXES"
              >
                <LuGrid3X3 />
                <span className="hidden md:inline">VIEW ALL</span>
              </button>
            )}
            
            <button
              onClick={onRefresh}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 border-2 border-gray-500 hover:border-gray-400 flex items-center space-x-2 font-mono text-sm font-bold transition-all duration-150 hover:scale-105 active:scale-95"
              title="REFRESH PC DATA"
            >
              <div className="animate-spin">
                <FaSyncAlt className="text-sm" />
              </div>
              <span className="hidden md:inline">REFRESH</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}