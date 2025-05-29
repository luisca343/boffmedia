import { motion } from "framer-motion"
import { User } from "lucide-react"

interface SpinnerItemProps {
  name: string
  index: number
  isWinningItem: boolean
  spinComplete: boolean
}

export default function SpinnerItem({ name, index, isWinningItem, spinComplete }: SpinnerItemProps) {
  const showWinningStyles = isWinningItem && spinComplete;
  
  return (
    <div
      key={`${name}-${index}`}
      className={`flex-shrink-0 w-[180px] h-56 mx-[10px] p-4 rounded-lg flex flex-col items-center justify-center 
        ${showWinningStyles 
          ? 'scale-110 z-10 border-4 border-primary-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] bg-primary-900/50' 
          : 'border-2 border-surface-700 bg-surface-800/50'}`}
      style={{ 
        flexShrink: 0,
        flexGrow: 0,
        flexBasis: '180px'
      }}
    >
      <div className="bg-surface-700/70 w-24 h-24 rounded-full flex items-center justify-center mb-4">
        <User className={`w-12 h-12 ${showWinningStyles ? 'text-primary-400' : 'text-surface-400'}`} />
      </div>
      
      <h3 className={`${showWinningStyles ? 'text-primary-300' : 'text-surface-200'} font-bold text-center text-base truncate max-w-full`}>
        {name}
      </h3>
      
      {showWinningStyles && (
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-primary-500/10 rounded-lg"
        />
      )}
    </div>
  )
}