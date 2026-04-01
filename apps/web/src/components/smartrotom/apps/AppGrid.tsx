"use client"
import { useCallback } from "react"
import { motion } from "framer-motion"
import { useOrderApps } from "@/hooks/apps/useOrderApps"
import { useBoffSession } from "@/services/useBoffSession"
import { SortableContext } from "@dnd-kit/sortable"
import { DndContext, type DragEndEvent, DragOverlay } from "@dnd-kit/core"
import { SmartRotomAppExtended } from "@/types"
import { snapCenterToCursor } from "@dnd-kit/modifiers"
import { stablePositionStrategy } from "@/lib/drag-and-drop"
import { useActiveDragItem, useDndSensors, COLLISION_STRATEGIES, DROP_ANIMATIONS } from '@/lib/dnd-kit-setup'
import AppSlot from './AppSlot'
import { App } from "./App"
// Grid configuration - 6 apps per row
const GRID_COLS = 8
const GRID_ROWS = 6
const TOTAL_SLOTS = GRID_COLS * GRID_ROWS

interface AppGridProps {
  apps: SmartRotomAppExtended[]
  setApps: (apps: SmartRotomAppExtended[]) => void
  className?: string
}

export default function AppGrid({ apps, setApps, className }: AppGridProps) {
  const { session } = useBoffSession()
  const { orderApps, isLoading } = useOrderApps()
  
  // Use the same drag and drop setup as PC page
  const { activeDragItem, handleDragStart, handleDragEnd } = useActiveDragItem()
  const sensors = useDndSensors()

  // Create a fixed grid with apps positioned by their order
  const createGridSlots = () => {
    const slots: (SmartRotomAppExtended | null)[] = new Array(TOTAL_SLOTS).fill(null)
    
    // Sort apps by their order and place them in the grid
    const sortedApps = [...apps].sort((a, b) => (a.order || 0) - (b.order || 0))
    sortedApps.forEach((app) => {
      const position = app.order || 0
      if (position < TOTAL_SLOTS) {
        slots[position] = app
      }
    })
    
    return slots
  }

  // Custom drag end handler for app functionality
  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !active.data.current || !over.data.current) {
      return
    }

    const activeData = active.data.current
    const overData = over.data.current

    // Extract slot indices
    const activeSlotIndex = activeData.slotIndex
    const overSlotIndex = overData.slotIndex
    
    const activeApp = apps.find(app => (app.order || 0) === activeSlotIndex)
    const overApp = apps.find(app => (app.order || 0) === overSlotIndex)
    
    if (!activeApp) return

    let updatedApps = [...apps]
    
    if (overApp) {
      // Swap positions between two apps
      const activeIndex = updatedApps.findIndex(app => app.id === activeApp.id)
      const overIndex = updatedApps.findIndex(app => app.id === overApp.id)
      
      // Swap the order values
      updatedApps[activeIndex] = { ...activeApp, order: overSlotIndex }
      updatedApps[overIndex] = { ...overApp, order: activeSlotIndex }
    } else {
      // Moving to empty slot
      const activeIndex = updatedApps.findIndex(app => app.id === activeApp.id)
      updatedApps[activeIndex] = { ...activeApp, order: overSlotIndex }
    }

    // Create order update payload
    const orderUpdates = updatedApps.map(app => ({ 
      id: app.id, 
      order: app.order || 0 
    }))
    
    orderApps({ 
      order: orderUpdates, 
      uuid: session?.user?.smartRotomUser?.uuid! 
    })

    setApps(updatedApps)
  }, [apps, setApps, session, orderApps])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 ">
        <motion.div
          className="text-slate-300 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Updating order...
        </motion.div>
      </div>
    )
  }

  const gridSlots = createGridSlots()
  const slotIds = gridSlots.map((_, index) => `slot-${index}`)

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={COLLISION_STRATEGIES.custom}
      onDragStart={handleDragStart}
      onDragEnd={(event) => handleDragEnd(event, onDragEnd)}
    >
      <SortableContext items={slotIds} strategy={stablePositionStrategy}>
        <motion.div
          className={`grid grid-cols-8 gap-2 p-2 pt-2 pb-16 overflow-auto select-none ${className || ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.02 }}
        >
          {gridSlots.map((app, index) => (
            <motion.div
              key={`slot-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.01,
                type: "spring",
                stiffness: 200
              }}
            >
              <AppSlot
                id={`slot-${index}`}
                app={app}
                index={index}
              />
            </motion.div>
          ))}
        </motion.div>
      </SortableContext>

      {/* Drag Overlay - matching PC page pattern */}
      <DragOverlay 
        dropAnimation={DROP_ANIMATIONS.none}
        modifiers={[snapCenterToCursor]}
      >
        {activeDragItem && activeDragItem.app && (
          <motion.div
            className="transform scale-110 rotate-3 opacity-90"
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.1, rotate: 3 }}
            transition={{ duration: 0.2 }}
          >
            <App app={activeDragItem.app} />
            {/* Visual feedback overlay */}
            <div className="absolute inset-0 bg-blue-400/20 rounded-lg border-2 border-blue-400/50 pointer-events-none" />
          </motion.div>
        )}
      </DragOverlay>
    </DndContext>
  )
}