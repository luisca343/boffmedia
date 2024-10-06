import { Coins } from 'lucide-react'
import { motion } from 'framer-motion'

interface InfoPanelProps {
  roundScore: number
  totalCoins: number
  level: number
  gameOver: boolean
  gameWon: boolean
  showLevelComplete: boolean
  onNextLevel: () => void
  onQuit: () => void
  lostCoins: number
}

function InfoPanel({
  roundScore,
  totalCoins,
  level,
  gameOver,
  gameWon,
  showLevelComplete,
  onNextLevel,
  onQuit,
  lostCoins
}: InfoPanelProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-4">
        <Coins className="w-6 h-6 text-yellow-500" />
        <motion.span
          key={roundScore}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.3 }}
          className="text-xl text-white font-bold"
        >
          Round Score: {roundScore}
        </motion.span>
        <span className="text-xl text-white font-bold">Total Coins: {totalCoins}</span>
      </div>
      <div className="text-white font-bold">Level: {level}</div>
      
      {gameOver && (
        <div className="text-red-500 font-bold text-xl text-center">
          <p>¡Juego terminado!</p>
          <p>Has perdido {lostCoins} monedas en total.</p>
        </div>
      )}

      {showLevelComplete && (
        <div className="bg-green-500 text-white p-4 rounded-lg text-center">
          <p className="font-bold text-xl mb-2">¡Nivel completado!</p>
          <p className="mb-4">¿Quieres pasar al siguiente nivel o quedarte con tus monedas?</p>
          <p className="mb-4">Monedas actuales: {totalCoins}</p>
          <div className="flex justify-center space-x-4">
            <button
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded"
              onClick={onNextLevel}
            >
              Siguiente nivel
            </button>
            <button
              className="bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-2 px-4 rounded"
              onClick={onQuit}
            >
              Quedarse con las monedas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InfoPanel