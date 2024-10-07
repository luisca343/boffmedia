import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cell, RowColInfo } from './types'
import { Coins } from 'lucide-react'
import Image from 'next/image'

interface GameGridProps {
  grid: Cell[][]
  rowInfo: RowColInfo[]
  colInfo: RowColInfo[]
  onCellClick: (row: number, col: number) => void
}

export default function GameGrid({ grid, rowInfo, colInfo, onCellClick }: GameGridProps) {
  const [flippedCells, setFlippedCells] = useState<{ [key: string]: boolean }>({})

  const handleCellClick = (row: number, col: number) => {
    setFlippedCells(prev => ({ ...prev, [`${row}-${col}`]: true }))
    onCellClick(row, col)
  }

  return (
    <div className="grid grid-cols-6 gap-2">
      {/* Top row for column info */}
      <div className="col-span-1"></div> {/* Empty cell for top-left corner */}
      {colInfo.map((info, index) => (
        <div key={`col-${index}`} className="flex flex-col items-center justify-center p-2 bg-gray-700 rounded-md">
          <div className="flex items-center mb-1">
            <Coins className="w-5 h-5 text-yellow-500 mr-1" />
            <span className="text-white text-lg font-bold">{info.coins}</span>
          </div>
          <div className="flex items-center">
            <Image
              src="/smartrotom/img/apps/arcade/voltorb.png"
              alt="Voltorb"
              width={20}
              height={20}
              className="mr-1"
            />
            <span className="text-white text-lg font-bold">{info.voltorbs}</span>
          </div>
        </div>
      ))}

      {/* Grid cells and row info */}
      {grid.map((row, rowIndex) => (
        <>
          {/* Row info */}
          <div key={`row-info-${rowIndex}`} className="flex flex-col items-center justify-center p-2 bg-gray-700 rounded-md">
            <div className="flex items-center mb-1">
              <Coins className="w-5 h-5 text-yellow-500 mr-1" />
              <span className="text-white text-lg font-bold">{rowInfo[rowIndex].coins}</span>
            </div>
            <div className="flex items-center">
              <Image
                src="/smartrotom/img/apps/arcade/voltorb.png"
                alt="Voltorb"
                width={20}
                height={20}
                className="mr-1"
              />
              <span className="text-white text-lg font-bold">{rowInfo[rowIndex].voltorbs}</span>
            </div>
          </div>

          {/* Grid cells */}
          {row.map((cell, colIndex) => (
            <motion.div
              key={`cell-${rowIndex}-${colIndex}`}
              className="aspect-square bg-blue-500 rounded-md cursor-pointer"
              onClick={() => handleCellClick(rowIndex, colIndex)}
              animate={{ rotateY: flippedCells[`${rowIndex}-${colIndex}`] ? 180 : 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="w-full h-full flex items-center justify-center"
                animate={{ rotateY: flippedCells[`${rowIndex}-${colIndex}`] ? 180 : 0 }}
              >
                {flippedCells[`${rowIndex}-${colIndex}`] ? (
                  <div className="bg-gray-200 w-full h-full rounded-md flex items-center justify-center">
                    {cell.value === 0 ? (
                      <Image
                        src="/smartrotom/img/apps/arcade/voltorb.png"
                        alt="Voltorb"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <span className="text-3xl font-bold">{cell.value}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-white text-3xl font-bold">?</span>
                )}
              </motion.div>
            </motion.div>
          ))}
        </>
      ))}
    </div>
  )
}