"use client"

import { useState } from "react"
import { Button, Checkbox, ColorInput, ConfirmDialog, Field, Input, Panel, Select, Textarea } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { newTierListId } from "../core/engine"
import { LIMITS, tierListTemplateSchema, type TierListItem, type TierListSettings, type TierListTemplate, type TierListVisibility } from "../core/schema"
import { TIER_LIST_IMAGE_TYPES, uploadTierListImage, type TierListImageStorageAdapter } from "../adapters/images"
import { TierListItemVisual } from "./TierListItemVisual"

const PERMISSIONS = ["allowDuplicateWithinRow", "allowRowEditing", "allowRowReordering", "allowRowCreation", "allowRowDeletion", "allowItemReordering"] as const

export function TierListTemplateEditor({ template, onSave, imageStorage, sources = [], busy = false }: {
  template: TierListTemplate; onSave: (template: TierListTemplate) => Promise<void>
  imageStorage?: TierListImageStorageAdapter; sources?: { key: string; label: string }[]; busy?: boolean
}) {
  const t = useTranslations("tierLists")
  const [draft, setDraft] = useState(template)
  const [error, setError] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [pending, setPending] = useState<(() => void) | null>(null)
  const [saving, setSaving] = useState(false)
  const customItems = draft.source.type === "reference" ? null : draft.source.items
  const setItems = (items: TierListItem[]) => setDraft({ ...draft, source: { type: "custom", items } })
  const patchItem = (id: string, patch: Partial<TierListItem>) => setDraft((prev) => prev.source.type === "reference" ? prev : {
    ...prev, source: { type: "custom", items: prev.source.items.map((i) => i.id === id ? { ...i, ...patch } : i) },
  })
  const setting = (key: keyof TierListSettings, value: boolean) => setDraft({ ...draft, settings: { ...draft.settings, [key]: value } })
  const reorderRow = (from: number, to: number) => {
    const rows = [...draft.rows]
    rows.splice(to, 0, rows.splice(from, 1)[0])
    setDraft({ ...draft, rows })
  }
  return <form className="grid gap-6" onSubmit={async (e) => {
    e.preventDefault()
    const parsed = tierListTemplateSchema.safeParse(draft)
    if (!parsed.success) { setError(true); return }
    setSaving(true); setError(false)
    try { await onSave(parsed.data) } catch { setError(true) } finally { setSaving(false) }
  }}>
    <fieldset disabled={busy || saving || !!uploading} className="grid min-w-0 gap-6">
      <Panel title={t("templateDetails")} bodyClassName="grid gap-4">
        <Field label={t("title")}><Input required maxLength={200} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
        <Field label={t("description")}><Textarea maxLength={2000} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
        <Select label={t("visibility")} hint={t("visibilityHint")} value={draft.visibility} onChange={(v) => setDraft({ ...draft, visibility: v as TierListVisibility })} options={[
          { value: "private", label: t("private") }, { value: "unlisted", label: t("unlisted") }, { value: "public", label: t("public") },
        ]} />
      </Panel>
      <Panel title={t("behavior")} bodyClassName="grid gap-4">
        <Select label={t("placementMode")} value={draft.settings.placementMode} onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, placementMode: v as "exclusive" | "multi" } })} options={[
          { value: "exclusive", label: t("exclusive") }, { value: "multi", label: t("multi") },
        ]} />
        <Checkbox label={t("keepSourceVisible")} checked={draft.settings.keepSourceVisible} onChange={(v) => setting("keepSourceVisible", v)} />
        {PERMISSIONS.map((key) => <Checkbox key={key} label={t(`settings.${key}`)} checked={draft.settings[key]} onChange={(v) => setting(key, v)} />)}
      </Panel>
      <Panel title={t("rows")} bodyClassName="grid gap-4">
        {draft.rows.map((row, index) => <div key={row.id} className="grid gap-3 border-b border-line pb-4 sm:grid-cols-[1fr_9rem_auto]">
          <Field label={t("rowLabel")}><Input required maxLength={200} value={row.label} onChange={(e) => setDraft({ ...draft, rows: draft.rows.map((r) => r.id === row.id ? { ...r, label: e.target.value } : r) })} /></Field>
          <Field label={t("rowColor")}><ColorInput value={row.color ?? "#808080"} onChange={(e) => setDraft({ ...draft, rows: draft.rows.map((r) => r.id === row.id ? { ...r, color: e.target.value } : r) })} /></Field>
          <div className="flex flex-wrap items-end gap-1">
            <Button size="sm" type="button" disabled={!index} aria-label={t("moveRowUp", { label: row.label })} onClick={() => reorderRow(index, index - 1)}>{t("up")}</Button>
            <Button size="sm" type="button" disabled={index === draft.rows.length - 1} aria-label={t("moveRowDown", { label: row.label })} onClick={() => reorderRow(index, index + 1)}>{t("down")}</Button>
            <Button size="sm" type="button" disabled={draft.rows.length === 1} aria-label={t("deleteNamedRow", { label: row.label })} onClick={() => setPending(() => () => setDraft({ ...draft, rows: draft.rows.filter((r) => r.id !== row.id) }))}>{t("deleteRow")}</Button>
          </div>
        </div>)}
        <Button type="button" disabled={draft.rows.length >= LIMITS.rows} onClick={() => setDraft({ ...draft, rows: [...draft.rows, { id: newTierListId(), label: t("newRow"), color: "#808080" }] })}>{t("addRow")}</Button>
      </Panel>
      <Panel title={t("items")} bodyClassName="grid gap-4">
        <Select label={t("dataSource")} value={draft.source.type === "reference" ? draft.source.key : "custom"} options={[
          { value: "custom", label: t("customItems") }, ...sources.map((s) => ({ value: s.key, label: s.label })),
        ]} onChange={(value) => {
          const change = () => setDraft({ ...draft, source: value === "custom" ? { type: "custom", items: [] } : { type: "reference", key: value } })
          if (customItems?.length) setPending(() => change); else change()
        }} />
        {customItems ? <>
          <p className="text-sm text-txt-muted">{t(imageStorage ? "uploadPrivacy" : "uploadSignIn")}</p>
          {customItems.map((item) => <div key={item.id} className="flex min-w-0 flex-wrap gap-3 border-b border-line pb-4">
            <div className="w-20 shrink-0"><TierListItemVisual item={item} /></div>
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <Field label={t("itemName")}><Input required maxLength={200} value={item.name} onChange={(e) => patchItem(item.id, { name: e.target.value })} /></Field>
              <Field label={t("imageUrl")}><Input maxLength={2048} value={item.image ?? ""} onChange={(e) => patchItem(item.id, { image: e.target.value || undefined })} /></Field>
              <Field label={t("description")}><Input maxLength={2000} value={item.description ?? ""} onChange={(e) => patchItem(item.id, { description: e.target.value })} /></Field>
              <div className="flex flex-wrap items-end gap-2">
                {imageStorage && <Field label={t("uploadImage")}><Input type="file" accept={TIER_LIST_IMAGE_TYPES.join(",")} onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ""
                  if (!file) return
                  setUploading(item.id); setError(false)
                  try { patchItem(item.id, { image: await uploadTierListImage(file, imageStorage) }) } catch { setError(true) } finally { setUploading(null) }
                }} /></Field>}
                <Button type="button" size="sm" aria-label={t("deleteItem", { name: item.name })} onClick={() => setPending(() => () => setItems(customItems.filter((i) => i.id !== item.id)))}>{t("remove")}</Button>
              </div>
            </div>
          </div>)}
          <Button type="button" disabled={customItems.length >= LIMITS.items} onClick={() => setItems([...customItems, { id: newTierListId(), name: t("newItem") }])}>{t("addItem")}</Button>
        </> : <p className="text-sm text-txt-muted">{t("referenceHint")}</p>}
      </Panel>
      {error && <p role="alert" className="text-sm text-bad">{t("editorError")}</p>}
      <div><Button variant="pri" type="submit" disabled={!!uploading} loading={saving}>{t("saveTemplate")}</Button></div>
    </fieldset>
    <ConfirmDialog open={!!pending} title={t("confirmTitle")} body={t("confirmBody")} onClose={() => setPending(null)} onConfirm={() => { pending?.(); setPending(null) }} />
  </form>
}
