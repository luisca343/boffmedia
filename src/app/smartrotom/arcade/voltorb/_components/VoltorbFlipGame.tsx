"use client"

import { useState, useEffect } from 'react'
import { Coins, RefreshCw, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import GameGrid from './GameGrid'
import InfoPanel from './InfoPanel'
import MemoPanel from './MemoPanel'
import ScorePopup from './ScorePopup'
import { Cell, RowColInfo } from './types'
import { LEVEL_CONFIGS } from './config'

const GRID_SIZE = 5

export default function VoltorbFlipGame() {
  const router = useRouter()
  const [grid, setGrid] = useState<Cell[][]>([])
  const [rowInfo, setRowInfo] = useState<RowColInfo[]>([])
  const [colInfo, setColInfo] = useState<RowColInfo[]>([])
  const [level, setLevel] = useState(1)
  const [roundScore, setRoundScore] = useState(0)
  const [totalCoins, setTotalCoins] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [memoMode, setMemoMode] = useState(false)
  const [selectedMark, setSelectedMark] = useState(0)
  const [consecutiveLevelWins, setConsecutiveLevelWins] = useState(0)
  const [flippedMultipliers, setFlippedMultipliers] = useState(0)
  const [lastScoreIncrease, setLastScoreIncrease] = useState(0)
  const [showConfirmQuit, setShowConfirmQuit] = useState(false)
  const [showConfirmNew, setShowConfirmNew] = useState(false)
  const [showLevelComplete, setShowLevelComplete] = useState(false)
  const [showCoinLossAnimation, setShowCoinLossAnimation] = useState(false)
  const [lostCoins, setLostCoins] = useState(0)

  useEffect(() => {
    initializeGame()
  }, [level])

  function initializeGame() {
    const levelConfigs = LEVEL_CONFIGS[level - 1]
    const config = levelConfigs[Math.floor(Math.random() * levelConfigs.length)]
    const newGrid: Cell[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        value: 1,
        revealed: false,
        marks: [],
      }))
    )

    let voltorbsPlaced = 0
    let x2sPlaced = 0
    let x3sPlaced = 0

    while (voltorbsPlaced < config.voltorbs || x2sPlaced < config.x2s || x3sPlaced < config.x3s) {
      const row = Math.floor(Math.random() * GRID_SIZE)
      const col = Math.floor(Math.random() * GRID_SIZE)
      if (newGrid[row][col].value === 1) {
        if (voltorbsPlaced < config.voltorbs) {
          newGrid[row][col].value = 0
          voltorbsPlaced++
        } else if (x2sPlaced < config.x2s) {
          newGrid[row][col].value = 2
          x2sPlaced++
        } else if (x3sPlaced < config.x3s) {
          newGrid[row][col].value = 3
          x3sPlaced++
        }
      }
    }

    setGrid(newGrid)
    setRoundScore(0)
    setGameOver(false)
    setGameWon(false)
    setFlippedMultipliers(0)
    setShowLevelComplete(false)
    setShowCoinLossAnimation(false)
    setLostCoins(0)
    setConsecutiveLevelWins(0)
    updateRowColInfo(newGrid)
  }

  function updateRowColInfo(grid: Cell[][]) {
    const newRowInfo: RowColInfo[] = []
    const newColInfo: RowColInfo[] = []

    for (let i = 0; i < GRID_SIZE; i++) {
      let rowCoins = 0
      let rowVoltorbs = 0
      let colCoins = 0
      let colVoltorbs = 0

      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j].value === 0) rowVoltorbs++
        else rowCoins += grid[i][j].value

        if (grid[j][i].value === 0) colVoltorbs++
        else colCoins += grid[j][i].value
      }

      newRowInfo.push({ coins: rowCoins, voltorbs: rowVoltorbs })
      newColInfo.push({ coins: colCoins, voltorbs: colVoltorbs })
    }

    setRowInfo(newRowInfo)
    setColInfo(newColInfo)
  }

  function handleCellClick(row: number, col: number) {
    if (gameOver || gameWon) return

    const newGrid = [...grid]
    const cell = newGrid[row][col]

    if (memoMode) {
      if (!cell.marks.includes(selectedMark)) {
        cell.marks.push(selectedMark)
      } else {
        cell.marks = cell.marks.filter(mark => mark !== selectedMark)
      }
      setGrid(newGrid)
      return
    }

    if (cell.revealed) return

    cell.revealed = true
    setGrid(newGrid)

    if (cell.value === 0) {
      revealAllCells(newGrid)
      setGameOver(true)
      setConsecutiveLevelWins(0)
      setLostCoins(roundScore + totalCoins)
      setShowCoinLossAnimation(true)
      setRoundScore(0)
      setTotalCoins(0)
    } else {
      const newRoundScore = roundScore === 0 ? cell.value : roundScore * cell.value
      const scoreIncrease = newRoundScore - roundScore
      setLastScoreIncrease(scoreIncrease)
      setRoundScore(newRoundScore)
      setTotalCoins(prev => prev + scoreIncrease)
      setFlippedMultipliers(prev => prev + 1)
      checkWinCondition(newGrid)
    }
  }

  function revealAllCells(grid: Cell[][]) {
    const revealedGrid = grid.map(row =>
      row.map(cell => ({ ...cell, revealed: true }))
    )
    setGrid(revealedGrid)
  }

  function checkWinCondition(grid: Cell[][]) {
    const allMultipliersRevealed = grid.every(row =>
      row.every(cell => cell.revealed || cell.value === 0 || cell.value === 1)
    )

    if (allMultipliersRevealed) {
      revealAllCells(grid)
      setGameWon(true)
      setShowLevelComplete(true)
      setConsecutiveLevelWins(prev => prev + 1)
    }
  }

  function handleQuit() {
    if (gameOver) {
      router.push('/arcade')
    } else {
      setShowConfirmQuit(true)
    }
  }

  function handleConfirmQuit() {
    alert(`Has obtenido ${totalCoins} monedas en total.`)
    router.push('/arcade')
  }

  function handleCancelQuit() {
    setShowConfirmQuit(false)
  }

  function handleNewGame() {
    if (gameOver) {
      resetGame()
    } else {
      setShowConfirmNew(true)
    }
  }

  function handleConfirmNewGame() {
    alert(`Has obtenido ${totalCoins} monedas en total.`)
    resetGame()
  }

  function handleCancelNewGame() {
    setShowConfirmNew(false)
  }

  function resetGame() {
    setTotalCoins(0)
    setLevel(1)
    setShowConfirmNew(false)
    setConsecutiveLevelWins(0)
    initializeGame()
  }

  function handleNextLevel() {
    if (consecutiveLevelWins === 4 && flippedMultipliers >= 8) {
      setLevel(8)
    } else if (level < 7) {
      setLevel(prev => prev + 1)
    }
    setConsecutiveLevelWins(0)
    initializeGame()
  }

  function handleToggleMemoMode() {
    setMemoMode(!memoMode)
  }

  function handleKeepCoins() {
    setShowConfirmQuit(true)
    setShowLevelComplete(false)
  }

  return (
    <div className="bg-gray-800 bg-opacity-80 border-4 border-yellow-500 rounded-lg p-6 flex flex-col items-center space-y-4 z-10">
      <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-4">
        <GameGrid
          grid={grid}
          rowInfo={rowInfo}
          colInfo={colInfo}
          onCellClick={handleCellClick}
        />
        
        <MemoPanel
          memoMode={memoMode}
          selectedMark={selectedMark}
          onToggleMemoMode={handleToggleMemoMode}
          onSelectMark={setSelectedMark}
        />
      </div>
      
      <InfoPanel
        roundScore={roundScore}
        totalCoins={totalCoins}
        level={level}
        gameOver={gameOver}
        gameWon={gameWon}
        showLevelComplete={showLevelComplete}
        onNextLevel={handleNextLevel}
        onQuit={handleKeepCoins}
        lostCoins={lostCoins}
      />
      
      <AnimatePresence>
        {showCoinLossAnimation && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: 50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-500 text-4xl font-bold flex items-center justify-center"
          >
            <Coins className="w-16 h-16" />
            <span className="ml-2">-{lostCoins}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {showConfirmQuit && (
        <div className="bg-red-500 text-white p-4 rounded-lg text-center">
          <p className="font-bold text-xl mb-2">¿Estás seguro que quieres salir?</p>
          <p className="mb-4">Te llevarás {totalCoins} monedas en total.</p>
          <div className="flex justify-center space-x-4">
            <button
              className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded"
              onClick={handleConfirmQuit}
            >
              Sí, salir
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded"
              onClick={handleCancelQuit}
            >
              No, seguir jugando
            </button>
          </div>
        </div>
      )}

      {showConfirmNew && (
        <div className="bg-yellow-500 text-white p-4 rounded-lg text-center">
          <p className="font-bold text-xl mb-2">¿Estás seguro que quieres empezar un nuevo juego?</p>
          <p className="mb-4">Perderás tu progreso actual y volverás al nivel 1.</p>
          <div className="flex justify-center space-x-4">
            <button
              className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded"
              onClick={handleConfirmNewGame}
            >
              Sí, nuevo juego
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded"
              onClick={handleCancelNewGame}
            >
              No, seguir jugando
            </button>
          </div>
        </div>
      )}
      
      <div className="flex space-x-2 w-full max-w-md">
        <button
          className="bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-4 rounded flex items-center justify-center space-x-2 flex-1"
          onClick={handleNewGame}
        >
          <RefreshCw className="w-5 h-5" />
          <span>Nuevo</span>
        </button>
        
        <button
          className="bg-red-500 hover:bg-red-400 text-white font-bold py-3 px-4 rounded flex items-center justify-center space-x-2 flex-1"
          onClick={handleQuit}
        >
          <X className="w-5 h-5" />
          <span>Salir</span>
        </button>
      </div>

      <ScorePopup scoreIncrease={lastScoreIncrease} />
    </div>
  )
}