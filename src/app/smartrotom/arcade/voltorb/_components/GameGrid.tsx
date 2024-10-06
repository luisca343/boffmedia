import { Cell, RowColInfo } from './types'
import CellComponent from './Cell'

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
          <div className="w-12 h-12 flex flex-col items-center justify-center bg-gray-700 rounded-md">
            <span className="text-yellow-500 text-xs">{rowInfo[rowIndex]?.coins}</span>
            <span className="text-red-500 text-xs">{rowInfo[rowIndex]?.voltorbs}</span>
          </div>
        </>
      ))}
      {colInfo.map((info, index) => (
        <div key={index} className="w-12 h-12 flex flex-col items-center justify-center bg-gray-700 rounded-md">
          <span className="text-yellow-500 text-xs">{info.coins}</span>
          <span className="text-red-500 text-xs">{info.voltorbs}</span>
        </div>
      ))}
    </div>
  )
}

export default GameGrid