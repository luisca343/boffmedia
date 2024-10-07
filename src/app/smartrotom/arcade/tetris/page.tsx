'use client'

import { useState, useEffect, useCallback } from 'react'
import { Joystick } from "lucide-react"
import StarsBackground from '../_components/StarsBackground'
import {RainbowText} from '../_components/RainbowText'

// Pokemon-themed Tetrominos
const TETROMINOS = {
  0: { shape: [[0]], color: 'bg-gray-800' },
  I: { shape: [[1, 1, 1, 1]], color: 'bg-blue-500' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-yellow-500' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-red-500' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-pink-500' },
}

const STAGE_WIDTH = 12
const STAGE_HEIGHT = 20

const createStage = () =>
  Array.from(Array(STAGE_HEIGHT), () => Array(STAGE_WIDTH).fill([0, 'clear']))

const randomTetromino = () => {
  const tetrominos = 'IJLOSTZ'
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)]
  return TETROMINOS[randTetromino]
}

export default function PokemonTetris() {
  const [stage, setStage] = useState(createStage())
  const [dropTime, setDropTime] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOS[0].shape,
    collided: false,
  })

  const movePlayer = (dir) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x + dir, y: prev.pos.y }
      }))
    }
  }

  const startGame = () => {
    setStage(createStage())
    setDropTime(1000)
    resetPlayer()
    setGameOver(false)
    setScore(0)
  }

  const drop = () => {
    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x, y: prev.pos.y + 1 },
        collided: false,
      }))
    } else {
      if (player.pos.y < 1) {
        setGameOver(true)
        setDropTime(null)
      }
      setPlayer(prev => ({
        ...prev,
        collided: true,
      }))
    }
  }

  const dropPlayer = () => {
    drop()
  }

  const move = ({ keyCode }) => {
    if (!gameOver) {
      if (keyCode === 37) {
        movePlayer(-1)
      } else if (keyCode === 39) {
        movePlayer(1)
      } else if (keyCode === 40) {
        dropPlayer()
      } else if (keyCode === 38) {
        playerRotate(stage, 1)
      }
    }
  }

  const checkCollision = (player, stage, { x: moveX, y: moveY }) => {
    for (let y = 0; y < player.tetromino.length; y += 1) {
      for (let x = 0; x < player.tetromino[y].length; x += 1) {
        if (player.tetromino[y][x] !== 0) {
          if (
            !stage[y + player.pos.y + moveY] ||
            !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
            stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !== 'clear'
          ) {
            return true
          }
        }
      }
    }
    return false
  }

  const resetPlayer = useCallback(() => {
    setPlayer({
      pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
      tetromino: randomTetromino().shape,
      collided: false,
    })
  }, [])

  const playerRotate = (stage, dir) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player))
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir)

    if (!checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      setPlayer(clonedPlayer)
    }
  }

  const rotate = (matrix, dir) => {
    const rotatedTetro = matrix.map((_, index) =>
      matrix.map(col => col[index])
    )
    if (dir > 0) return rotatedTetro.map(row => row.reverse())
    return rotatedTetro.reverse()
  }

  useEffect(() => {
    let dropTimer
    if (dropTime) {
      dropTimer = setInterval(() => {
        drop()
      }, dropTime)
    }
    return () => {
      clearInterval(dropTimer)
    }
  }, [dropTime, drop])

  useEffect(() => {
    const sweepRows = newStage =>
      newStage.reduce((ack, row) => {
        if (row.findIndex(cell => cell[0] === 0) === -1) {
          setScore(prev => prev + 1)
          ack.unshift(new Array(newStage[0].length).fill([0, 'clear']))
          return ack
        }
        ack.push(row)
        return ack
      }, [])

    const updateStage = prevStage => {
      const newStage = prevStage.map(row =>
        row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell))
      )

      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            newStage[y + player.pos.y][x + player.pos.x] = [
              value,
              `${player.collided ? 'merged' : 'clear'}`,
            ]
          }
        })
      })

      if (player.collided) {
        resetPlayer()
        return sweepRows(newStage)
      }

      return newStage
    }

    setStage(prev => updateStage(prev))
  }, [player, resetPlayer])

  return (
    <div className="min-h-screen w-full bg-purple-900 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden" onKeyDown={move} tabIndex="0">
      <StarsBackground />
      <RainbowText text="Pokemon Tetris" />
      <div className="bg-gray-800 bg-opacity-80 border-4 border-yellow-500 rounded-lg p-6 flex flex-col items-center space-y-4 z-10">
        {gameOver ? (
          <div className="text-white text-2xl">Game Over</div>
        ) : (
          <div className="grid grid-cols-12 gap-1">
            {stage.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={`w-6 h-6 ${TETROMINOS[cell[0]].color} border border-gray-700`}
                />
              ))
            )}
          </div>
        )}
        <div className="text-white text-xl">Score: {score}</div>
        <button
          onClick={startGame}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
        >
          {gameOver ? 'Restart Game' : 'Start Game'}
        </button>
      </div>
      <div className="mt-8 flex items-center justify-center space-x-4 z-10">
        <Joystick className="w-8 h-8 text-red-500 animate-bounce" />
        <p className="text-lg text-white">Use arrow keys to play!</p>
        <Joystick className="w-8 h-8 text-blue-500 animate-bounce" />
      </div>
    </div>
  )
}