"use client"

import type { ReactNode } from "react"
import { useDndContext, useDroppable } from "@dnd-kit/core"
import { SortableContext } from "@dnd-kit/sortable"
import { DragTarget } from "@boffmedia/ui"

export function TierListDropZone({ rowId, ids, label, children }: { rowId: string | null; ids: string[]; label: string; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id: rowId === null ? "source-pool" : `row-${rowId}`, data: { kind: "row", rowId, count: ids.length } })
  const { active, over } = useDndContext()
  return <DragTarget ref={setNodeRef} role="group" aria-label={label} data-tier-row={rowId ?? "source"}
    dragging={!!active} active={!!active && over?.data.current?.rowId === rowId}>
    <SortableContext items={ids} strategy={() => null}>{children}</SortableContext>
  </DragTarget>
}
