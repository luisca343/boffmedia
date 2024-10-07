import { motion } from 'framer-motion'
import { Cell } from './types'
import Image from 'next/image'

interface CellProps {
  cell: Cell
  onClick: () => void
  rowIndex: number
  colIndex: number
}

function CellComponent({ cell, onClick }: CellProps) {
  return (
    <motion.div
      className={`w-20 h-20 rounded-md cursor-pointer`}
      initial={false}
      animate={{ rotateY: cell.revealed ? 180 : 0 }}
      transition={{ duration: 0.6 }}
      onClick={onClick}
    >
      <div className="w-full h-full relative">
        <div
          className={`absolute w-full h-full flex items-center justify-center backface-hidden ${
            cell.revealed ? 'hidden' : 'bg-blue-500 hover:bg-blue-400'
          }`}
        >
          <div className="grid grid-cols-2 gap-1">
            {[0, 1, 2, 3].map(mark => (
              <div key={mark} className="w-5 h-5 flex items-center justify-center">
                {cell.marks.includes(mark) && (
                  mark === 0 ? (
                    <Image
                      src="/smartrotom/img/apps/arcade/voltorb.png"
                      alt="Voltorb"
                      width={16}
                      height={16}
                    />
                  ) : (
                    <span className="text-xs font-bold">{mark}</span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
        <div
          className={`absolute w-full h-full flex items-center justify-center backface-hidden ${
            cell.revealed
              ? cell.value === 0
                ? 'bg-red-500'
                : 'bg-green-500'
              : 'hidden'
          }`}
          style={{ transform: 'rotateY(180deg)' }}
        >
          {cell.value === 0 ? (
            <Image
              src="/smartrotom/img/apps/arcade/voltorb.png"
              alt="Voltorb"
              width={32}
              height={32}
            />
          ) : (
            <span className="text-2xl font-bold text-white">{cell.value}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default CellComponent