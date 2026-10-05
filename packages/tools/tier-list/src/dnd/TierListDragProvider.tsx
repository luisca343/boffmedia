"use client"

import { useCallback, useId, useRef, useState, type ReactNode } from "react"
import { DndContext, DragOverlay, KeyboardCode, KeyboardSensor, MeasuringStrategy, MouseSensor, TouchSensor, useSensor, useSensors, type CollisionDetection } from "@dnd-kit/core"
import { snapCenterToCursor } from "@dnd-kit/modifiers"
import { DragPreview } from "@boffmedia/ui"
import { useTierListT } from "../i18n"
import type { TierListAction } from "../core/engine"
import type { TierListDocument } from "../core/schema"
import { tierListMovementPreview, type TierListDragItem, type TierListDropTarget, type TierListMovementPreview } from "./actions"
import { tierListKeyboardCoordinates } from "./keyboard"

const collisions: CollisionDetection = (args) => {
  // Keyboard coordinates place the lifted card at the target's top-left. Hit
  // test its center, so wide empty rows remain reachable alongside small tiles.
  const point = args.pointerCoordinates ?? { x: args.collisionRect.left + args.collisionRect.width / 2, y: args.collisionRect.top + args.collisionRect.height / 2 }
  // Projection moves neighbors and hides the origin. Cached rectangles can still
  // hit that old origin and cancel a valid reorder, so use current DOM bounds.
  const visible = args.droppableContainers.flatMap((container) => {
    const rect = container.node.current?.getBoundingClientRect()
    return rect?.width && rect.height ? [{ container, rect }] : []
  })
  const hits = visible.filter(({ rect }) => point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom)
  const slot = hits.find(({ container }) => container.data.current?.preview)
  if (slot) return [{ id: slot.container.id }]
  const items = hits.filter(({ container }) => container.data.current?.kind === "item")
  if (items.length) return items.map(({ container }) => ({ id: container.id }))
  const row = hits.find(({ container }) => container.data.current?.kind === "row")
  // A small activation movement from a caption can enter the surrounding padding.
  // Treat that padding as its adjacent card, rather than immediately moving it last.
  const adjacent = row && visible.find(({ container, rect }) => !container.data.current?.preview &&
    container.data.current?.kind === "item" && container.data.current.rowId === row.container.data.current?.rowId &&
    point.x >= rect.left && point.x <= rect.right && point.y >= rect.top - 12 && point.y <= rect.bottom + 12)
  return adjacent ? [{ id: adjacent.container.id }] : row ? [{ id: row.container.id }] : []
}

export function TierListDragProvider({ document, onAction, onPreview, renderOverlay, children }: {
  document: TierListDocument; onAction: (action: TierListAction, active: TierListDragItem) => void
  onPreview: (preview: TierListMovementPreview | null) => void
  renderOverlay: (item: TierListDragItem) => ReactNode; children: ReactNode
}) {
  const id = useId()
  const t = useTierListT()
  const [active, setActive] = useState<TierListDragItem | null>(null)
  const origin = useRef<TierListDragItem | null>(null)
  const preview = useRef<TierListMovementPreview | null>(null)
  const hovered = useRef<TierListDropTarget | undefined>(undefined)
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const found = collisions(args)
    hovered.current = args.droppableContainers.find((container) => container.id === found[0]?.id)?.data.current as TierListDropTarget | undefined
    return found
  }, [])
  const updatePreview = () => {
    // dnd-kit's move event carries the previous `over`; use this render's hit
    // test instead, otherwise the gap lags behind the pointer/keyboard cursor.
    const target = hovered.current
    const next = origin.current && target ? tierListMovementPreview(document, origin.current, target, `preview-${id}`) : null
    if (JSON.stringify(preview.current?.action) === JSON.stringify(next?.action)) return
    preview.current = next
    onPreview(next)
  }
  const clear = () => { setActive(null); origin.current = null; preview.current = null; onPreview(null) }
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: tierListKeyboardCoordinates,
      scrollBehavior: "auto",
      // Enter retains the native card click action; only Space picks it up.
      keyboardCodes: { start: [KeyboardCode.Space], cancel: [KeyboardCode.Esc], end: [KeyboardCode.Space, KeyboardCode.Enter] },
    }),
  )
  return <DndContext id={id} sensors={sensors} collisionDetection={collisionDetection} measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    accessibility={{
      screenReaderInstructions: { draggable: t("dragInstructions") },
      announcements: {
        onDragStart: () => t("dragStarted"), onDragOver: () => t("dragOver"),
        onDragEnd: () => t("dragEnded"), onDragCancel: () => t("dragCancelled"),
      },
    }}
    onDragStart={(e) => { origin.current = e.active.data.current as TierListDragItem ?? null; setActive(origin.current) }}
    // Layout changes can change `over` without any pointer/key movement. Updating
    // the projection only for sensor movement prevents recursive insertion loops.
    onDragMove={updatePreview}
    onDragCancel={clear}
    onDragEnd={(e) => {
      // Commit the arrangement actually previewed, exactly once. Outside drops cancel.
      const action = e.over ? preview.current?.action : null
      const dragged = origin.current
      clear()
      if (action && dragged) onAction(action, dragged)
    }}>
    {children}
    <DragOverlay zIndex={1000} dropAnimation={null} modifiers={[snapCenterToCursor]}>
      {active ? <DragPreview data-tier-drag-preview>{renderOverlay(active)}</DragPreview> : null}
    </DragOverlay>
  </DndContext>
}
