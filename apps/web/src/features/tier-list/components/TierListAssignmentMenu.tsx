"use client"

import type { ReactNode } from "react"
import { Button, Checkbox, Modal } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { getRows, type TierListAction } from "../core/engine"
import type { TierListDocument, TierListItem } from "../core/schema"

export interface TierListItemContext { item: TierListItem; rowId: string | null; placementId?: string; index: number }

export function TierListAssignmentMenu({ context, document: doc, onAction, onClose, actions }: {
  context: TierListItemContext | null; document: TierListDocument; onAction: (action: TierListAction) => void; onClose: () => void
  actions?: (context: TierListItemContext) => ReactNode
}) {
  const t = useTranslations("tierLists")
  if (!context) return null
  const rows = getRows(doc.template, doc.instance)
  const mode = doc.template.settings.placementMode
  const boundRow = context.item.fixedRowId ? rows.find((row) => row.id === context.item.fixedRowId) : undefined
  const availableRows = boundRow ? [boundRow] : rows
  const occurrenceIndex = context.rowId ? (doc.instance.placements[context.rowId] ?? []).findIndex((p) => p.id === context.placementId) : -1
  return <Modal open onClose={onClose} title={context.item.name} size="sm">
    {context.item.description && <p className="mb-4 text-sm text-txt-muted">{context.item.description}</p>}
    <p className="mb-3 text-xs text-txt-dim">{t(mode === "multi" ? "multiHint" : "exclusiveHint")}</p>
    {boundRow && <p className="mb-3 text-sm text-txt-muted">{t("fixedItemHint", { row: boundRow.label })}</p>}
    <p className="mb-3 text-sm text-txt-muted">{t("assignTo")}</p>
    <div className="grid gap-3" role={mode === "exclusive" ? "radiogroup" : "group"} aria-label={t("assignTo")}>
      {availableRows.map((row) => {
        const assigned = (doc.instance.placements[row.id] ?? []).some((p) => p.itemId === context.item.id)
        const change = (checked: boolean) => {
          onAction(checked ? { type: "assign", itemId: context.item.id, rowId: row.id } : { type: "remove", itemId: context.item.id, rowId: row.id })
          if (mode === "exclusive") onClose()
        }
        return <div key={row.id} className="flex items-center justify-between gap-2">
          {mode === "multi" ? <Checkbox checked={assigned} disabled={!!boundRow} onChange={change} label={row.label} /> :
            <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
              <input type="radio" name={`assignment-${doc.instance.id}`} checked={assigned} onChange={() => change(true)} className="accent-accent focus-visible:outline-accent" />{row.label}
            </label>}
          {assigned && !context.item.fixedRowId && doc.template.settings.allowDuplicateWithinRow && <Button size="sm" onClick={() => onAction({ type: "assign", rowId: row.id, itemId: context.item.id })}>{t("addAnother")}</Button>}
        </div>
      })}
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {context.rowId && occurrenceIndex >= 0 && <>
        {doc.template.settings.allowItemReordering && <>
          <Button size="sm" disabled={occurrenceIndex === 0} onClick={() => onAction({ type: "reorderItem", rowId: context.rowId!, from: occurrenceIndex, to: occurrenceIndex - 1 })}>{t("earlier")}</Button>
          <Button size="sm" disabled={occurrenceIndex >= (doc.instance.placements[context.rowId]?.length ?? 0) - 1} onClick={() => onAction({ type: "reorderItem", rowId: context.rowId!, from: occurrenceIndex, to: occurrenceIndex + 1 })}>{t("later")}</Button>
        </>}
        {!context.item.fixedRowId && <Button size="sm" onClick={() => { onAction({ type: "remove", rowId: context.rowId!, placementId: context.placementId }); onClose() }}>{t("removeAssignment")}</Button>}
      </>}
      {!context.item.fixedRowId && <Button size="sm" onClick={() => { onAction({ type: "unassign", itemId: context.item.id }); onClose() }}>{t("unassign")}</Button>}
    </div>
    {actions?.(context)}
  </Modal>
}
