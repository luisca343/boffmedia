"use client"

import { useCallback, useEffect, useState } from "react"

export interface PuzzlePiece {
  id: number
  src: string
  position: number
}

const WIDTH = 3
const HEIGHT = 3
const PIECE_COUNT = WIDTH * HEIGHT
/** The bottom-right tile is the hole: it is cut like the rest, then never rendered. */
const EMPTY_ID = PIECE_COUNT - 1

const SOURCE_IMAGE =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/steam-Ll038vGbTpPrpTm9AiPMgZqMvg3FHF.png"

const isAdjacent = (a: number, b: number) => {
  const rowA = Math.floor(a / WIDTH)
  const colA = a % WIDTH
  const rowB = Math.floor(b / WIDTH)
  const colB = b % WIDTH
  return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1
}

/**
 * The 3×3 sliding puzzle. The source image is sliced on a canvas into eight tiles
 * plus the hole, then walked 1000 legal moves backwards — so the board it deals
 * is always solvable.
 *
 * Every shuffle restarts from the full nine-tile cut. Re-shuffling the eight
 * *rendered* pieces walks the hole through a board that no longer contains it
 * and leaves two tiles stacked on one square.
 */
export function useSlidingPuzzle() {
  const [tiles, setTiles] = useState<PuzzlePiece[]>([])
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [emptyIndex, setEmptyIndex] = useState(EMPTY_ID)
  const [isComplete, setIsComplete] = useState(false)
  const [moves, setMoves] = useState(0)

  const shufflePieces = useCallback((cut: PuzzlePiece[]) => {
    if (cut.length !== PIECE_COUNT) return
    const shuffled = cut.map((piece) => ({ ...piece, position: piece.id }))
    let emptyPos = shuffled.length - 1

    for (let i = 0; i < 1000; i++) {
      const possibleMoves: number[] = []
      if (emptyPos % WIDTH > 0) possibleMoves.push(-1)
      if (emptyPos % WIDTH < WIDTH - 1) possibleMoves.push(1)
      if (emptyPos - WIDTH >= 0) possibleMoves.push(-WIDTH)
      if (emptyPos + WIDTH < shuffled.length) possibleMoves.push(WIDTH)

      const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
      const newEmptyPos = emptyPos + move

      shuffled[emptyPos].position = newEmptyPos
      shuffled[newEmptyPos].position = emptyPos
      ;[shuffled[emptyPos], shuffled[newEmptyPos]] = [shuffled[newEmptyPos], shuffled[emptyPos]]
      emptyPos = newEmptyPos
    }

    setPieces(shuffled.filter((piece) => piece.id !== EMPTY_ID))
    setEmptyIndex(emptyPos)
    setIsComplete(false)
    setMoves(0)
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = SOURCE_IMAGE
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const pieceWidth = Math.floor(img.width / WIDTH)
      const pieceHeight = Math.floor(img.height / HEIGHT)
      const canvas = document.createElement("canvas")
      canvas.width = pieceWidth
      canvas.height = pieceHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const cut: PuzzlePiece[] = []
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          ctx.clearRect(0, 0, pieceWidth, pieceHeight)
          ctx.drawImage(
            img,
            x * pieceWidth,
            y * pieceHeight,
            pieceWidth,
            pieceHeight,
            0,
            0,
            pieceWidth,
            pieceHeight,
          )
          cut.push({ id: y * WIDTH + x, src: canvas.toDataURL(), position: y * WIDTH + x })
        }
      }

      setTiles(cut)
      shufflePieces(cut)
    }
  }, [shufflePieces])

  const movePiece = useCallback(
    (clicked: PuzzlePiece) => {
      if (isComplete || !isAdjacent(clicked.position, emptyIndex)) return

      const next = pieces.map((piece) =>
        piece.id === clicked.id ? { ...piece, position: emptyIndex } : piece,
      )
      setPieces(next)
      setEmptyIndex(clicked.position)
      setMoves((n) => n + 1)
      setIsComplete(next.every((piece) => piece.id === piece.position))
    },
    [emptyIndex, isComplete, pieces],
  )

  return {
    columns: WIDTH,
    imageLoaded: tiles.length === PIECE_COUNT,
    isComplete,
    movePiece,
    moves,
    pieces,
    shuffle: useCallback(() => shufflePieces(tiles), [shufflePieces, tiles]),
  }
}
