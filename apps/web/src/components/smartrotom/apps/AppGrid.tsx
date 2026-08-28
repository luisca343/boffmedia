"use client"
import { useCallback } from "react"
import { motion } from "framer-motion"
import { useOrderApps } from "@/hooks/apps/useOrderApps"
import { SortableContext } from "@dnd-kit/sortable"
import { DndContext, type DragEndEvent, DragOverlay } from "@dnd-kit/core"
import { SmartRotomAppExtended } from "@/types"
import { snapCenterToCursor } from "@dnd-kit/modifiers"
import { stablePositionStrategy } from "@/lib/drag-and-drop"
import { useActiveDragItem, useDndSensors, COLLISION_STRATEGIES, DROP_ANIMATIONS } from '@/lib/dnd-kit-setup'
import AppSlot from './AppSlot'
import { App } from "./App"
import { useTranslations } from "next-intl"
// Grid configuration. `app.order` IS the 0-based index into these cells, so this
// size is a contract with the API, not a local layout choice: keep it in step with
// `APP_GRID_COLS/ROWS` in apps/api/src/api/smartrotom/apps/app-grid.constants.ts,
// which is what picks the slot for a newly added app.
const GRID_COLS = 8
const GRID_ROWS = 6
const TOTAL_SLOTS = GRID_COLS * GRID_ROWS

interface AppGridProps {
  apps: SmartRotomAppExtended[]
  setApps: (apps: SmartRotomAppExtended[]) => void
  className?: string
}

export default function AppGrid({ apps, setApps, className }: AppGridProps) {
  const { orderApps, isLoading } = useOrderApps()
  const t = useTranslations("smartrotom.appGrid")
  
  // Use the same drag and drop setup as PC page
  const { activeDragItem, handleDragStart, handleDragEnd } = useActiveDragItem()
  const sensors = useDndSensors()

  // Create a fixed grid with apps positioned by their order
  const createGridSlots = () => {
    const slots: (SmartRotomAppExtended | null)[] = new Array(TOTAL_SLOTS).fill(null)
    
    // Sort apps by their order and place them in the grid
    const sortedApps = [...apps].sort((a, b) => (a.order || 0) - (b.order || 0))

    // An app whose stored order is off the grid, or whose cell is already taken,
    // used to be dropped here without a trace. The API no longer produces either,
    // but rows written before that fix still exist, so place the strays in the
    // first free cell rather than let them vanish from the player's dock.
    const strays: SmartRotomAppExtended[] = []
    sortedApps.forEach((app) => {
      const position = app.order || 0
      if (position >= 0 && position < TOTAL_SLOTS && slots[position] === null) {
        slots[position] = app
      } else {
        strays.push(app)
      }
    })

    if (strays.length) {
      let cursor = 0
      for (const app of strays) {
        while (cursor < TOTAL_SLOTS && slots[cursor] !== null) cursor++
        if (cursor >= TOTAL_SLOTS) break
        slots[cursor] = app
      }
    }

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
    
    // Identity comes from the session — OrderAppDto carries no uuid.
    orderApps({ order: orderUpdates })

    setApps(updatedApps)
  }, [apps, setApps, orderApps])

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
          {t("updatingOrder")}
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