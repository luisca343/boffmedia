import { memo, useState } from 'react'
import { SmartRotomApp } from "@boffmedia/shared"
import { App } from "./App"
import { motion } from "framer-motion"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface AppSlotProps {
  id: string
  app: SmartRotomApp | null
  index: number
  isSelected?: boolean
  onClick?: () => void
}

const AppSlot = memo(function AppSlot({ 
  id,
  app, 
  index,
  isSelected = false,
  onClick
}: AppSlotProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Setup dnd-kit sortable - matching PokemonSlot pattern
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({
    id,
    data: {
      type: 'app',
      slotIndex: index,
      app
    },
    disabled: !app // Only allow dragging if there's an app
  })

  const style = {
    transform: isDragging ? 'none' : CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  }

  // Empty slot - invisible by default, visible when dragging over
  if (!app) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes}
        {...listeners}
      >
        <div className="flex flex-col items-center justify-center m-auto hover:cursor-pointer mb-2">
          <div 
            className={`rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer group backdrop-blur-sm w-24 h-24 sm:w-36 sm:h-36 ${
              isOver 
                ? 'bg-gradient-to-br from-gray-600/20 to-gray-800/20 border-2 border-blue-400 bg-blue-400/20 shadow-blue-400/50 shadow-lg' 
                : 'border-2 border-transparent'
            }`}
          >
            {isOver && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none rounded-xl" />
                <div className="text-slate-500 group-hover:text-slate-400 transition-colors relative z-10">
                  <div className="w-6 h-6 border-2 border-dashed border-current rounded-full opacity-50 flex items-center justify-center">
                    <div className="w-2 h-2 bg-current rounded-full opacity-60" />
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Match the text height from filled apps - invisible spacer */}
          <p className="text-transparent text-center text-base sm:text-lg lg:text-xl mt-2">
            &nbsp;
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      {...listeners}
    >
      <motion.div 
        className={`rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 overflow-hidden flex items-center justify-center ${
          isOver
            ? 'ring-2 ring-blue-400 ring-opacity-60'
            : isSelected 
            ? 'ring-2 ring-yellow-400 ring-opacity-60' 
            : isDragging 
            ? 'opacity-50' 
            : 'hover:scale-105'
        }`}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <App app={app} />
        </div>
        
        {/* Subtle glow effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-purple-400/0 opacity-0 pointer-events-none"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Drag over indicator */}
        {isOver && (
          <div className="absolute inset-0 bg-blue-400/15 border-2 border-blue-400 rounded-xl pointer-events-none backdrop-blur-sm">
            <div className="absolute inset-2 border border-dashed border-blue-400/60 rounded-lg opacity-75" />
          </div>
        )}
      </motion.div>
    </div>
  )
})

export default AppSlot