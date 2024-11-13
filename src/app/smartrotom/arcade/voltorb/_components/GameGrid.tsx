import { Cell, RowColInfo } from './types'
import CellComponent from './Cell'
import { Coins } from 'lucide-react'
import Image from 'next/image'

interface GameGridProps {
  grid: Cell[][]
  rowInfo: RowColInfo[]
  colInfo: RowColInfo[]
  onCellClick: (row: number, col: number) => void
}

function GameGrid({ grid, rowInfo, colInfo, onCellClick }: GameGridProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {grid.map((row, rowIndex) => (
        <>
          {row.map((cell, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`}>
              <CellComponent cell={cell} onClick={() => onCellClick(rowIndex, colIndex)} rowIndex={rowIndex} colIndex={colIndex} />
            </div>
          ))}
          <div className="w-20 h-20 flex flex-col items-center justify-center bg-gray-700 rounded-md">
            <div className="flex items-center">
              <Coins className="w-6 h-6 text-yellow-500 mr-1" />
              <span className="text-yellow-500 text-md font-bold">{rowInfo[rowIndex]?.coins}</span>
            </div>
            <div className="flex items-center">
              <Image
                src="/smartrotom/img/apps/arcade/voltorb.png"
                alt="Voltorb"
                width={24}
                height={24}
                className="mr-1"
              />
              <span className="text-red-500 text-md font-bold">{rowInfo[rowIndex]?.voltorbs}</span>
            </div>
          </div>
        </>
      ))}
      {colInfo.map((info, index) => (
        <div key={index} className="w-20 h-20 flex flex-col items-center justify-center bg-gray-700 rounded-md">
          <div className="flex items-center">
            <Coins className="w-6 h-6 text-yellow-500 mr-1" />
            <span className="text-yellow-500 text-md font-bold">{info.coins}</span>
          </div>
          <div className="flex items-center">
            <Image
              src="/smartrotom/img/apps/arcade/voltorb.png"
              alt="Voltorb"
              width={24}
              height={24}
              className="mr-1"
            />
            <span className="text-red-500 text-md font-bold">{info.voltorbs}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default GameGrid