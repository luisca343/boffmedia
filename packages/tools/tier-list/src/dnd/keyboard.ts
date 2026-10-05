import { closestCorners, getFirstCollision, type KeyboardCoordinateGetter } from "@dnd-kit/core"

/** Navigate tiles and empty rows. Skip the current containing row, whose padded
 * top edge would otherwise swallow the first Up key from its first tile. */
export const tierListKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const { active, collisionRect, droppableContainers, droppableRects, over } = context
  if (!active || !collisionRect || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) return
  event.preventDefault()
  const currentRow = over?.data.current ? over.data.current.rowId : active.data.current?.rowId ?? null
  const candidates = droppableContainers.getEnabled().filter((entry) => {
    if (entry.id === active.id || entry.data.current?.preview || (entry.data.current?.kind === "row" && entry.data.current?.rowId === currentRow)) return false
    const rect = droppableRects.get(entry.id)
    if (!rect) return false
    // The tilted/scaled overlay extends beyond a tile. Compare centers with a
    // half-tile tolerance so an aligned neighbor never counts as above/below.
    const y = rect.top + rect.height / 2 - (collisionRect.top + collisionRect.height / 2)
    const x = rect.left + rect.width / 2 - (collisionRect.left + collisionRect.width / 2)
    if (event.code === "ArrowUp") return y < -Math.min(rect.height, collisionRect.height) / 2
    if (event.code === "ArrowDown") return y > Math.min(rect.height, collisionRect.height) / 2
    if (entry.data.current?.kind === "row") return false
    if (event.code === "ArrowLeft") return x < -Math.min(rect.width, collisionRect.width) / 2
    return x > Math.min(rect.width, collisionRect.width) / 2
  })
  const id = getFirstCollision(closestCorners({ active, collisionRect, droppableRects, droppableContainers: candidates, pointerCoordinates: null }), "id")
  const rect = id === null ? null : droppableRects.get(id)
  return rect ? { x: rect.left, y: rect.top } : undefined
}
