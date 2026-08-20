export const GRID_SIZE = 9
export const BOX_SIZE = 3
export const TYPES = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fairy",
  "Poison",
  "Ground",
]

export type Cell = {
  value: string
  isGiven: boolean
  notes: string[]
}

export const generateSolvedGrid = (): string[][] => {
  const grid: string[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(""))

  const shuffle = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
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

    if (grid[row][col] !== "") {
      return solve(row, col + 1)
    }

    const types = shuffle([...TYPES])
    for (const type of types) {
      if (isValid(row, col, type)) {
        grid[row][col] = type
        if (solve(row, col + 1)) {
          return true
        }
        grid[row][col] = ""
      }
    }

    return false
  }

  solve(0, 0)
  return grid
}

export const generatePuzzle = (solvedGrid: string[][]): Cell[][] => {
  const puzzle: Cell[][] = solvedGrid.map((row) =>
    row.map((cell) => ({ value: cell, isGiven: true, notes: [] })),
  )

  const cellsToRemove = 45 // Adjust this number to change difficulty
  for (let i = 0; i < cellsToRemove; i++) {
    let row, col
    do {
      row = Math.floor(Math.random() * GRID_SIZE)
      col = Math.floor(Math.random() * GRID_SIZE)
    } while (!puzzle[row][col].isGiven)
    puzzle[row][col] = { value: "", isGiven: false, notes: [] }
  }

  return puzzle
}

/** Every type still legal in a cell — its row, its column and its box agree. */
export const getPossibilities = (row: number, col: number, currentGrid: Cell[][]) => {
  const usedTypes = new Set<string>()

  for (let i = 0; i < GRID_SIZE; i++) {
    if (currentGrid[row][i].value) usedTypes.add(currentGrid[row][i].value)
  }

  for (let i = 0; i < GRID_SIZE; i++) {
    if (currentGrid[i][col].value) usedTypes.add(currentGrid[i][col].value)
  }

  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE
  for (let i = 0; i < BOX_SIZE; i++) {
    for (let j = 0; j < BOX_SIZE; j++) {
      if (currentGrid[boxRow + i][boxCol + j].value) {
        usedTypes.add(currentGrid[boxRow + i][boxCol + j].value)
      }
    }
  }

  return TYPES.filter((type) => !usedTypes.has(type))
}

// A neon per type. Full literal classes — the cell picks one by lookup, never by
// interpolation.
export const TYPE_SKIN: Record<string, string> = {
  Normal: "border-white/25 bg-white/[.14] text-ar-ink",
  Fire: "border-ar-magenta/60 bg-ar-magenta/25 text-ar-magenta-2",
  Water: "border-ar-cyan/55 bg-ar-cyan/20 text-ar-cyan",
  Electric: "border-ar-amber/60 bg-ar-amber/25 text-ar-amber",
  Grass: "border-ar-lime/55 bg-ar-lime/20 text-ar-lime",
  Ice: "border-ar-cyan-2/45 bg-ar-cyan-2/[.12] text-ar-cyan-2",
  Fairy: "border-ar-magenta-2/45 bg-ar-magenta-2/[.14] text-ar-magenta-2",
  Poison: "border-ar-violet/60 bg-ar-violet/25 text-ar-violet-2",
  Ground: "border-ar-amber/40 bg-ar-amber/[.12] text-ar-amber",
}
