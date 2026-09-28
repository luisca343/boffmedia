"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, ConfirmDialog } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { cloneTemplate, createDocument, getTierListDescription, getTierListTitle, newTierListId } from "../core/engine"
import type { TierListDocument, TierListTemplate } from "../core/schema"
import { resolveTierListItems } from "../adapters/sources"
import { LocalStorageTierListAdapter } from "../persistence/adapters"
import { tierListSources } from "@/services/api/boffmedia/tierListSourcesService"
import { useTierList } from "../hooks/useTierList"
import { TierList } from "./TierList"
import { TierListToolbar } from "./TierListToolbar"
import { tierListHref } from "../routes"
import { withTierListStarterImages } from "../templates"
import { defaultTierListDisplay } from "../display"
import { TierListDisplayControls } from "./TierListDisplayControls"
import { TierListHeadingEditor } from "./TierListHeadingEditor"
import { TierListHeading } from "./TierListHeading"

function LoadedWorkspace({ initial, adapter }: { initial: TierListDocument; adapter: LocalStorageTierListAdapter }) {
  const t = useTranslations("tierLists")
  const router = useRouter()
  const state = useTierList(initial, adapter)
  const doc = withTierListStarterImages(state.document)
  const title = getTierListTitle(doc.template, doc.instance)
  const description = getTierListDescription(doc.template, doc.instance)
  const [recover, setRecover] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(false)
  const [display, setDisplay] = useState(defaultTierListDisplay)
  const [editingHeading, setEditingHeading] = useState(false)
  const presentationRef = useRef<HTMLDivElement>(null)
  const onChange = useCallback((_instance: unknown, action: Parameters<typeof state.dispatch>[0]) => state.dispatch(action), [state.dispatch])
  if (!state.loaded) return <div className="grid gap-3">
    <p role={state.loadFailed ? "alert" : "status"}>{t(state.loadFailed ? "storageLoadError" : "loading")}</p>
    {state.loadFailed && <Button onClick={() => setRecover(true)}>{t("recover")}</Button>}
    <ConfirmDialog open={recover} title={t("confirmTitle")} body={t("recoverBody")} onClose={() => setRecover(false)} onConfirm={() => void state.recoverLocal().then(() => setRecover(false)).catch(() => {})} />
  </div>
  return <div className="grid gap-6">
    <header className="grid gap-3">
      {!display.title && <h1 className="sr-only">{title}</h1>}
      <p className="font-mono text-xs uppercase tracking-wider text-accent">{t("localOnly")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span role="status" className={state.status === "error" ? "text-sm text-bad" : "text-sm text-txt-muted"}>{t(`status.${state.status}`)}</span>
        {state.status === "error" && <Button size="sm" onClick={state.retrySave}>{t("retry")}</Button>}
        <Button size="sm" href={tierListHref(doc, true)}>{t(doc.template.ownership?.type === "system" ? "remix" : "editTemplate")}</Button>
        <Button size="sm" disabled={creating} onClick={async () => {
          setCreating(true); setCreateError(false)
          try {
            // Use this definition snapshot, not another instance's older local copy.
            const next = createDocument(doc.template, doc.items)
            await adapter.save(next)
            router.push(tierListHref(next))
          } catch { setCreateError(true) } finally { setCreating(false) }
        }}>{t("newInstance")}</Button>
        <Button size="sm" href="/tier-lists">{t("back")}</Button>
      </div>
      {createError && <p role="alert" className="text-sm text-bad">{t("newInstanceError")}</p>}
    </header>
    <TierListToolbar document={doc} getPresentation={() => presentationRef.current} onEditHeading={() => setEditingHeading(true)} dispatch={state.dispatch} canUndo={state.canUndo} canRedo={state.canRedo} onImport={async (imported) => {
      // Import creates a new private local copy and never overwrites an existing list.
      const template = cloneTemplate(imported.template)
      const next: TierListDocument = { ...imported, template, instance: { ...imported.instance, id: newTierListId(), templateId: template.id, ownerId: undefined, visibility: "private", createdAt: undefined, updatedAt: undefined } }
      await adapter.save(next)
      router.push(tierListHref(next))
    }} />
    <TierListDisplayControls value={display} onChange={setDisplay} />
    <TierList template={doc.template} instance={doc.instance} items={doc.items} onChange={onChange}
      display={display} presentationRef={presentationRef} heading={(display.title || (display.descriptions && description)) && <TierListHeading title={title} description={description} display={display} />} />
    {editingHeading && <TierListHeadingEditor title={title} description={description} onClose={() => setEditingHeading(false)}
      onSave={(title, description) => state.dispatch({ type: "editHeading", title, description })} />}
  </div>
}

export function TierListWorkspace({ template, slug, instanceId = "default" }: { template: TierListTemplate | null; slug: string; instanceId?: string }) {
  const t = useTranslations("tierLists")
  const [value, setValue] = useState<{ doc: TierListDocument; adapter: LocalStorageTierListAdapter } | null>(null)
  const [error, setError] = useState<"storage" | "source" | "missing" | null>(null)
  const [retry, setRetry] = useState(0)
  const [recover, setRecover] = useState(false)
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    setError(null); setValue(null)
    void (async () => {
      let adapter: LocalStorageTierListAdapter
      let stored: TierListDocument | null
      try {
        adapter = new LocalStorageTierListAdapter(window.localStorage)
        stored = await adapter.load({ templateId: template?.id ?? slug, instanceId })
      } catch { if (!cancelled) setError("storage"); return }
      if (stored) { if (!cancelled) setValue({ doc: stored, adapter }); return }
      if (!template) {
        // A new instance of a local template can reuse its definition, never somebody else's server data.
        const { documents } = await adapter.list()
        const existing = documents.find((d) => d.template.slug === slug)
        if (!cancelled) {
          if (existing) setValue({ doc: createDocument(existing.template, existing.items, instanceId), adapter })
          else setError("missing")
        }
        return
      }
      try {
        const items = await resolveTierListItems(template.source, tierListSources, controller.signal)
        if (!cancelled) setValue({ doc: createDocument(template, items, instanceId), adapter })
      } catch { if (!cancelled) setError("source") }
    })().catch(() => { if (!cancelled) setError("storage") })
    return () => { cancelled = true; controller.abort() }
  }, [template, slug, instanceId, retry])
  if (value) return <LoadedWorkspace key={`${value.doc.template.id}:${instanceId}`} initial={value.doc} adapter={value.adapter} />
  return <div className="grid gap-4">
    <p role={error ? "alert" : "status"}>{t(error === "storage" ? "storageLoadError" : error === "source" ? "sourceError" : error === "missing" ? "localMissing" : "loading")}</p>
    {error && <div className="flex flex-wrap gap-2"><Button onClick={() => setRetry((n) => n + 1)}>{t("retry")}</Button><Button href="/tier-lists">{t("back")}</Button></div>}
    {error === "storage" && <div><Button onClick={() => setRecover(true)}>{t("recover")}</Button></div>}
    <ConfirmDialog open={recover} title={t("confirmTitle")} body={t("recoverBody")} onClose={() => setRecover(false)} onConfirm={() => {
      void new LocalStorageTierListAdapter(window.localStorage).delete({ templateId: template?.id ?? slug, instanceId }).then(() => { setRecover(false); setRetry((n) => n + 1) }).catch(() => setError("storage"))
    }} />
  </div>
}
