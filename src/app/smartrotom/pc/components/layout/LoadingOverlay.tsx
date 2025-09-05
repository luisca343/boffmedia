import { FaDesktop, FaSpinner } from 'react-icons/fa'
import { motion } from 'framer-motion'

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-md">
      <motion.div 
        className="relative bg-slate-900/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-slate-500/30 text-center overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 via-transparent to-slate-800/20 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="relative mb-6">
            {/* Animated loading rings */}
            <div className="w-24 h-24 mx-auto relative">
              <motion.div 
                className="absolute inset-0 border-4 border-slate-500/30 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-2 border-4 border-blue-400/50 rounded-full border-t-blue-400"
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-4 border-2 border-amber-400/40 rounded-full border-r-amber-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Desktop icon in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-12 h-12 bg-gradient-to-br from-slate-700/80 to-slate-800/80 rounded-xl border border-slate-500/50 flex items-center justify-center backdrop-blur-sm"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <FaDesktop className="text-slate-300 text-xl" />
                </motion.div>
              </div>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <h3 className="text-xl font-bold text-white mb-2">Cargando PC...</h3>
            <p className="text-slate-300 mb-4">Accediendo al sistema de almacenamiento</p>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FaSpinner className="text-blue-400" />
              </motion.div>
              <span className="text-slate-400 text-sm font-medium">Por favor espera un momento</span>
            </div>
            
            {/* Animated dots */}
            <div className="flex justify-center space-x-1 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}