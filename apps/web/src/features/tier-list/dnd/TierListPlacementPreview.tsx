"use client"

import { useLayoutEffect, type ReactNode } from "react"
import { useDndContext, useDroppable } from "@dnd-kit/core"
import { DragPlaceholder } from "@boffmedia/ui"
import type { TierListDropTarget } from "./actions"

export function TierListPlacementPreview({ target, itemId, children }: { target: TierListDropTarget; itemId: string; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `tier-insertion-preview-${target.rowId ?? "source"}`, data: { ...target, preview: true } })
  const { measureDroppableContainers, droppableContainers } = useDndContext()
  // Insertion changes positions without resizing the row. Refresh every affected
  // target after layout so subsequent movement hits the visible gap/cards.
  useLayoutEffect(() => { measureDroppableContainers([...droppableContainers.keys()]) }, [target, measureDroppableContainers, droppableContainers])
  return <DragPlaceholder ref={setNodeRef} data-tier-insertion-preview={itemId}>{children}</DragPlaceholder>
}
