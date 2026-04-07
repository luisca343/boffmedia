type Room = "start" | "room" | "boss" | "wall"
type Maze = Room[][]
type Position = [number, number]

export function generateMaze(size: number, depth: number): Maze {
  // Ensure the maze size is at least 5x5 to accommodate 5 dead ends
  size = Math.max(5, size)

  // Calculate the number of rooms based on depth
  const maxRooms = Math.floor(3.33 * depth + 5 + Math.random()) // 5 or 6 added randomly

  let maze: Maze
  let deadEnds: Position[]

  // Keep generating mazes until we have at least 5 dead ends
  do {
    maze = initializeMaze(size)
    deadEnds = generateLayout(maze, maxRooms)
  } while (deadEnds.length < 5)

  // Place the boss room
  placeBossRoom(maze, deadEnds)

  return maze
}

function initializeMaze(size: number): Maze {
  // Initialize the maze with walls
  const maze: Maze = Array(size)
    .fill(null)
    .map(() => Array(size).fill("wall"))

  // Set the starting room near the center
  const startX = Math.floor(size / 2)
  const startY = Math.floor(size / 2)
  maze[startY][startX] = "start"

  return maze
}

function generateLayout(maze: Maze, maxRooms: number): Position[] {
  const size = maze.length
  const startX = Math.floor(size / 2)
  const startY = Math.floor(size / 2)
  const stack: Position[] = [[startX, startY]]
  const visited: Set<string> = new Set([`${startX},${startY}`])
  let roomCount = 1
  const deadEnds: Position[] = []

  while (stack.length > 0 && roomCount < maxRooms) {
    const [x, y] = stack[stack.length - 1]
    const neighbors = getUnvisitedNeighbors(maze, x, y, visited)

    if (neighbors.length > 0) {
      const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)]
      visited.add(`${nx},${ny}`)
      maze[ny][nx] = "room"
      stack.push([nx, ny])
      roomCount++
    } else {
      const current = stack.pop()!
      if (countAdjacentRooms(maze, current[0], current[1]) === 1) {
        deadEnds.push(current)
      }
    }
  }

  return deadEnds
}

function getUnvisitedNeighbors(maze: Maze, x: number, y: number, visited: Set<string>): Position[] {
  const neighbors: Position[] = []
  const directions: Position[] = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ]

  for (const [dx, dy] of directions) {
    const nx = x + dx
    const ny = y + dy
    if (nx >= 0 && nx < maze.length && ny >= 0 && ny < maze.length && !visited.has(`${nx},${ny}`)) {
      neighbors.push([nx, ny])
    }
  }

  return neighbors
}

function placeBossRoom(maze: Maze, deadEnds: Position[]): void {
  const size = maze.length
  const startPosition = findStartPosition(maze)
  const minDistance = Math.floor(size / 2) // Minimum distance from start room

  // Sort dead ends by distance from start, in descending order
  deadEnds.sort((a, b) => calculateDistance(b, startPosition) - calculateDistance(a, startPosition))

  // Place the boss room in the furthest valid dead end
  for (const [x, y] of deadEnds) {
    if (calculateDistance([x, y], startPosition) >= minDistance) {
      maze[y][x] = "boss"
      return
    }
  }

  // If no suitable position found, place in the furthest available dead end
  if (deadEnds.length > 0) {
    const [x, y] = deadEnds[0]
    maze[y][x] = "boss"
  }
}

function countAdjacentRooms(maze: Maze, x: number, y: number): number {
  const directions: Position[] = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ]
  let count = 0

  for (const [dx, dy] of directions) {
    const nx = x + dx
    const ny = y + dy
    if (nx >= 0 && nx < maze.length && ny >= 0 && ny < maze.length && maze[ny][nx] !== "wall") {
      count++
    }
  }

  return count
}

function findStartPosition(maze: Maze): Position {
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] === "start") {
        return [x, y]
      }
    }
  }
  throw new Error("Start position not found")
}

function calculateDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1[0] - pos2[0]) + Math.abs(pos1[1] - pos2[1])
}

