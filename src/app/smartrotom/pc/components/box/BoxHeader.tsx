import { FaArchive, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { PCBoxData } from '@/types/dto/pc-pokemon.dto'
import { motion } from 'framer-motion'

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
    <div className={`relative bg-gradient-to-r ${colorScheme.bg} p-4 border-b border-slate-500/30 flex-shrink-0`}>
      {/* Enhanced background pattern */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.accent} pointer-events-none`} />
      
      <div className="relative flex items-center justify-between">
        {/* Previous Button */}
        <motion.button
          onClick={handlePrevious}
          className={`${colorScheme.button} text-white p-3 rounded-xl transition-colors flex items-center justify-center backdrop-blur-sm border`}
          title="Caja anterior"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaChevronLeft className="text-sm" />
        </motion.button>

        {/* Box Info */}
        <div className="flex items-center space-x-3">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`w-10 h-10 bg-gradient-to-br ${colorScheme.iconBg} rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm`}
          >
            <FaArchive className={`${colorScheme.text} text-lg`} />
          </motion.div>
          <div>
            <h3 className="text-white font-bold text-xl">Caja {boxData.boxNumber + 1}</h3>
            <p className="text-slate-300 text-sm font-medium">
              {pokemonCount}/30 Pokémon
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Next Button */}
          <motion.button
            onClick={handleNext}
            className={`${colorScheme.button} text-white p-3 rounded-xl transition-colors flex items-center justify-center backdrop-blur-sm border`}
            title="Siguiente caja"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaChevronRight className="text-sm" />
          </motion.button>

          {/* Deselect Button (only for secondary box) */}
          {isSecondary && onDeselect && (
            <motion.button
              onClick={onDeselect}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition-colors backdrop-blur-sm border border-white/10"
              title="Cerrar caja secundaria"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ✕
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}