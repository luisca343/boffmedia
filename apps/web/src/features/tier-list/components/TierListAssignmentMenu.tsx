"use client"

import type { ReactNode } from "react"
import { Button, Checkbox, Icon, Modal } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { getRows, type TierListAction } from "../core/engine"
import type { TierListDocument, TierListItem } from "../core/schema"
import { TierListItemVisual } from "./TierListItemVisual"

export interface TierListItemContext { item: TierListItem; rowId: string | null; placementId?: string; index: number }

export function TierListAssignmentMenu({ context, document: doc, onAction, onClose, actions }: {
  context: TierListItemContext | null; document: TierListDocument; onAction: (action: TierListAction) => void; onClose: (targetRowId?: string | null) => void
  actions?: (context: TierListItemContext) => ReactNode
}) {
  const t = useTranslations("tierLists")
  if (!context) return null
  const rows = getRows(doc.template, doc.instance)
  const mode = doc.template.settings.placementMode
  const boundRow = context.item.fixedRowId ? rows.find((row) => row.id === context.item.fixedRowId) : undefined
  const availableRows = boundRow ? [boundRow] : rows
  const assignedRows = rows.filter((row) => (doc.instance.placements[row.id] ?? []).some((p) => p.itemId === context.item.id))
  const occurrenceIndex = context.rowId ? (doc.instance.placements[context.rowId] ?? []).findIndex((p) => p.id === context.placementId) : -1
  return <Modal open onClose={() => onClose()} title={context.item.name} size="sm">
    <div className="mb-4 flex items-start gap-3">
      <div className="w-16 shrink-0 overflow-hidden border border-line"><TierListItemVisual item={context.item} showLabel={false} /></div>
      <div className="grid min-w-0 gap-2 text-sm text-txt-muted">
        {context.item.description && <p>{context.item.description}</p>}
        <p role="status">{assignedRows.length ? t("assignedToRows", { rows: assignedRows.map((row) => row.label).join(", ") }) : t("notAssigned")}</p>
        <p className="text-xs">{t(mode === "multi" ? "multiHint" : "exclusiveHint")}</p>
      </div>
    </div>
    {boundRow && <p className="mb-4 flex items-start gap-2 border border-line bg-panel-2 p-3 text-sm text-txt-muted"><Icon name="lock" size={16} className="shrink-0" />{t("fixedItemHint", { row: boundRow.label })}</p>}
    <p className="mb-3 text-sm text-txt-muted">{t("assignTo")}</p>
    <div className="grid gap-3" role={mode === "exclusive" ? "radiogroup" : "group"} aria-label={t("assignTo")}>
      {availableRows.map((row) => {
        const assigned = (doc.instance.placements[row.id] ?? []).some((p) => p.itemId === context.item.id)
        const change = (checked: boolean) => {
          onAction(checked ? { type: "assign", itemId: context.item.id, rowId: row.id } : { type: "remove", itemId: context.item.id, rowId: row.id })
          if (mode === "exclusive") onClose(row.id)
        }
        return <div key={row.id} className={`flex min-h-12 items-center gap-3 border p-3 ${assigned ? "border-accent bg-accent-soft" : "border-line bg-panel"}`}>
          <span aria-hidden="true" className="h-7 w-1 shrink-0" style={{ backgroundColor: row.color ?? "#808080" }} />
          {mode === "multi" ? <Checkbox checked={assigned} disabled={!!boundRow} onChange={change} label={row.label} /> :
            <label className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm">
              <input type="radio" name={`assignment-${doc.instance.id}`} checked={assigned} disabled={!!boundRow} onChange={() => change(true)} className="accent-accent focus-visible:outline-accent" /><span className="break-words">{row.label}</span>
            </label>}
          {assigned && !context.item.fixedRowId && doc.template.settings.allowDuplicateWithinRow && <Button type="button" size="sm" onClick={() => onAction({ type: "assign", rowId: row.id, itemId: context.item.id })}>{t("addAnother")}</Button>}
        </div>
      })}
    </div>
    <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
      {context.rowId && occurrenceIndex >= 0 && <>
        {doc.template.settings.allowItemReordering && <>
          <Button type="button" size="sm" disabled={occurrenceIndex === 0} onClick={() => onAction({ type: "reorderItem", rowId: context.rowId!, from: occurrenceIndex, to: occurrenceIndex - 1 })}>{t("earlier")}</Button>
          <Button type="button" size="sm" disabled={occurrenceIndex >= (doc.instance.placements[context.rowId]?.length ?? 0) - 1} onClick={() => onAction({ type: "reorderItem", rowId: context.rowId!, from: occurrenceIndex, to: occurrenceIndex + 1 })}>{t("later")}</Button>
        </>}
        {!context.item.fixedRowId && <Button type="button" size="sm" onClick={() => { onAction({ type: "remove", rowId: context.rowId!, placementId: context.placementId }); onClose(null) }}>{t("removeAssignment")}</Button>}
      </>}
      {!context.item.fixedRowId && <Button type="button" size="sm" variant="ghost" disabled={!assignedRows.length} onClick={() => { onAction({ type: "unassign", itemId: context.item.id }); onClose(null) }}>{t("unassign")}</Button>}
      <Button type="button" size="sm" variant="pri" onClick={() => onClose()}>{t("done")}</Button>
    </div>
    {actions?.(context)}
  </Modal>
}
