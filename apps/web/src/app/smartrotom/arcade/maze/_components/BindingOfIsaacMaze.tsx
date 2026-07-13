"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { GameStage } from "../../_components/GameStage"
import { GameTopBar } from "../../_components/GameTopBar"
import { Icon, Modal, Panel, StatCard, Tag } from "../../_components/ui"
import { generateMaze } from "../utils/mazeGenerator"
import { MazeControls } from "./MazeControls"

type Room = "start" | "room" | "boss" | "wall"
type Position = [number, number]

const ROOM_SKIN: Record<Room, string> = {
  start: "border-ar-lime/50 bg-ar-lime/25 text-ar-lime",
  room: "border-ar-violet/40 bg-ar-violet/20 text-ar-violet-2",
  boss: "border-ar-magenta/55 bg-ar-magenta/30 text-ar-magenta-2 shadow-[inset_0_0_18px_rgb(var(--ar-magenta)/.35)]",
  wall: "border-white/[.04] bg-ar-void/70 text-transparent",
}

const ROOM_LABEL: Record<Room, string> = {
  start: "Sala inicial",
  room: "Sala",
  boss: "Sala del jefe",
  wall: "Muro",
}

function RoomIcon({ room }: { room: Room }) {
  if (room === "start") return <Icon.Target s={16} />
  if (room === "room") return <Icon.Box s={16} />
  if (room === "boss") return <Icon.Crown s={16} />
  return null
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

const findRoom = (maze: Room[][], type: Room): Position | null => {
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] === type) return [x, y]
    }
  }
  return null
}

export default function BindingOfIsaacMaze() {
  const [size, setSize] = useState(13)
  const [depth, setDepth] = useState(1)
  const [maze, setMaze] = useState<Room[][]>(() => generateMaze(13, 1))
  const [showDebug, setShowDebug] = useState(false)
  const [help, setHelp] = useState(false)
  const [cellSize, setCellSize] = useState(48)
  const gridRef = useRef<HTMLDivElement>(null)

  // The board is square and capped at 600px, so the cell size is whatever the
  // stage's width allows — it cannot be a static class.
  useEffect(() => {
    const updateCellSize = () => {
      if (!gridRef.current) return
      const maxGridSize = Math.min(gridRef.current.offsetWidth, 600)
      setCellSize(Math.floor(maxGridSize / size))
    }

    updateCellSize()
    window.addEventListener("resize", updateCellSize)
    return () => window.removeEventListener("resize", updateCellSize)
  }, [size])

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Math.max(5, Number.parseInt(e.target.value))
    if (Number.isNaN(newSize)) return
    setSize(newSize)
    setMaze(generateMaze(newSize, depth))
  }

  const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDepth = Math.max(1, Number.parseInt(e.target.value))
    if (Number.isNaN(newDepth)) return
    setDepth(newDepth)
    setMaze(generateMaze(size, newDepth))
  }

  const regenerateMaze = () => setMaze(generateMaze(size, depth))

  const roomCount = useMemo(() => maze.flat().filter((room) => room !== "wall").length, [maze])

  const deadEndsCount = useMemo(() => {
    let count = 0
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] !== "wall" && countAdjacentRooms(maze, x, y) === 1) count++
      }
    }
    return count
  }, [maze])

  const startToBossDistance = useMemo(() => {
    const start = findRoom(maze, "start")
    const boss = findRoom(maze, "boss")
    if (!start || !boss) return null
    return Math.abs(start[0] - boss[0]) + Math.abs(start[1] - boss[1])
  }, [maze])

  return (
    <div className="mt-4">
      <GameTopBar
        title="LABERINTO"
        accent="violet"
        onHelp={() => setHelp(true)}
        onReset={regenerateMaze}
      />

      <GameStage accent="violet">
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_260px] lg:gap-5">
          <Panel tone="deep" innerClassName="p-4 md:p-[18px]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-white/10 px-1.5 pb-3.5">
              <span className="font-ar-display text-[11px] text-ar-violet-2">▸ Calabozo</span>
              <span className="font-ar-mono text-[11px] uppercase text-ar-ink-dim">
                {size} × {size} · Profundidad {depth}
              </span>
              <Tag tone="magenta">1 jefe</Tag>
            </div>

            <div
              ref={gridRef}
              className="mx-auto grid gap-0"
              style={{
                gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
                width: `${size * cellSize}px`,
                height: `${size * cellSize}px`,
                maxWidth: "600px",
                maxHeight: "600px",
              }}
            >
              {maze.map((row, y) =>
                row.map((room, x) => (
                  <div
                    key={`${x},${y}`}
                    title={ROOM_LABEL[room]}
                    className={cn("flex items-center justify-center border", ROOM_SKIN[room])}
                    style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                  >
                    <RoomIcon room={room} />
                  </div>
                )),
              )}
            </div>

            {showDebug && (
              <div className="mt-4">
                <div className="mb-2 font-ar-display text-[9px] uppercase text-ar-cyan">
                  Vista debug
                </div>
                <pre className="ar-scroll m-0 overflow-x-auto rounded-lg border border-white/[.08] bg-black/50 p-3.5 font-ar-mono text-[11px] leading-relaxed text-ar-ink-dim">
                  {maze.map((row) => row.map((room) => room[0].toUpperCase()).join(" ")).join("\n")}
                </pre>
              </div>
            )}
          </Panel>

          <div className="flex flex-col gap-3">
            <MazeControls
              size={size}
              depth={depth}
              showDebug={showDebug}
              onSizeChange={handleSizeChange}
              onDepthChange={handleDepthChange}
              onRegenerate={regenerateMaze}
              onToggleDebug={() => setShowDebug((v) => !v)}
            />

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                kicker="Salas"
                value={String(roomCount)}
                sub={`Previstas ${Math.floor(3.33 * depth + 5)}–${Math.floor(3.33 * depth + 6)}`}
                icon={<Icon.Box s={16} />}
                tone="violet"
              />
              <StatCard
                kicker="Sin salida"
                value={String(deadEndsCount)}
                sub="Callejones"
                icon={<Icon.Shield s={16} />}
                tone="cyan"
              />
            </div>

            <Panel tone="void" tight>
              <div className="mb-2.5 font-ar-display text-[9px] uppercase text-ar-magenta-2">
                Distancia al jefe
              </div>
              <div className="font-ar-mono text-[22px] font-bold tabular-nums text-ar-ink">
                {startToBossDistance ?? "—"}
              </div>
              <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                {(["start", "room", "boss"] as const).map((room) => (
                  <li key={room} className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className={cn(
                        "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md border",
                        ROOM_SKIN[room],
                      )}
                    >
                      <RoomIcon room={room} />
                    </span>
                    <span className="font-ar-mono text-[11px] text-ar-ink-dim">
                      {ROOM_LABEL[room]}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </GameStage>

      <Modal open={help} onClose={() => setHelp(false)} kicker="Laberinto" title="¿Cómo funciona?">
        <ul className="m-0 list-disc space-y-2 pl-5">
          <li>Cada calabozo se genera al vuelo: una sala inicial, salas conectadas y un jefe.</li>
          <li>
            <b>Tamaño</b> cambia el lado de la cuadrícula; <b>profundidad</b>, cuántas salas se
            excavan.
          </li>
          <li>«Regenerar» reparte un calabozo nuevo con los mismos parámetros.</li>
          <li>La vista debug imprime la rejilla en texto: S inicio, R sala, B jefe, W muro.</li>
        </ul>
      </Modal>
    </div>
  )
}
