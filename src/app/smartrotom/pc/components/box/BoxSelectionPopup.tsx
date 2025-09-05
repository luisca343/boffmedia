import { FaTimes, FaArchive } from 'react-icons/fa'
import { PCBoxData } from '@/types/dto/pc-pokemon.dto'
import { motion, AnimatePresence } from 'framer-motion'

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
      color: 'from-slate-600 to-slate-700', 
      text: 'Vacía',
      bgColor: 'bg-slate-600/20',
      borderColor: 'border-slate-500/40'
    }
    if (count < 10) return { 
      color: 'from-green-600 to-green-700', 
      text: 'Poco llena',
      bgColor: 'bg-green-600/20',
      borderColor: 'border-green-500/40'
    }
    if (count < 20) return { 
      color: 'from-amber-600 to-amber-700', 
      text: 'Medio llena',
      bgColor: 'bg-amber-600/20',
      borderColor: 'border-amber-500/40'
    }
    if (count < 30) return { 
      color: 'from-orange-600 to-orange-700', 
      text: 'Casi llena',
      bgColor: 'bg-orange-600/20',
      borderColor: 'border-orange-500/40'
    }
    return { 
      color: 'from-red-600 to-red-700', 
      text: 'Llena',
      bgColor: 'bg-red-600/20',
      borderColor: 'border-red-500/40'
    }
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 }
    }
  }

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const boxVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-md p-4"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div 
        className="bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden"
        variants={modalVariants}
      >
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-4 border-b border-slate-500/30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <motion.div 
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <FaArchive className="text-blue-300 text-xl" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">Seleccionar Caja</h3>
                <p className="text-slate-300 text-sm font-medium">Elige una caja para navegar</p>
              </div>
            </div>
            <motion.button 
              onClick={onClose}
              className="text-white hover:bg-white/10 p-3 rounded-xl transition-colors backdrop-blur-sm border border-slate-500/30"
              aria-label="Cerrar selector"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaTimes />
            </motion.button>
          </div>
        </div>

        {/* Box Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            variants={gridVariants}
            initial="hidden"
            animate="visible"
          >
            {boxes.map((box, index) => {
              const pokemonCount = getPokemonCount(box)
              const status = getBoxStatus(pokemonCount)
              const isCurrentBox = index === currentBox

              return (
                <motion.button
                  key={index}
                  onClick={() => onBoxSelect(index)}
                  className={`relative bg-gradient-to-br ${status.color} backdrop-blur-sm p-4 rounded-2xl border-2 transition-all duration-200 shadow-lg overflow-hidden ${
                    isCurrentBox
                      ? 'border-amber-400/60 shadow-amber-400/30 shadow-lg scale-105'
                      : `${status.borderColor} hover:border-slate-400/60 hover:shadow-xl`
                  }`}
                  variants={boxVariants}
                  whileHover={{ scale: isCurrentBox ? 1.05 : 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-black/5 pointer-events-none" />
                  
                  {/* Current box indicator */}
                  {isCurrentBox && (
                    <motion.div 
                      className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    >
                      ★
                    </motion.div>
                  )}

                  {/* Box icon */}
                  <div className="flex justify-center mb-3 relative z-10">
                    <motion.div
                      className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 flex items-center justify-center"
                      whileHover={{ rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FaArchive className="text-white text-lg" />
                    </motion.div>
                  </div>

                  {/* Box info */}
                  <div className="relative z-10">
                    <div className="text-white font-bold text-lg mb-1">
                      Caja {index + 1}
                    </div>
                    
                    <div className="text-white/90 text-sm mb-3 font-medium">
                      {pokemonCount}/30 Pokémon
                    </div>

                    {/* Status indicator */}
                    <div className="bg-black/30 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20 mb-3">
                      {status.text}
                    </div>

                    {/* Progress bar */}
                    <div className="bg-slate-700/50 backdrop-blur-sm rounded-full h-2 border border-slate-600/30">
                      <motion.div 
                        className="bg-white/80 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(pokemonCount / 30) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.02 }}
                      />
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        </div>

        {/* Enhanced Footer */}
        <motion.div 
          className="relative bg-slate-800/50 backdrop-blur-sm p-4 border-t border-slate-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
          
          <div className="relative flex items-center justify-between text-sm">
            <div className="text-slate-300">
              Caja actual: <span className="text-white font-bold">Caja {currentBox + 1}</span>
            </div>
            <div className="flex items-center space-x-4 text-slate-300">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-slate-600 rounded-full border border-slate-500/30" />
                <span>Vacía</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded-full border border-green-500/30" />
                <span>Pocos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-600 rounded-full border border-amber-500/30" />
                <span>Media</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full border border-red-500/30" />
                <span>Llena</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}