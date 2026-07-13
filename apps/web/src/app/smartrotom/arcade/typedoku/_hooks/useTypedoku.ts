"use client"

import { useCallback, useEffect, useState } from "react"
import {
  GRID_SIZE,
  TYPES,
  generatePuzzle,
  generateSolvedGrid,
  getPossibilities,
  type Cell,
} from "../_utils/sudoku"

/** The board, its undo stacks and the keyboard shortcuts that drive them. */
export function useTypedoku() {
  const [grid, setGrid] = useState<Cell[][]>([])
  const [solvedGrid, setSolvedGrid] = useState<string[][]>([])
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [history, setHistory] = useState<Cell[][][]>([])
  const [futureStates, setFutureStates] = useState<Cell[][][]>([])
  const [isNotesMode, setIsNotesMode] = useState(false)

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

  useEffect(() => {
    newGame()
  }, [newGame])

  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell([row, col])
  }, [])

  const checkCompletion = useCallback(
    (currentGrid: Cell[][]) => {
      setIsComplete(
        currentGrid.every((row, rowIndex) =>
          row.every((cell, colIndex) => cell.value === solvedGrid[rowIndex][colIndex]),
        ),
      )
    },
    [solvedGrid],
  )

  const handleTypeSelect = useCallback(
    (type: string) => {
      if (!selectedCell) return
      const [row, col] = selectedCell
      if (grid[row][col].isGiven) return

      const newGrid: Cell[][] = JSON.parse(JSON.stringify(grid))
      if (isNotesMode) {
        if (newGrid[row][col].notes.includes(type)) {
          newGrid[row][col].notes = newGrid[row][col].notes.filter((note) => note !== type)
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
    },
    [selectedCell, grid, isNotesMode, history, checkCompletion],
  )

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
    if (!selectedCell) return
    const [row, col] = selectedCell
    if (grid[row][col].isGiven || grid[row][col].value === solvedGrid[row][col]) return

    const newGrid: Cell[][] = JSON.parse(JSON.stringify(grid))
    newGrid[row][col] = { value: solvedGrid[row][col], isGiven: true, notes: [] }
    setGrid(newGrid)
    setHistory([...history, newGrid])
    setFutureStates([])
    checkCompletion(newGrid)
  }, [selectedCell, grid, solvedGrid, history, checkCompletion])

  const handleNoteHint = useCallback(() => {
    if (!selectedCell) return
    const [row, col] = selectedCell
    if (grid[row][col].isGiven || grid[row][col].value !== "") return

    const newGrid: Cell[][] = JSON.parse(JSON.stringify(grid))
    newGrid[row][col] = { ...newGrid[row][col], notes: getPossibilities(row, col, newGrid) }
    setGrid(newGrid)
    setHistory([...history, newGrid])
    setFutureStates([])
  }, [selectedCell, grid, history])

  const toggleNotesMode = useCallback(() => {
    setIsNotesMode((prev) => !prev)
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedCell) return
      const [row, col] = selectedCell
      switch (e.key) {
        case "ArrowUp":
          setSelectedCell([Math.max(0, row - 1), col])
          break
        case "ArrowDown":
          setSelectedCell([Math.min(GRID_SIZE - 1, row + 1), col])
          break
        case "ArrowLeft":
          setSelectedCell([row, Math.max(0, col - 1)])
          break
        case "ArrowRight":
          setSelectedCell([row, Math.min(GRID_SIZE - 1, col + 1)])
          break
        case "n":
          newGame()
          break
        case "z":
          if (e.ctrlKey || e.metaKey) handleUndo()
          break
        case "y":
          if (e.ctrlKey || e.metaKey) handleRedo()
          break
        case "h":
          handleHint()
          break
        case "m":
          toggleNotesMode()
          break
        case "p":
          handleNoteHint()
          break
        default: {
          const type = TYPES.find((t) => t.toLowerCase().startsWith(e.key.toLowerCase()))
          if (type) handleTypeSelect(type)
          break
        }
      }
    },
    [
      selectedCell,
      newGame,
      handleUndo,
      handleRedo,
      handleHint,
      toggleNotesMode,
      handleNoteHint,
      handleTypeSelect,
    ],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return {
    canRedo: futureStates.length > 0,
    canUndo: history.length > 1,
    grid,
    handleCellClick,
    handleHint,
    handleNoteHint,
    handleRedo,
    handleTypeSelect,
    handleUndo,
    isComplete,
    isNotesMode,
    newGame,
    selectedCell,
    toggleNotesMode,
  }
}
