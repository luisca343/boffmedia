"use client"

import { memo, useCallback, type ReactNode } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DragCard } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import type { TierListDragItem } from "./actions"

export const TierListDraggableItem = memo(function TierListDraggableItem({ id, data, name, hidden = false, showGrip = true, onSelect, children }: {
  id: string; data: TierListDragItem; name: string; hidden?: boolean; showGrip?: boolean; onSelect: () => void; children: ReactNode
}) {
  const t = useTranslations("tierLists")
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging, isOver } = useSortable({ id, data, animateLayoutChanges: () => false })
  const ref = useCallback((node: HTMLButtonElement | null) => { setNodeRef(node); setActivatorNodeRef(node) }, [setNodeRef, setActivatorNodeRef])
  return <DragCard ref={ref} {...attributes} {...listeners} showGrip={showGrip} dragging={isDragging} dropTarget={isOver && !isDragging}
    style={{ display: hidden ? "none" : undefined, transform: isDragging ? undefined : CSS.Transform.toString(transform), transition: isDragging ? undefined : transition }}
    onClick={onSelect} onDragStart={(event) => event.preventDefault()} data-tier-item-id={data.itemId}
    aria-label={t("assignItem", { name })} aria-roledescription={t("draggableCard")} title={t("dragItem", { name })}>
    {children}
  </DragCard>
})
