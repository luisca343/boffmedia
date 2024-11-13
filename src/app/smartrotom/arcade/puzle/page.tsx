"use client"

import React, { useState, useEffect } from 'react'
import { Puzzle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import StarsBackground from '../_components/StarsBackground'
import {RainbowText} from '../_components/RainbowText'

interface PuzzlePiece {
  id: number
  src: string
  position: number
}

interface Star {
  x: number
  y: number
  size: number
}

export default function FramerMotionSteamLogoPuzzle() {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [emptyIndex, setEmptyIndex] = useState<number>(8)
  const [isComplete, setIsComplete] = useState<boolean>(false)
  const [stars, setStars] = useState<Star[]>([])
  const width = 3
  const height = 3

  useEffect(() => {
    const img = new Image()
    img.src = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/steam-Ll038vGbTpPrpTm9AiPMgZqMvg3FHF.png"
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setImageLoaded(true)
      createPuzzlePieces(img)
    }
  }, [])

  const createPuzzlePieces = (img: HTMLImageElement) => {
    const pieceWidth = Math.floor(img.width / width)
    const pieceHeight = Math.floor(img.height / height)
    const canvas = document.createElement('canvas')
    canvas.width = pieceWidth
    canvas.height = pieceHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const newPieces: PuzzlePiece[] = []

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        ctx.clearRect(0, 0, pieceWidth, pieceHeight)
        ctx.drawImage(
          img,
          x * pieceWidth, y * pieceHeight, pieceWidth, pieceHeight,
          0, 0, pieceWidth, pieceHeight
        )
        newPieces.push({
          id: y * width + x,
          src: canvas.toDataURL(),
          position: y * width + x
        })
      }
    }

    shufflePieces(newPieces)
  }

  const shufflePieces = (piecesToShuffle: PuzzlePiece[]) => {
    let shuffled = [...piecesToShuffle]
    let emptyPos = shuffled.length - 1
    
    for (let i = 0; i < 1000; i++) {
      const possibleMoves = []
      if (emptyPos % width > 0) possibleMoves.push(-1)
      if (emptyPos % width < width - 1) possibleMoves.push(1)
      if (emptyPos - width >= 0) possibleMoves.push(-width)
      if (emptyPos + width < shuffled.length) possibleMoves.push(width)

      const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
      const newEmptyPos = emptyPos + move
      
      shuffled[emptyPos].position = newEmptyPos
      shuffled[newEmptyPos].position = emptyPos
      ;[shuffled[emptyPos], shuffled[newEmptyPos]] = [shuffled[newEmptyPos], shuffled[emptyPos]]
      emptyPos = newEmptyPos
    }

    setPieces(shuffled.filter(piece => piece.id !== 8))
    setEmptyIndex(emptyPos)
  }

  const handlePieceClick = (clickedPiece: PuzzlePiece) => {
    if (isAdjacent(clickedPiece.position, emptyIndex)) {
      const newPieces = pieces.map(piece => 
        piece.id === clickedPiece.id 
          ? { ...piece, position: emptyIndex }
          : piece
      )
      setPieces(newPieces)
      setEmptyIndex(clickedPiece.position)
      checkCompletion(newPieces)
    }
  }

  const isAdjacent = (index1: number, index2: number) => {
    const row1 = Math.floor(index1 / width)
    const col1 = index1 % width
    const row2 = Math.floor(index2 / width)
    const col2 = index2 % width
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1
  }

  const checkCompletion = (currentPieces: PuzzlePiece[]) => {
    setIsComplete(currentPieces.every((piece) => piece.id === piece.position))
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-900 p-4 font-mono relative overflow-hidden">
      <StarsBackground />
      <RainbowText text="Puzles Arcade Temáticos y Originales" />
      {imageLoaded ? (
        <>
          <div 
            className="relative bg-gray-800 bg-opacity-80 rounded-lg p-1 z-10"
            style={{
              width: '300px',
              height: '300px',
            }}
          >
            <AnimatePresence>
              {pieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  className="absolute w-[98px] h-[98px] cursor-pointer hover:opacity-80"
                  initial={false}
                  animate={{
                    x: (piece.position % width) * 100,
                    y: Math.floor(piece.position / width) * 100,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={() => handlePieceClick(piece)}
                >
                  <img
                    src={piece.src}
                    alt={`Puzzle piece ${piece.id}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 text-2xl font-bold text-green-400 z-10"
            >
              Puzzle Completed!
            </motion.div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => shufflePieces(pieces)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 z-10"
          >
            Shuffle
          </motion.button>
          <div className="mt-8 flex items-center justify-center space-x-4 z-10">
            <Puzzle className="w-8 h-8 text-blue-500 animate-bounce" />
            <p className="text-lg text-white">Slide the pieces to solve the puzzle!</p>
            <Puzzle className="w-8 h-8 text-blue-500 animate-bounce" />
          </div>
        </>
      ) : (
        <div className="w-64 h-64 rounded-full border-4 border-blue-500 flex items-center justify-center z-10">
          <p className="text-white">Loading...</p>
        </div>
      )}
    </div>
  )
}