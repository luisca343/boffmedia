import { useState } from 'react'
import { FaChevronLeft, FaChevronRight, FaArchive } from 'react-icons/fa'
import { PCBoxData } from '@/types/dto/pc-pokemon.dto'
import BoxSelectionPopup from './BoxSelectionPopup'
import { LuGrid3X3 } from 'react-icons/lu';

interface BoxNavigationProps {
  currentBox: number;
  totalBoxes: number;
  boxes: PCBoxData[];
  onBoxChange: (boxNumber: number) => void;
}

export default function BoxNavigation({ 
  currentBox, 
  totalBoxes, 
  boxes,
  onBoxChange 
}: BoxNavigationProps) {
  const [showBoxSelection, setShowBoxSelection] = useState(false)

  const handlePrevious = () => {
    // Loop to last box if at first box
    const newBox = currentBox === 0 ? totalBoxes - 1 : currentBox - 1
    onBoxChange(newBox)
  }

  const handleNext = () => {
    // Loop to first box if at last box
    const newBox = currentBox === totalBoxes - 1 ? 0 : currentBox + 1
    onBoxChange(newBox)
  }

  const handleBoxSelect = (boxNumber: number) => {
    onBoxChange(boxNumber)
    setShowBoxSelection(false)
  }

  return (
    <>
      <div className="bg-gradient-to-r from-purple-700/50 via-indigo-700/50 to-blue-700/50 backdrop-blur-md border-b border-purple-400/30 py-3 px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border bg-purple-600 hover:bg-purple-700 text-white border-purple-400/50 hover:scale-105 shadow-lg transition-all duration-200"
          >
            <FaChevronLeft />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-indigo-800/60 px-4 py-2 rounded-xl border border-indigo-400/40 shadow-lg">
              <FaArchive className="text-indigo-300 mr-2 text-lg" />
              <div className="text-center">
                <div className="text-white font-bold text-lg">
                  Caja {currentBox + 1} / {totalBoxes}
                </div>
              </div>
            </div>

            {/* Box selection button */}
            <button
              onClick={() => setShowBoxSelection(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-xl flex items-center space-x-2 border border-yellow-400/30 transition-all duration-200 hover:scale-105 shadow-lg"
              title="Seleccionar caja"
            >
              <LuGrid3X3 />
              <span className="hidden sm:inline">Ver Todas</span>
            </button>
          </div>

          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border bg-purple-600 hover:bg-purple-700 text-white border-purple-400/50 hover:scale-105 shadow-lg transition-all duration-200"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <FaChevronRight />
          </button>
        </div>
      </div>

      {showBoxSelection && (
        <BoxSelectionPopup
          boxes={boxes}
          currentBox={currentBox}
          onBoxSelect={handleBoxSelect}
          onClose={() => setShowBoxSelection(false)}
        />
      )}
    </>
  )
}