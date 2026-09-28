"use client"

import { useRef, useState } from "react"
import { Button, ConfirmDialog } from "@boffmedia/ui"
import { webSaveFile } from "@boffmedia/tool-kit"
import { useTranslations } from "next-intl"
import type { TierListDocument } from "../core/schema"
import type { TierListHistoryAction } from "../core/history"
import { exportTierListDocument, importTierListFile } from "../serialization/document"

export function TierListToolbar({ document: doc, dispatch, canUndo, canRedo, onImport, getPresentation, onEditHeading }: {
  document: TierListDocument; dispatch: (action: TierListHistoryAction) => void; canUndo: boolean; canRedo: boolean
  onImport: (doc: TierListDocument) => Promise<void>
  getPresentation: () => HTMLElement | null
  onEditHeading: () => void
}) {
  const t = useTranslations("tierLists")
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<"clear" | "reset" | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<"fileError" | "imageError" | null>(null)
  const run = async (job: () => Promise<unknown>, errorKey: "fileError" | "imageError" = "fileError") => {
    setBusy(true); setError(null)
    try { await job() } catch { setError(errorKey) } finally { setBusy(false) }
  }
  return <div className="grid gap-2">
    <div className="flex flex-wrap gap-2">
      <Button size="sm" icon="edit" onClick={onEditHeading}>{t("editHeading")}</Button>
      <Button size="sm" disabled={!canUndo} onClick={() => dispatch({ type: "undo" })}>{t("undo")}</Button>
      <Button size="sm" disabled={!canRedo} onClick={() => dispatch({ type: "redo" })}>{t("redo")}</Button>
      <Button size="sm" onClick={() => setPending("clear")}>{t("clearAll")}</Button>
      <Button size="sm" onClick={() => setPending("reset")}>{t("reset")}</Button>
      <Button size="sm" disabled={busy} onClick={() => void run(() => webSaveFile({ suggestedName: `${doc.template.slug}.json`, mimeType: "application/json", data: new TextEncoder().encode(exportTierListDocument(doc)) }))}>{t("exportJson")}</Button>
      <Button size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>{t("importJson")}</Button>
      <Button size="sm" disabled={busy} onClick={() => void run(async () => {
        const { exportTierListImage } = await import("../serialization/image")
        const presentation = getPresentation()
        if (!presentation) throw new Error("Export region is unavailable")
        return webSaveFile({ suggestedName: `${doc.template.slug}.png`, mimeType: "image/png", data: await exportTierListImage(presentation) })
      }, "imageError")}>{t("exportImage")}</Button>
      <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0]; e.target.value = ""
        if (file) void run(async () => onImport(await importTierListFile(file)))
      }} />
    </div>
    {busy && <p role="status" className="text-sm text-txt-muted">{t("working")}</p>}
    {error && <p role="alert" className="text-sm text-bad">{t(error)}</p>}
    <ConfirmDialog open={!!pending} title={t("confirmTitle")} body={t("confirmBody")} onClose={() => setPending(null)} onConfirm={() => { if (pending) dispatch({ type: pending }); setPending(null) }} />
  </div>
}
