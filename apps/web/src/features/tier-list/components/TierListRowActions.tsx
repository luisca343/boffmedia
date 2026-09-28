"use client"

import { IconButton, Menu, type MenuItem } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import type { TierListAction } from "../core/engine"
import type { TierListRow, TierListTemplate } from "../core/schema"

/** Row behavior stays in the feature; controls reuse the shared compact chassis. */
export function TierListRowActions({ row, index, rowCount, itemCount, hasFixedItems, settings, onEdit, onAction, onConfirm }: {
  row: TierListRow; index: number; rowCount: number; itemCount: number; hasFixedItems: boolean
  settings: TierListTemplate["settings"]
  onEdit: () => void; onAction: (action: TierListAction) => void; onConfirm: (action: TierListAction) => void
}) {
  const t = useTranslations("tierLists")
  const items: MenuItem[] = [
    ...(settings.allowRowEditing ? [{ icon: "edit" as const, label: t("editNamedRow", { label: row.label }), onSelect: onEdit }, { sep: true }] : []),
    { icon: "x", label: t("clearNamedRow", { label: row.label }), disabled: !itemCount, onSelect: () => onConfirm({ type: "clearRow", rowId: row.id }) },
    ...(settings.allowRowDeletion ? [{ icon: "trash" as const, label: t("deleteNamedRow", { label: row.label }), danger: true, disabled: rowCount === 1 || hasFixedItems, onSelect: () => onConfirm({ type: "deleteRow", rowId: row.id }) }] : []),
  ]
  return <div className="grid shrink-0 grid-cols-1 content-center gap-0.5 border-l border-line/50 p-1" data-tier-row-controls>
    <Menu iconOnly icon="settings" size="sm" variant="ghost" align="end" ariaLabel={t("rowOptions", { label: row.label })} items={items} />
    {settings.allowRowReordering && <>
      <IconButton type="button" name="arrowUp" size="sm" variant="ghost" label={t("moveRowUp", { label: row.label })} disabled={index === 0} onClick={() => onAction({ type: "reorderRow", from: index, to: index - 1 })} />
      <IconButton type="button" name="arrowDown" size="sm" variant="ghost" label={t("moveRowDown", { label: row.label })} disabled={index === rowCount - 1} onClick={() => onAction({ type: "reorderRow", from: index, to: index + 1 })} />
    </>}
  </div>
}
