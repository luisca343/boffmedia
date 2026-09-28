"use client"

import { Fragment, useCallback, useMemo, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react"
import { Button, ConfirmDialog } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { applyTierListAction, assignedItemIds, getRows, getTierListTitle, newTierListId, type TierListAction } from "../core/engine"
import { LIMITS, type TierListDocument, type TierListInstance, type TierListItem, type TierListRow, type TierListTemplate } from "../core/schema"
import { TierListDragProvider } from "../dnd/TierListDragProvider"
import { TierListDropZone } from "../dnd/TierListDropZone"
import { TierListDraggableItem } from "../dnd/TierListDraggableItem"
import { TierListPlacementPreview } from "../dnd/TierListPlacementPreview"
import type { TierListMovementPreview } from "../dnd/actions"
import { TierListAssignmentMenu, type TierListItemContext } from "./TierListAssignmentMenu"
import { TierListItemVisual } from "./TierListItemVisual"
import { TierListRowEditor } from "./TierListRowEditor"
import { TierListRowActions } from "./TierListRowActions"
import { TierListRowHeader } from "./TierListRowHeader"
import { TierListInstructions } from "./TierListInstructions"
import { TierListSourcePanel } from "./TierListSourcePanel"
import { defaultTierListDisplay, type TierListDisplayOptions } from "../display"

export interface TierListProps {
  template: TierListTemplate; instance: TierListInstance; items: TierListItem[]
  onChange: (instance: TierListInstance, action: TierListAction) => void
  renderItem?: (context: TierListItemContext) => ReactNode
  renderRowHeader?: (row: TierListRow, count: number) => ReactNode
  itemActions?: (context: TierListItemContext) => ReactNode
  sourceControls?: ReactNode
  summary?: (document: TierListDocument) => ReactNode
  filterItem?: (item: TierListItem) => boolean
  display?: Partial<TierListDisplayOptions>
  heading?: ReactNode
  presentationRef?: Ref<HTMLDivElement>
}

export function rowTextColor(color: string) {
  const rgb = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255)
  const [r, g, b] = rgb.map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#111111" : "#ffffff"
}

