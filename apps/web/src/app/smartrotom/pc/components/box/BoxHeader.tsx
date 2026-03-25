import { FaArchive, FaChevronLeft, FaChevronRight, FaTimes, FaDatabase } from 'react-icons/fa'
import { PiMagnifyingGlass, PiSliders, PiX, PiTarget } from 'react-icons/pi'
import { PCBoxData } from '@/types/dto/pc-pokemon.dto'
import { FilterBoxData, isFilterBox } from '../../types/filter.types'

interface BoxHeaderProps {
  boxData: PCBoxData | FilterBoxData
  totalBoxes: number
  isSecondary?: boolean
  onBoxChange: (boxNumber: number) => void
  onDeselect?: () => void
  onShowBoxSelection?: () => void
  onShowSearch?: () => void
  onShowFilters?: () => void
  onClearFilters?: () => void
  onModifyFilters?: () => void
  onNavigateFilterPage?: (direction: 'prev' | 'next') => void
}

export default function BoxHeader({ 
  boxData, 
  totalBoxes, 
  isSecondary = false, 
  onBoxChange,
  onDeselect,
  onShowBoxSelection,
  onShowSearch,
  onShowFilters,
  onClearFilters,
  onModifyFilters,
  onNavigateFilterPage
}: BoxHeaderProps) {
  const isFilterBox = 'type' in boxData && boxData.type === 'filter'
  
  const getPokemonCount = (boxData: PCBoxData | FilterBoxData) => {
    if (isFilterBox) {
      const filterBox = boxData as FilterBoxData
      return `${filterBox.resultSummary.currentPage}/${filterBox.resultSummary.totalPages} (${filterBox.resultSummary.totalResults} total)`
    }
    return (boxData as PCBoxData).pokemon.filter(p => p !== null).length
  }

  const playClickSound = () => {
    try {
      const audio = new Audio('/smartrotom/audio/apps/PC/CLICK.ogg')
      audio.volume = 0.5 // Adjust volume as needed
      audio.play().catch(console.error)
    } catch (error) {
      console.error('Error playing click sound:', error)
    }
  }

  const handlePrevious = () => {
    playClickSound()
    if (isFilterBox) {
      // Use filter page navigation
      if (onNavigateFilterPage) {
        onNavigateFilterPage('prev')
      }
    } else {
      const newBox = boxData.boxNumber === 0 ? totalBoxes - 1 : boxData.boxNumber - 1
      onBoxChange(newBox)
    }
  }

  const handleNext = () => {
    playClickSound()
    if (isFilterBox) {
      // Use filter page navigation
      if (onNavigateFilterPage) {
        onNavigateFilterPage('next')
      }
    } else {
      const newBox = boxData.boxNumber === totalBoxes - 1 ? 0 : boxData.boxNumber + 1
      onBoxChange(newBox)
    }
  }

  const handleBoxSelection = () => {
    playClickSound()
    if (onShowBoxSelection) {
      onShowBoxSelection()
    }
  }

  const handleDeselect = () => {
    playClickSound()
    if (onDeselect) {
      onDeselect()
    }
  }

  const pokemonCount = getPokemonCount(boxData)
  
  // Determine if navigation buttons should be enabled
  const canNavigatePrevious = isFilterBox 
    ? (boxData as FilterBoxData).resultSummary.totalPages > 1 // Always allow navigation if multiple pages (looping)
    : boxData.boxNumber > 0
    
  const canNavigateNext = isFilterBox
    ? (boxData as FilterBoxData).resultSummary.totalPages > 1 // Always allow navigation if multiple pages (looping)
    : boxData.boxNumber < totalBoxes - 1
  const colorScheme = isFilterBox ? {
    // Special colors for filter boxes
    bg: 'from-purple-800/80 to-purple-700/80',
    accent: 'from-purple-500/10 via-transparent to-pink-500/10',
    iconBg: 'from-purple-500/20 to-pink-500/20',
    text: 'text-purple-300',
    button: 'bg-purple-600 hover:bg-purple-700 border-white/10',
    progress: 'bg-purple-400'
  } : isSecondary ? {
    bg: 'from-slate-800/80 to-slate-700/80',
    accent: 'from-green-500/5 via-transparent to-emerald-500/5',
    iconBg: 'from-green-500/20 to-emerald-500/20',
    text: 'text-green-300',
    button: 'bg-green-600 hover:bg-green-700 border-white/10',
    progress: 'bg-green-400'
  } : {
    bg: 'from-slate-800/80 to-slate-700/80',
    accent: 'from-blue-500/5 via-transparent to-purple-500/5',
    iconBg: 'from-blue-500/20 to-purple-500/20',
    text: 'text-blue-300',
    button: 'bg-blue-600 hover:bg-blue-700 border-white/10',
    progress: 'bg-blue-400'
  }

  return (
    <div className={`relative bg-gradient-to-r ${colorScheme.bg} p-4 flex-shrink-0 rounded-t-2xl ${
      isFilterBox ? 'border-2 border-purple-400/30 shadow-lg shadow-purple-400/20' : ''
    }`}>
      {/* Enhanced background pattern */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.accent} pointer-events-none rounded-t-2xl`} />
      <div className="relative flex items-center justify-between">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          className={`${colorScheme.button} text-white p-3 rounded-xl transition-colors flex items-center justify-center backdrop-blur-sm border`}
          title={isFilterBox ? "Página anterior" : "Caja anterior"}
        >
          <FaChevronLeft className="text-sm" />
        </button>
        
        {/* Box Info */}
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 bg-gradient-to-br ${colorScheme.iconBg} rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm`}
          >
            {isFilterBox ? (
              <PiTarget className={`${colorScheme.text} text-lg`} />
            ) : (
              <FaArchive className={`${colorScheme.text} text-lg`} />
            )}
          </div>
          <div>
            <h3 className="text-white font-bold text-xl">
              {isFilterBox 
                ? (boxData as FilterBoxData).title 
                : `Caja ${boxData.boxNumber + 1}`
              }
            </h3>
            <p className="text-slate-300 text-sm font-medium">
              {isFilterBox 
                ? pokemonCount 
                : `${pokemonCount}/30 Pokémon`
              }
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Filter Box: Clear Filters and Modify Filters Buttons */}
          {isFilterBox && (
            <>
              {onModifyFilters && (
                <button
                  onClick={onModifyFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors flex items-center justify-center backdrop-blur-sm border border-white/10 space-x-2"
                  title="Modificar filtros"
                >
                  <PiSliders className="text-sm" />
                  <span className="hidden sm:inline text-xs font-medium">Filtros</span>
                </button>
              )}
              {onClearFilters && (
                <button
                  onClick={onClearFilters}
                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition-colors flex items-center justify-center backdrop-blur-sm border border-white/10 space-x-2"
                  title="Limpiar filtros"
                >
                  <PiX className="text-sm" />
                  <span className="hidden sm:inline text-xs font-medium">Limpiar</span>
                </button>
              )}
            </>
          )}
          
          {/* Normal Box: Search and Filter Buttons */}
          {!isFilterBox && (
            <>
              {onShowFilters && (
                <button
                  onClick={onShowFilters}
                  className={`${colorScheme.button} text-white p-3 rounded-xl transition-colors flex items-center justify-center backdrop-blur-sm border`}
                  title="Filtrar Pokémon"
                >
                  <PiSliders className="text-sm" />
                </button>
              )}
            </>
          )}
          
          {/* Box Selection Button */}
          {onShowBoxSelection && !isFilterBox && (
            <button
              onClick={handleBoxSelection}
              className={`${colorScheme.button} text-white p-3 rounded-xl transition-colors flex items-center justify-center backdrop-blur-sm border space-x-2`}
              title="Ver todas las cajas"
            >
              <FaDatabase className="text-sm" />
              <span className="hidden sm:inline text-xs font-medium">Ver Todas</span>
            </button>
          )}
          
          {/* Next Button */}
          <button
            onClick={handleNext}
            className={`${colorScheme.button} text-white p-3 rounded-xl transition-colors flex items-center justify-center backdrop-blur-sm border
            }`}
            title={isFilterBox ? "Página siguiente" : "Siguiente caja"}
          >
            <FaChevronRight className="text-sm" />
          </button>
          
          {/* Deselect Button (only for secondary box) */}
          {isSecondary && onDeselect && (
            <button
              onClick={handleDeselect}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition-colors backdrop-blur-sm border border-white/10"
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