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
      className="w-20 h-20 rounded-md cursor-pointer perspective-500"
      initial={false}
      animate={{ rotateY: cell.revealed ? 180 : 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      whileHover={!cell.revealed ? { scale: 1.05 } : {}}
    >
      <div className="w-full h-full relative preserve-3d">
        <div
          className={`absolute w-full h-full flex items-center justify-center backface-hidden rounded-md border-2 ${
            cell.revealed ? 'hidden' : 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/70 hover:shadow-lg hover:shadow-blue-500/20'
          }`}
        >
          {/* Card back with arcade style pattern */}
          <div className="absolute inset-0 bg-[url('/smartrotom/img/apps/arcade/card-pattern.png')] bg-opacity-10 rounded-md"></div>
          
          {/* Marks grid */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-indigo-900/50 rounded-sm">
            {[0, 1, 2, 3].map(mark => (
              <div key={mark} className="w-6 h-6 flex items-center justify-center">
                {cell.marks.includes(mark) && (
                  mark === 0 ? (
                    <Image
                      src="/smartrotom/img/apps/arcade/voltorb.png"
                      alt="Voltorb"
                      width={18}
                      height={18}
                      className="drop-shadow-md"
                    />
                  ) : (
                    <span className="text-xs font-bold text-white drop-shadow-md">x{mark}</span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Card front */}
        <div
          className={`absolute w-full h-full flex items-center justify-center backface-hidden rounded-md border-2 ${
            cell.revealed
              ? cell.value === 0
                ? 'bg-gradient-to-br from-red-600 to-red-700 border-red-500/70'
                : 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-500/70'
              : 'hidden'
          }`}
          style={{ transform: 'rotateY(180deg)' }}
        >
          {/* Card front content */}
          {cell.value === 0 ? (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-400 opacity-50 blur-md"></div>
              <Image
                src="/smartrotom/img/apps/arcade/voltorb.png"
                alt="Voltorb"
                width={40}
                height={40}
                className="relative z-10"
              />
            </div>
          ) : (
            <span className="text-3xl font-bold text-white drop-shadow-md">×{cell.value}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default CellComponent