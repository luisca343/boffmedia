"use client"
import { App } from "./App"
import { useCallback } from "react"
import { motion } from "framer-motion"
import type { OrderedApp } from "@/types/apps"
import { MouseSensor, useSensor } from "@dnd-kit/core"
import { useOrderApps } from "@/hooks/apps/useOrderApps"
import { useBoffSession } from "@/services/useBoffSession"
import { useGetAppsForPlayer } from "@/hooks/apps/useGetAppsForPlayer"
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { DndContext, type DragEndEvent, closestCenter, useSensors } from "@dnd-kit/core"

export function AppList() {
  const { session } = useBoffSession()
  const { apps, setApps } = useGetAppsForPlayer(session?.user?.smartRotomUser?.uuid!)
  return <SortableGrid apps={apps} setApps={setApps} />
}

function SortableGrid({
  className,
  apps,
  setApps,
}: {
  className?: string
  apps: OrderedApp[]
  setApps: (apps: OrderedApp[]) => void
}) {
  const { session } = useBoffSession()
  const { orderApps, isLoading } = useOrderApps()
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  })

  const sensors = useSensors(mouseSensor)
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        const apps2 = arrayMove(
          apps,
          apps.indexOf(apps.find((app) => app.id === active.id) as OrderedApp),
          apps.indexOf(apps.find((app) => app.id === over.id) as OrderedApp),
        )
        const newOrder = apps2.map((app) => ({ id: app.id, order: apps2.indexOf(app) }))
        orderApps({ newOrder, uuid: session?.user?.smartRotomUser?.uuid! })

        setApps(apps2)
      }
    },
    [apps, setApps, session, orderApps],
  )

  if (isLoading) return <div>Updating order...</div>

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter} sensors={sensors}>
      <SortableContext items={apps} strategy={rectSortingStrategy}>
        <motion.ul
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 content-between gap-y-1 pt-2 pb-16 overflow-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {apps.map((app, index) => (
            <App key={`app-${index}`} app={app} />
          ))}
        </motion.ul>
      </SortableContext>
    </DndContext>
  )
}

