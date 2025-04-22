import { Award, AlertCircle, ChevronRight, LogOut } from "lucide-react";
import { motion } from "framer-motion";

interface MessagesProps {
  gameOver: boolean
  gameWon: boolean
  showLevelComplete: boolean
  onNextLevel: () => void
  onQuit: () => void
  lostCoins: number
}

export default function Messages({
  gameOver,
  gameWon,
  showLevelComplete,
  onNextLevel,
  onQuit,
  lostCoins
}: MessagesProps) {
  if (gameOver) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-3">
          <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
          <p className="text-xl font-bold text-red-400">¡Game Over!</p>
        </div>
        <p className="text-gray-300 mb-3">Has encontrado un Voltorb y perdido {lostCoins} monedas.</p>
        <p className="text-cyan-400 text-sm">Inicia una nueva partida para seguir jugando.</p>
      </motion.div>
    );
  }

  if (showLevelComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-3">
          <Award className="h-6 w-6 text-yellow-500 mr-2" />
          <p className="text-xl font-bold text-yellow-300">¡Nivel Completado!</p>
        </div>
        <p className="text-gray-300 mb-4">¡Encontraste todos los multiplicadores sin activar ningún Voltorb!</p>
        <div className="flex justify-center space-x-4 mt-4">
          <button
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-2 px-4 rounded-md border border-cyan-500/50 flex items-center"
            onClick={onNextLevel}
          >
            Siguiente nivel <ChevronRight className="h-4 w-4 ml-1" />
          </button>
          <button
            className="bg-indigo-700 hover:bg-indigo-600 text-white py-2 px-4 rounded-md border border-indigo-600/50 flex items-center"
            onClick={onQuit}
          >
            Guardar y salir <LogOut className="h-4 w-4 ml-1" />
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}