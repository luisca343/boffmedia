"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { generateMaze } from "../utils/mazeGenerator"
import { Home, Square, Crown } from "lucide-react"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import { Label } from "@/components/ui/primitives/label"

type Room = "start" | "room" | "boss" | "wall"
type Position = [number, number]

export default function BindingOfIsaacMaze() {
  const [size, setSize] = useState(13)
  const [depth, setDepth] = useState(1)
  const [maze, setMaze] = useState(generateMaze(size, depth))
  const [showDebug, setShowDebug] = useState(false)
  const [cellSize, setCellSize] = useState(48) // Default cell size
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateCellSize = () => {
      if (gridRef.current) {
        const gridWidth = gridRef.current.offsetWidth
        const maxGridSize = Math.min(gridWidth, 600) // Limit max size to 600px
        const newCellSize = Math.floor(maxGridSize / size)
        setCellSize(newCellSize)
      }
    }

    updateCellSize()
    window.addEventListener("resize", updateCellSize)
    return () => window.removeEventListener("resize", updateCellSize)
  }, [size])

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Math.max(5, Number.parseInt(e.target.value))
    setSize(newSize)
    setMaze(generateMaze(newSize, depth))
  }

  const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDepth = Math.max(1, Number.parseInt(e.target.value))
    setDepth(newDepth)
    setMaze(generateMaze(size, newDepth))
  }

  const regenerateMaze = () => {
    setMaze(generateMaze(size, depth))
  }

  const getRoomColor = (room: string) => {
    switch (room) {
      case "start":
        return "bg-highlight-500"
      case "room":
        return "bg-secondary-500"
      case "boss":
        return "bg-red-500"
      default:
        return "bg-surface-300"
    }
  }

  const getRoomIcon = (room: string) => {
    switch (room) {
      case "start":
        return <Home className="w-1/2 h-1/2 text-white" />
      case "room":
        return <Square className="w-1/2 h-1/2 text-white" />
      case "boss":
        return <Crown className="w-1/2 h-1/2 text-white" />
      default:
        return null
    }
  }

  const countRooms = () => {
    return maze.flat().filter((room) => room !== "wall").length
  }

  const countDeadEnds = () => {
    let count = 0
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] !== "wall" && countAdjacentRooms(maze, x, y) === 1) {
          count++
        }
      }
    }
    return count
  }

  const countAdjacentRooms = (maze: Room[][], x: number, y: number): number => {
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]
    return directions.filter(([dx, dy]) => {
      const nx = x + dx
      const ny = y + dy
      return nx >= 0 && nx < maze.length && ny >= 0 && ny < maze.length && maze[ny][nx] !== "wall"
    }).length
  }

  const findRoom = (type: Room): Position | null => {
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] === type) {
          return [x, y]
        }
      }
    }
    return null
  }

  const calculateDistance = (pos1: Position | null, pos2: Position | null): number | null => {
    if (!pos1 || !pos2) return null
    return Math.abs(pos1[0] - pos2[0]) + Math.abs(pos1[1] - pos2[1])
  }

  const startToBossDistance = useMemo(() => {
    const startPos = findRoom("start")
    const bossPos = findRoom("boss")
    return calculateDistance(startPos, bossPos)
  }, [maze, findRoom, calculateDistance]) // Added dependencies to useMemo

  const deadEndsCount = useMemo(() => countDeadEnds(), [maze])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Binding of Isaac-like Maze Generator</h1>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div>
          <Label htmlFor="size">Maze Size:</Label>
          <Input id="size" type="number" value={size} onChange={handleSizeChange} min="5" className="w-20 ml-2" />
        </div>
        <div>
          <Label htmlFor="depth">Depth:</Label>
          <Input id="depth" type="number" value={depth} onChange={handleDepthChange} min="1" className="w-20 ml-2" />
        </div>
        <Button onClick={regenerateMaze}>Regenerate Maze</Button>
        <Button onClick={() => setShowDebug(!showDebug)}>{showDebug ? "Hide" : "Show"} Debug View</Button>
      </div>
      <div className="mb-4">
        <p>Total Rooms: {countRooms()}</p>
        <p>
          Expected Rooms: {Math.floor(3.33 * depth + 5)} - {Math.floor(3.33 * depth + 6)}
        </p>
        <p>Distance between Start and Boss: {startToBossDistance ?? "N/A"}</p>
        <p>Number of Dead Ends: {deadEndsCount}</p>
      </div>
      <div
        ref={gridRef}
        className="grid gap-0 border border-surface-400 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          width: `${size * cellSize}px`,
          height: `${size * cellSize}px`,
          maxWidth: "600px", // Limit max width to 600px
          maxHeight: "600px", // Limit max height to 600px
        }}
      >
        {maze.map((row, y) =>
          row.map((room, x) => (
            <div
              key={`${x},${y}`}
              className={`flex items-center justify-center ${getRoomColor(room)} border border-surface-400`}
              style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
            >
              {getRoomIcon(room)}
            </div>
          )),
        )}
      </div>
      {showDebug && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Debug View</h2>
          <pre className="bg-surface-100 p-4 rounded">
            {maze.map((row) => row.map((room) => room[0].toUpperCase()).join(" ")).join("\n")}
          </pre>
        </div>
      )}
    </div>
  )
}

