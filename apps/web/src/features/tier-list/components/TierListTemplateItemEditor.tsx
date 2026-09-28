"use client"

import { useId, useState } from "react"
import { Button, Field, Icon, Input } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import type { TierListItem } from "../core/schema"
import { TIER_LIST_IMAGE_TYPES } from "../adapters/images"
import { TierListItemVisual } from "./TierListItemVisual"

/** Compact, reusable item editor; its native fields stay mounted for form validation. */
export function TierListTemplateItemEditor({ item, onPatch, onRemove, onUpload }: {
  item: TierListItem; onPatch: (patch: Partial<TierListItem>) => void; onRemove: () => void
  onUpload?: (file: File) => Promise<void>
}) {
  const t = useTranslations("tierLists")
  const [open, setOpen] = useState(!item.image)
  const panelId = useId()
  return <div className="min-w-0 border border-line bg-panel" data-tier-item-editor>
    <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}
      className="flex w-full items-center gap-3 p-3 text-left hover:bg-panel-2 focus-visible:outline focus-visible:outline-accent">
      <span className="block w-10 shrink-0"><TierListItemVisual item={item} showLabel={false} /></span>
      <span className="min-w-0 flex-1 break-words text-sm font-semibold">{item.name || t("newItem")}</span>
      {item.fixedRowId && <Icon name="lock" size={14} />}
      <Icon name="chevronDown" size={16} className={open ? "rotate-180" : undefined} />
    </button>
    <div id={panelId} hidden={!open} className={`${open ? "grid" : "hidden"} min-w-0 gap-3 border-t border-line p-3 sm:grid-cols-2`} onInvalidCapture={(event) => {
      if (open) return
      event.preventDefault()
      const input = event.target as HTMLInputElement
      setOpen(true)
      requestAnimationFrame(() => input.focus())
    }}>
      <Field label={t("itemName")}><Input required maxLength={200} value={item.name} onChange={(e) => onPatch({ name: e.target.value })} /></Field>
      <Field label={t("imageUrl")}><Input maxLength={2048} value={item.image ?? ""} onChange={(e) => onPatch({ image: e.target.value || undefined })} /></Field>
      <Field label={t("description")}><Input maxLength={2000} value={item.description ?? ""} onChange={(e) => onPatch({ description: e.target.value })} /></Field>
      <div className="flex min-w-0 flex-wrap items-end gap-2">
        {onUpload && <Field label={t("uploadImage")}><Input type="file" accept={TIER_LIST_IMAGE_TYPES.join(",")} onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) void onUpload(file)
        }} /></Field>}
        <Button type="button" size="sm" variant="ghost" aria-label={t("deleteItem", { name: item.name })} onClick={onRemove}>{t("remove")}</Button>
      </div>
    </div>
  </div>
}