/** Controlled embeddable board. Persistence and history belong to the consuming host. */
export function TierList({ template, instance, items, onChange, renderItem, renderRowHeader, itemActions, sourceControls, summary, filterItem, display, heading, presentationRef }: TierListProps) {
  const t = useTranslations("tierLists")
  const view = { ...defaultTierListDisplay, ...display }
  const boardRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState(template.settings.keepSourceVisible ? "all" : "unassigned")
  const [selected, setSelected] = useState<TierListItemContext | null>(null)
  const [editingRow, setEditingRow] = useState<TierListRow | null>(null)
  const [confirmAction, setConfirmAction] = useState<TierListAction | null>(null)
  const [movement, setMovement] = useState<TierListMovementPreview | null>(null)
  const doc = useMemo<TierListDocument>(() => ({ schemaVersion: 1, template, instance, items }), [template, instance, items])
  const rows = getRows(template, instance)
  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const assigned = useMemo(() => assignedItemIds(instance), [instance])
  const available = useMemo(() => items.filter((item) => !item.fixedRowId && (!filterItem || filterItem(item))), [items, filterItem])
  // Filter the full collection. The source-visibility rule chooses the default
  // view, while explicit All/Assigned must still recover already ranked items.
  const pool = useMemo(() => available.filter((i) =>
    i.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) &&
    (filter === "all" || (filter === "assigned" ? assigned.has(i.id) : !assigned.has(i.id))),
  ), [available, search, filter, assigned])
  const act = useCallback((action: TierListAction) => {
    const next = applyTierListAction(doc, action)
    if (next !== doc) onChange(next.instance, action)
  }, [doc, onChange])
  const visual = (context: TierListItemContext) => renderItem ? renderItem(context) : <TierListItemVisual item={context.item} showLabel={view.itemLabels} />
  const displayed = movement?.instance ?? instance
  const movingPlacementId = movement && (movement.action.type !== "assign" || template.settings.placementMode === "exclusive") ? movement.active.placementId : undefined
  const returningItem = movement?.target.rowId === null ? itemMap.get(movement.active.itemId) : undefined
  const closeAssignment = (targetRowId?: string | null) => {
    const itemId = selected?.item.id
    setSelected(null)
    // An exclusive move may unmount the button that opened the dialog.
    requestAnimationFrame(() => {
      const buttons = boardRef.current?.querySelectorAll<HTMLButtonElement>("button[data-tier-item-id]")
      const matches = buttons && Array.from(buttons).filter((button) => button.dataset.tierItemId === itemId)
      const target = targetRowId === null ? "source" : targetRowId ?? selected?.rowId ?? "source"
      const button = matches?.find((button) => button.closest<HTMLElement>("[data-tier-row]")?.dataset.tierRow === target) ?? matches?.[0]
      // Returning to a filtered pool may hide every occurrence; retain a useful focus target.
      if (button) button.focus({ preventScroll: true })
      else boardRef.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true })
    })
  }
  return <div ref={boardRef} className="grid min-w-0 gap-5" style={{ "--drag-card-size": "6rem" } as CSSProperties} data-tier-list>
    <TierListInstructions mode={template.settings.placementMode} hasFixedItems={items.some((item) => !!item.fixedRowId)} />
    <TierListDragProvider document={doc} onAction={(action, active) => {
      act(action)
      // Exclusive moves replace the original occurrence. Keep keyboard focus
      // on the resulting card rather than the detached drag activator.
      requestAnimationFrame(() => {
        const target = action.type === "assign" || action.type === "reorderItem" ? action.rowId : "source"
        const buttons = boardRef.current?.querySelectorAll<HTMLButtonElement>("button[data-tier-item-id]")
        if (buttons) Array.from(buttons).find((button) => button.dataset.tierItemId === active.itemId && button.closest<HTMLElement>("[data-tier-row]")?.dataset.tierRow === target)?.focus({ preventScroll: true })
      })
    }} onPreview={setMovement} renderOverlay={(active) => {
      const item = itemMap.get(active.itemId)
      return item ? visual({ item, rowId: active.rowId, index: active.index, placementId: active.placementId }) : null
    }}>
      <div ref={presentationRef} data-tier-presentation className="min-w-0 overflow-hidden border border-line bg-panel">
        {heading && <div className="border-b border-line px-4 py-4 sm:px-5">{heading}</div>}
        <div aria-label={getTierListTitle(template, instance)}>
        {rows.map((row, rowIndex) => {
          const committed = instance.placements[row.id] ?? []
          const placements = displayed.placements[row.id] ?? []
          // Keep the active node mounted even when the projected move removes it.
          const origin = committed.find((p) => p.id === movingPlacementId)
          const rendered = origin && !placements.some((p) => p.id === origin.id) ? [...placements, origin] : placements
          const color = row.color ?? "#808080"
          return <section key={row.id} className="flex min-w-0 flex-col border-b border-line last:border-b-0 sm:flex-row" aria-label={row.label}>
            <div data-tier-row-label className="flex shrink-0 items-center justify-center px-3 py-3 sm:w-32" style={{ backgroundColor: color, color: rowTextColor(color) }}>
              {renderRowHeader ? renderRowHeader(row, placements.length) : <TierListRowHeader row={row} count={placements.length} display={view} />}
            </div>
            <div className="flex min-w-0 flex-1">
              <TierListDropZone rowId={row.id} ids={placements.map((p) => `placement-${p.id}`)} label={row.label}>
                {rendered.map((placement, index) => {
                  const item = itemMap.get(placement.itemId)
                  if (!item) return null
                  const context = { item, rowId: row.id, placementId: placement.id, index }
                  const previewSlot = !!movement && (placement.id === movement.placeholderId || (placement.id === movingPlacementId && placements.includes(placement)))
                  const originalIndex = committed.findIndex((p) => p.id === placement.id)
                  return <Fragment key={placement.id}>
                    {placement.id !== movement?.placeholderId && <TierListDraggableItem id={`placement-${placement.id}`} name={item.name} hidden={placement.id === movingPlacementId} lockedTo={item.fixedRowId ? row.label : undefined}
                      data={{ kind: "item", itemId: item.id, rowId: row.id, index: originalIndex, placementId: placement.id }} onSelect={() => setSelected(context)}>
                      {visual(context)}
                    </TierListDraggableItem>}
                    {previewSlot && <TierListPlacementPreview target={movement.target} itemId={item.id}>{visual(context)}</TierListPlacementPreview>}
                  </Fragment>
                })}
                {!placements.length && view.rowControls && <span className="self-center py-5 text-xs text-txt-dim">{t("emptyRow")}</span>}
              </TierListDropZone>
              {view.rowControls && <TierListRowActions row={row} index={rowIndex} rowCount={rows.length}
                itemCount={committed.filter((placement) => !itemMap.get(placement.itemId)?.fixedRowId).length}
                hasFixedItems={committed.some((placement) => itemMap.get(placement.itemId)?.fixedRowId === row.id)} settings={template.settings}
                onEdit={() => setEditingRow(row)} onAction={act} onConfirm={setConfirmAction} />}
            </div>
          </section>
        })}
        </div>
      </div>
      {view.rowControls && template.settings.allowRowCreation && <div><Button type="button" size="sm" disabled={rows.length >= LIMITS.rows} onClick={() => act({ type: "addRow", row: { id: newTierListId(), label: t("newRow"), color: "#808080" } })}>{t("addRow")}</Button></div>}
      <TierListSourcePanel search={search} onSearch={setSearch} filter={filter} onFilter={setFilter}
        shown={pool.length} total={available.length} assigned={available.filter((item) => assigned.has(item.id)).length} controls={sourceControls}>
        <TierListDropZone rowId={null} ids={pool.map((i) => `source-${i.id}`)} label={t("sourcePool")}>
          {pool.map((item, index) => {
            const context = { item, rowId: null, index }
            return <Fragment key={item.id}>
              <TierListDraggableItem id={`source-${item.id}`} name={item.name} assigned={assigned.has(item.id)} hidden={returningItem?.id === item.id} data={{ kind: "item", itemId: item.id, rowId: null, index }} onSelect={() => setSelected(context)}>{visual(context)}</TierListDraggableItem>
              {returningItem?.id === item.id && movement && <TierListPlacementPreview target={movement.target} itemId={item.id}>{visual(context)}</TierListPlacementPreview>}
            </Fragment>
          })}
          {returningItem && movement && !pool.some((item) => item.id === returningItem.id) && <TierListPlacementPreview target={movement.target} itemId={returningItem.id}>{visual({ item: returningItem, rowId: null, index: pool.length })}</TierListPlacementPreview>}
        </TierListDropZone>
      </TierListSourcePanel>
    </TierListDragProvider>
    {summary?.(doc)}
    <TierListAssignmentMenu context={selected} document={doc} onAction={act} onClose={closeAssignment} actions={itemActions} />
    {editingRow && <TierListRowEditor key={editingRow.id} row={editingRow} onClose={() => setEditingRow(null)} onSave={(row) => act({ type: "editRow", rowId: row.id, patch: { label: row.label, color: row.color, description: row.description, icon: row.icon } })} />}
    <ConfirmDialog open={!!confirmAction} title={t(confirmAction?.type === "deleteRow" ? "deleteRow" : "clearRow")} body={t(confirmAction?.type === "deleteRow" ? "deleteRowBody" : "clearRowBody")} onClose={() => setConfirmAction(null)} onConfirm={() => { if (confirmAction) act(confirmAction); setConfirmAction(null) }} />
  </div>
}
