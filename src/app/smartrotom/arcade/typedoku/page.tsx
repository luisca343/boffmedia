"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import {  RefreshCw, Undo, Redo, Lightbulb, PencilLine, HelpCircle } from 'lucide-react'
import StarsBackground from '../_components/StarsBackground'
import {RainbowText} from '../_components/RainbowText'

const GRID_SIZE = 9
const BOX_SIZE = 3
const TYPES = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fairy', 'Poison', 'Ground']

type Cell = {
  value: string
  isGiven: boolean
  notes: string[]
}

const typeColors: { [key: string]: string } = {
  Normal: 'bg-main-400',
  Fire: 'bg-red-500',
  Water: 'bg-blue-500',
  Electric: 'bg-yellow-400',
  Grass: 'bg-green-500',
  Ice: 'bg-cyan-400',
  Fairy: 'bg-pink-400',
  Poison: 'bg-purple-500',
  Ground: 'bg-amber-600',
}


const generateSolvedGrid = (): string[][] => {
  const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''))
  
  const shuffle = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  const isValid = (row: number, col: number, value: string) => {
    for (let i = 0; i < GRID_SIZE; i++) {
      if (grid[row][i] === value || grid[i][col] === value) {
        return false
      }
    }

    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE
    for (let i = 0; i < BOX_SIZE; i++) {
      for (let j = 0; j < BOX_SIZE; j++) {
        if (grid[boxRow + i][boxCol + j] === value) {
          return false
        }
      }
    }

    return true
  }

  const solve = (row: number, col: number): boolean => {
    if (col === GRID_SIZE) {
      col = 0
      row++
      if (row === GRID_SIZE) {
        return true
      }
    }

    if (grid[row][col] !== '') {
      return solve(row, col + 1)
    }

    const types = shuffle([...TYPES])
    for (const type of types) {
      if (isValid(row, col, type)) {
        grid[row][col] = type
        if (solve(row, col + 1)) {
          return true
        }
        grid[row][col] = ''
      }
    }

    return false
  }

  solve(0, 0)
  return grid
}

const generatePuzzle = (solvedGrid: string[][]): Cell[][] => {
  const puzzle: Cell[][] = solvedGrid.map(row => 
    row.map(cell => ({ value: cell, isGiven: true, notes: [] }))
  )

  const cellsToRemove = 45 // Adjust this number to change difficulty
  for (let i = 0; i < cellsToRemove; i++) {
    let row, col
    do {
      row = Math.floor(Math.random() * GRID_SIZE)
      col = Math.floor(Math.random() * GRID_SIZE)
    } while (!puzzle[row][col].isGiven)
    puzzle[row][col] = { value: '', isGiven: false, notes: [] }
  }

  return puzzle
}

