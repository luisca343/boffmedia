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
        <div className="text-center text-white">
          <p className="text-xl font-bold mb-2">¡Game Over!</p>
          <p>Has perdido {lostCoins} monedas.</p>
        </div>
      )
    }
  
    if (showLevelComplete) {
      return (
        <div className="text-center text-white">
          <p className="text-xl font-bold mb-2">¡Nivel completado!</p>
          <div className="flex justify-center space-x-4 mt-4">
            <button
              className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded"
              onClick={onNextLevel}
            >
              Siguiente nivel
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded"
              onClick={onQuit}
            >
              Guardar y salir
            </button>
          </div>
        </div>
      )
    }
  
    return null
  }