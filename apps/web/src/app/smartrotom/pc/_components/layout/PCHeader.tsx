import { FaDesktop, FaSyncAlt, FaDatabase } from 'react-icons/fa'
import { FaExchangeAlt } from 'react-icons/fa'
import { motion } from 'framer-motion'

interface PCHeaderProps {
  currentBox: number;
  totalBoxes: number;
  pokemonCount: number;
  teamCount: number;
  isDualBoxMode?: boolean;
  onRefresh: () => void;
  onToggleDualBoxMode?: () => void;
}

export default function PCHeader({ 
  currentBox, 
  totalBoxes, 
  pokemonCount,
  teamCount, 
  isDualBoxMode = false,
  onRefresh,
  onToggleDualBoxMode
}: PCHeaderProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  }

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.2 }
    }
  }

  return (
    <div className="hidden 2xl:block relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-md border-b border-slate-500/30 shadow-2xl overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <motion.div 
        className="relative z-10 px-6 py-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex justify-between items-center flex-wrap gap-4">
          <motion.div 
            className="flex items-center space-x-4"
            variants={buttonVariants}
          >
            <div className="flex items-center bg-slate-800/50 backdrop-blur-sm px-4 py-3 rounded-2xl border border-slate-500/40">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm mr-3"
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <FaDesktop className="text-blue-300 text-xl" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Sistema de Almacenamiento PC
                </h1>
                <p className="text-slate-300 text-sm font-medium">
                  Administra tus Pokémon capturados
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-3"
            variants={containerVariants}
          >
            {/* Stats cards - uncommented and styled */}
            <motion.div 
              className="flex items-center bg-slate-800/40 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-500/40"
              variants={buttonVariants}
            >
              <FaDatabase className="text-slate-300 mr-2" />
              <div className="text-center">
                <div className="text-white font-bold text-sm">{pokemonCount}</div>
                <div className="text-slate-300 text-xs">Pokémon</div>
              </div>
            </motion.div>
            
            {/* Action buttons */}
            {onToggleDualBoxMode && (
              <motion.button
                onClick={onToggleDualBoxMode}
                className={`px-4 py-2 rounded-xl flex items-center space-x-2 border transition-all duration-200 shadow-lg backdrop-blur-sm ${
                  isDualBoxMode 
                    ? 'bg-green-600/80 hover:bg-green-600 text-white border-green-400/30' 
                    : 'bg-blue-600/80 hover:bg-blue-600 text-white border-blue-400/30'
                }`}
                title={isDualBoxMode ? "Cambiar a modo caja única" : "Activar modo dual caja"}
                variants={buttonVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaExchangeAlt />
                <span className="hidden md:inline font-medium">
                  {isDualBoxMode ? "Una Caja" : "Dos Cajas"}
                </span>
              </motion.button>
            )}
            
            <motion.button
              onClick={onRefresh}
              className="bg-green-600/80 hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 border border-green-400/30 transition-all duration-200 shadow-lg backdrop-blur-sm"
              title="Actualizar datos del PC"
              variants={buttonVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div style={{ display: 'inline-block' }} >
                <FaSyncAlt className="text-sm" />
              </div>
              <span className="hidden md:inline font-medium">Actualizar</span>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}