export default function TypeDoku() {
  const [grid, setGrid] = useState<Cell[][]>([])
  const [solvedGrid, setSolvedGrid] = useState<string[][]>([])
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [history, setHistory] = useState<Cell[][][]>([])
  const [futureStates, setFutureStates] = useState<Cell[][][]>([])
  const [isNotesMode, setIsNotesMode] = useState(false)

  useEffect(() => {
    newGame()
  }, [])

  const newGame = useCallback(() => {
    const solved = generateSolvedGrid()
    const puzzle = generatePuzzle(solved)
    setSolvedGrid(solved)
    setGrid(puzzle)
    setIsComplete(false)
    setSelectedCell([0, 0])
    setHistory([puzzle])
    setFutureStates([])
    setIsNotesMode(false)
  }, [])

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell([row, col])
  }, [])

  const handleTypeSelect = useCallback((type: string) => {
    if (selectedCell) {
      const [row, col] = selectedCell
      if (!grid[row][col].isGiven) {
        const newGrid = JSON.parse(JSON.stringify(grid))
        if (isNotesMode) {
          if (newGrid[row][col].notes.includes(type)) {
            newGrid[row][col].notes = newGrid[row][col].notes.filter((note: string) => note !== type)
          } else {
            newGrid[row][col].notes.push(type)
          }
        } else {
          newGrid[row][col] = { ...newGrid[row][col], value: type, notes: [] }
        }
        setGrid(newGrid)
        setHistory([...history, newGrid])
        setFutureStates([])
        checkCompletion(newGrid)
      }
    }
  }, [selectedCell, grid, isNotesMode, history])

  const checkCompletion = useCallback((currentGrid: Cell[][]) => {
    const isComplete = currentGrid.every((row, rowIndex) =>
      row.every((cell, colIndex) => cell.value === solvedGrid[rowIndex][colIndex])
    )
    setIsComplete(isComplete)
  }, [solvedGrid])

  const handleUndo = useCallback(() => {
    if (history.length > 1) {
      const newHistory = [...history]
      const lastState = newHistory.pop()!
      setHistory(newHistory)
      setGrid(newHistory[newHistory.length - 1])
      setFutureStates([lastState, ...futureStates])
    }
  }, [history, futureStates])

  const handleRedo = useCallback(() => {
    if (futureStates.length > 0) {
      const newFutureStates = [...futureStates]
      const nextState = newFutureStates.shift()!
      setFutureStates(newFutureStates)
      setGrid(nextState)
      setHistory([...history, nextState])
    }
  }, [futureStates, history])

  const handleHint = useCallback(() => {
    if (selectedCell) {
      const [row, col] = selectedCell
      if (!grid[row][col].isGiven && grid[row][col].value !== solvedGrid[row][col]) {
        const newGrid = JSON.parse(JSON.stringify(grid))
        newGrid[row][col] = { value: solvedGrid[row][col], isGiven: true, notes: [] }
        setGrid(newGrid)
        setHistory([...history, newGrid])
        setFutureStates([])
        checkCompletion(newGrid)
      }
    }
  }, [selectedCell, grid, solvedGrid, history, checkCompletion])

  const handleNoteHint = useCallback(() => {
    if (selectedCell) {
      const [row, col] = selectedCell
      if (!grid[row][col].isGiven && grid[row][col].value === '') {
        const newGrid = JSON.parse(JSON.stringify(grid))
        const possibilities = getPossibilities(row, col, newGrid)
        newGrid[row][col] = { ...newGrid[row][col], notes: possibilities }
        setGrid(newGrid)
        setHistory([...history, newGrid])
        setFutureStates([])
      }
    }
  }, [selectedCell, grid, history])

  const getPossibilities = (row: number, col: number, currentGrid: Cell[][]) => {
    const usedTypes = new Set<string>()

    // Check row
    for (let i = 0; i < GRID_SIZE; i++) {
      if (currentGrid[row][i].value) usedTypes.add(currentGrid[row][i].value)
    }

    // Check column
    for (let i = 0; i < GRID_SIZE; i++) {
      if (currentGrid[i][col].value) usedTypes.add(currentGrid[i][col].value)
    }

    // Check box
    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE
    for (let i = 0; i < BOX_SIZE; i++) {
      for (let j = 0; j < BOX_SIZE; j++) {
        if (currentGrid[boxRow + i][boxCol + j].value) {
          usedTypes.add(currentGrid[boxRow + i][boxCol + j].value)
        }
      }
    }

    return TYPES.filter(type => !usedTypes.has(type))
  }

  const toggleNotesMode = useCallback(() => {
    setIsNotesMode(prev => !prev)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectedCell) {
      const [row, col] = selectedCell
      switch (e.key) {
        case 'ArrowUp':
          setSelectedCell([Math.max(0, row - 1), col])
          break
        case 'ArrowDown':
          setSelectedCell([Math.min(GRID_SIZE - 1, row + 1), col])
          break
        case 'ArrowLeft':
          setSelectedCell([row, Math.max(0, col - 1)])
          break
        case 'ArrowRight':
          setSelectedCell([row, Math.min(GRID_SIZE - 1, col + 1)])
          break
        case 'n':
          newGame()
          break
        case 'z':
          if (e.ctrlKey || e.metaKey) handleUndo()
          break
        case 'y':
          if (e.ctrlKey || e.metaKey) handleRedo()
          break
        case 'h':
          handleHint()
          break
        case 'm':
          toggleNotesMode()
          break
        case 'p':
          handleNoteHint()
          break
        default:
          if (TYPES.some(type => type.toLowerCase().startsWith(e.key.toLowerCase()))) {
            const type = TYPES.find(t => t.toLowerCase().startsWith(e.key.toLowerCase()))
            if (type) handleTypeSelect(type)
          }
          break
      }
    }
  }, [selectedCell, newGame, handleUndo, handleRedo, handleHint, toggleNotesMode, handleNoteHint, handleTypeSelect])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div className="min-h-full w-full bg-gradient-to-b from-indigo-900 to-purple-900 text-white font-mono flex flex-col relative overflow-hidden">
      <StarsBackground />
      <main className="flex-grow p-6 container mx-auto max-w-4xl relative z-10">
      <RainbowText text="PokéDoku: Apasionante Sudoku Temático Arcade" />
        <div className="grid grid-cols-3 gap-2 mb-8 bg-indigo-800 bg-opacity-70 p-4 rounded-lg shadow-xl border-2 border-yellow-500">
          {[0, 1, 2].map((boxRow) => (
            <React.Fragment key={boxRow}>
              {[0, 1, 2].map((boxCol) => (
                <div key={`${boxRow}-${boxCol}`} className="grid grid-cols-3 gap-1 p-1 bg-indigo-700 rounded-md">
                  {[0, 1, 2].map((cellRow) => (
                    <React.Fragment key={cellRow}>
                      {[0, 1, 2].map((cellCol) => {
                        const row = boxRow * 3 + cellRow
                        const col = boxCol * 3 + cellCol
                        const cell = grid[row]?.[col]
                        return (
                          <button
                            key={`${row}-${col}`}
                            className={`w-full aspect-square flex items-center justify-center text-xs sm:text-sm font-bold rounded-md border-2 transition-all duration-200 ${
                              cell?.isGiven ? 'border-main-500 cursor-not-allowed' : 'border-yellow-300 hover:border-yellow-500'
                            } ${
                              selectedCell && selectedCell[0] === row && selectedCell[1] === col
                                ?'ring-2 ring-pink-500'
                                : ''
                            } ${cell?.value ? typeColors[cell.value] : 'bg-main-700'}`}
                            onClick={() => handleCellClick(row, col)}
                            disabled={cell?.isGiven}
                          >
                            {cell?.value ? (
                              cell.value
                            ) : (
                              <div className="grid grid-cols-3 gap-0.5 p-0.5 w-full h-full">
                                {TYPES.map((type, index) => (
                                  <div
                                    key={index}
                                    className={`flex items-center justify-center ${
                                      cell?.notes.includes(type) ? `${typeColors[type]} bg-opacity-50` : ''
                                    }`}
                                  >
                                    <span className="text-[0.4rem] font-bold">
                                      {cell?.notes.includes(type) ? type[0] : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {TYPES.map((type) => (
            <Button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`${typeColors[type]} text-black font-bold py-2 px-4 rounded-full shadow-md hover:opacity-80 transition-opacity duration-200`}
            >
              {type}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center space-x-4 mb-8">
          <Button
            onClick={newGame}
            className="bg-yellow-400 text-purple-900 hover:bg-yellow-300 text-lg px-6 py-3 rounded-lg shadow-md border-2 border-yellow-500 transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center"
          >
            <RefreshCw className="mr-2" /> Nuevo Juego (N)
          </Button>
          <Button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="bg-blue-500 text-white hover:bg-blue-400 text-lg px-6 py-3 rounded-lg shadow-md border-2 border-blue-600 transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center disabled:opacity-50"
          >
            <Undo className="mr-2" /> Deshacer (Ctrl+Z)
          </Button>
          <Button
            onClick={handleRedo}
            disabled={futureStates.length === 0}
            className="bg-green-500 text-white hover:bg-green-400 text-lg px-6 py-3 rounded-lg shadow-md border-2 border-green-600 transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center disabled:opacity-50"
          >
            <Redo className="mr-2" /> Rehacer (Ctrl+Y)
          </Button>
          <Button
            onClick={handleHint}
            className="bg-orange-500 text-white hover:bg-orange-400 text-lg px-6 py-3 rounded-lg shadow-md border-2 border-orange-600 transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center"
          >
            <Lightbulb className="mr-2" /> Pista (H)
          </Button>
          <Button
            onClick={handleNoteHint}
            className="bg-cyan-500 text-white hover:bg-cyan-400 text-lg px-6 py-3 rounded-lg shadow-md border-2 border-cyan-600 transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center"
          >
            <HelpCircle className="mr-2" /> Pista de Notas (P)
          </Button>
          <Button
            onClick={toggleNotesMode}
            className={`text-white text-lg px-6 py-3 rounded-lg shadow-md border-2 transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center ${
              isNotesMode ? 'bg-pink-500 hover:bg-pink-400 border-pink-600' : 'bg-purple-500 hover:bg-purple-400 border-purple-600'
            }`}
          >
            <PencilLine className="mr-2" /> {isNotesMode ? 'Modo Notas: ON (M)' : 'Modo Notas: OFF (M)'}
          </Button>
        </div>

        {isComplete && (
          <div className="mt-8 p-6 bg-green-500 bg-opacity-90 rounded-lg shadow-xl border-2 border-yellow-500 animate-pulse">
            <p className="text-center font-bold text-white text-2xl">
              ¡Felicidades! Has completado el TypeDoku
            </p>
          </div>
        )}
      </main>
    </div>
  )
}