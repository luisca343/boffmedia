"use client"

import { memo, useCallback, type ReactNode } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DragCard, Icon } from "@boffmedia/ui"
import { useTierListT } from "../i18n"
import type { TierListDragItem } from "./actions"

export const TierListDraggableItem = memo(function TierListDraggableItem({ id, data, name, hidden = false, lockedTo, assigned = false, onSelect, children }: {
  id: string; data: TierListDragItem; name: string; hidden?: boolean; lockedTo?: string; assigned?: boolean; onSelect: () => void; children: ReactNode
}) {
  const t = useTierListT()
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging, isOver } = useSortable({ id, data, disabled: { draggable: !!lockedTo, droppable: false }, animateLayoutChanges: () => false })
  const ref = useCallback((node: HTMLButtonElement | null) => { setNodeRef(node); setActivatorNodeRef(node) }, [setNodeRef, setActivatorNodeRef])
  const status = lockedTo ? t("lockedTo", { row: lockedTo }) : assigned ? t("assigned") : undefined
  return <DragCard ref={ref} {...(!lockedTo ? attributes : {})} {...listeners} showGrip={false} dragDisabled={!!lockedTo} dragging={isDragging} dropTarget={isOver && !isDragging}
    status={status && <span aria-label={status} title={status}><Icon name={lockedTo ? "lock" : "check"} size={14} /></span>}
    style={{ display: hidden ? "none" : undefined, transform: isDragging ? undefined : CSS.Transform.toString(transform), transition: isDragging ? undefined : transition }}
    onClick={onSelect} onDragStart={(event) => event.preventDefault()} data-tier-item-id={data.itemId}
    aria-label={t("assignItem", { name })} aria-roledescription={lockedTo ? undefined : t("draggableCard")} title={lockedTo ? status : t("dragItem", { name })}>
    {children}
  </DragCard>
})
