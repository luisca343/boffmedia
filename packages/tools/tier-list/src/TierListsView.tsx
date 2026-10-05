"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, ConfirmDialog, Panel } from "@boffmedia/ui"
import { getToolHost, toolApi, useToolSession } from "@boffmedia/tool-kit"
import { useTierListT } from "./i18n"
import { cloneTemplate, createDocument, getTierListDescription, getTierListTitle, newTierListId, reconcileTemplate } from "./core/engine"
import type { TierListDocument, TierListTemplate } from "./core/schema"
import { resolveTierListItems, type TierListSourceRegistry } from "./adapters/sources"
import { ToolDbTierListAdapter } from "./persistence/toolDb"
import { useTierList } from "./hooks/useTierList"
import { getTierListTemplates, createBlankTemplate, withTierListPresetRules, withTierListStarterImages } from "./templates"
import { TierList } from "./components/TierList"
import { TierListTemplateEditor } from "./components/TierListTemplateEditor"
import { TierListToolbar } from "./components/TierListToolbar"
import { TierListDisplayControls } from "./components/TierListDisplayControls"
import { TierListHeading } from "./components/TierListHeading"
import { TierListHeadingEditor } from "./components/TierListHeadingEditor"
import { defaultTierListDisplay } from "./display"
import { importTierListFile } from "./serialization/document"

type DocumentScreen = { template: TierListTemplate; instanceId: string; original?: TierListDocument | null }
type BoardScreen = DocumentScreen & { kind: "board" }
type EditorScreen = DocumentScreen & { kind: "edit" }
type Screen = { kind: "hub" } | BoardScreen | EditorScreen
type Game = { id: string | number; title: string; description?: string; icon?: string }

const sources: TierListSourceRegistry = {
  "site-games": async (_params, signal) => {
    signal?.throwIfAborted()
    const response = await toolApi().request<{ success: boolean; data?: Game[] }>("/events/games")
    signal?.throwIfAborted()
    if (!response.success || !response.data) throw new Error("Could not load game collection")
    return response.data.map((game) => ({
      id: `game-${game.id}`, name: game.title, description: game.description,
      // Keep portable source paths in saved JSON; the image component resolves
      // them through each host's asset URL when it renders.
      image: game.icon || undefined,
      entity: { source: "site-games", id: String(game.id) },
    }))
  },
}

export function TierListsView() {
  const t = useTierListT()
  const adapter = useMemo(() => new ToolDbTierListAdapter(getToolHost().data.db("tier-lists")), [])
  const templates = useMemo(() => getTierListTemplates(t), [t])
  const [screen, setScreen] = useState<Screen>({ kind: "hub" })
  const [documents, setDocuments] = useState<TierListDocument[]>([])
  const [invalid, setInvalid] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [remove, setRemove] = useState<TierListDocument | null>(null)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (screen.kind !== "hub") return
    let live = true
    void adapter.list().then((result) => {
      if (live) { setDocuments(result.documents); setInvalid(result.invalidCount) }
    }).catch(() => { if (live) setError(true) })
    return () => { live = false }
  }, [adapter, screen.kind, refresh])

  const open = (doc: TierListDocument, kind: "board" | "edit" = "board") =>
    setScreen({ kind, template: doc.template, instanceId: doc.instance.id, original: kind === "edit" ? doc : undefined })
  const goHub = () => { setScreen({ kind: "hub" }); setRefresh((n) => n + 1) }
  const importFile = async (file: File) => {
    setBusy(true); setError(false)
    try {
      const imported = await importTierListFile(file)
      const template = cloneTemplate(imported.template)
      const next: TierListDocument = { ...imported, template, instance: { ...imported.instance, id: newTierListId(), templateId: template.id, ownerId: undefined, visibility: "private", createdAt: undefined, updatedAt: undefined } }
      await adapter.save(next)
      open(next)
    } catch { setError(true) } finally { setBusy(false) }
  }

  if (screen.kind === "board") return <DesktopBoard key={`${screen.template.id}:${screen.instanceId}`} screen={screen} adapter={adapter} preset={templates.find((template) => template.id === screen.template.id) ?? null} onBack={goHub} onOpen={open} />
  if (screen.kind === "edit") return <DesktopEditor key={`${screen.template.id}:${screen.instanceId}`} screen={screen} adapter={adapter} onBack={goHub} onOpen={open} />

  return <main className="mx-auto grid w-full max-w-7xl gap-8 py-8">
    <header className="grid gap-3"><h1 className="text-4xl">{t("hubTitle")}</h1><p className="max-w-3xl text-txt-muted">{t("hubLead")}</p>
      <div className="flex flex-wrap items-center gap-3"><Button variant="pri" onClick={() => setScreen({ kind: "edit", template: createBlankTemplate(t, newTierListId()), instanceId: "default", original: null })}>{t("createTemplate")}</Button>
        <label className="text-sm text-txt-muted">{t("importJson")}<input type="file" accept=".json,application/json" className="ml-2 max-w-full" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void importFile(file) }} /></label>
      </div>
    </header>
    {error && <p role="alert" className="text-bad">{t("hubError")}</p>}
    {!!invalid && <p role="status" className="text-sm text-txt-muted">{t("invalidLocal", { count: invalid })}</p>}
    <section className="grid gap-4"><h2 className="text-2xl">{t("systemTemplates")}</h2><div className="grid gap-4 md:grid-cols-3">{templates.map((template) =>
      <Panel key={template.id} title={template.title} bodyClassName="grid gap-4"><p className="text-sm text-txt-muted">{template.description}</p><div className="flex flex-wrap gap-2">
        <Button onClick={() => setScreen({ kind: "board", template, instanceId: "default" })}>{t("openTemplate")}</Button>
        <Button size="sm" icon="edit" onClick={() => setScreen({ kind: "edit", template, instanceId: "default", original: null })}>{t("editPreset")}</Button>
      </div></Panel>)}</div></section>
    <section className="grid gap-4"><h2 className="text-2xl">{t("localLists")}</h2><p className="text-sm text-txt-muted">{t("desktopLocalLead")}</p>
      {!documents.length && <p className="text-txt-muted">{t("noLocalLists")}</p>}
      <div className="grid gap-4 md:grid-cols-2">{documents.map((doc) => <Panel key={`${doc.template.id}:${doc.instance.id}`} title={getTierListTitle(doc.template, doc.instance)} bodyClassName="grid gap-3">
        <p className="text-sm text-txt-muted">{t("instanceLabel", { id: doc.instance.id === "default" ? t("defaultInstance") : doc.instance.id.slice(0, 8) })}</p>
        <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => open(doc)}>{t("open")}</Button><Button size="sm" onClick={() => open(doc, "edit")}>{t("editTemplate")}</Button><Button variant="ghost" size="sm" onClick={() => setRemove(doc)}>{t("deleteList")}</Button></div>
      </Panel>)}</div>
    </section>
    <ConfirmDialog open={!!remove} busy={busy} tone="error" title={t("confirmTitle")} body={t("deleteListBody")} onClose={() => setRemove(null)} onConfirm={() => {
      if (!remove) return
      setBusy(true)
      void adapter.delete({ templateId: remove.template.id, instanceId: remove.instance.id }).then(() => { setRemove(null); setRefresh((n) => n + 1) }).catch(() => setError(true)).finally(() => setBusy(false))
    }} />
  </main>
}

function DesktopBoard({ screen, adapter, preset, onBack, onOpen }: { screen: BoardScreen; adapter: ToolDbTierListAdapter; preset: TierListTemplate | null; onBack: () => void; onOpen: (doc: TierListDocument, kind?: "board" | "edit") => void }) {
  const t = useTierListT()
  const [initial, setInitial] = useState<TierListDocument | null>(null)
  const [error, setError] = useState<"storage" | "source" | null>(null)
  const [recover, setRecover] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let live = true
    void (async () => {
      let stored: TierListDocument | null
      try { stored = await adapter.load({ templateId: screen.template.id, instanceId: screen.instanceId }) }
      catch { if (live) setError("storage"); return null }
      if (stored) return stored
      const items = await resolveTierListItems(screen.template.source, sources)
      return createDocument(screen.template, items, screen.instanceId)
    })().then((doc) => { if (live && doc) setInitial(doc) }).catch(() => { if (live) setError("source") })
    return () => { live = false }
  }, [adapter, screen.template, screen.instanceId, retry])
  if (!initial) return <div className="grid gap-3 p-6"><p role={error ? "alert" : "status"}>{t(error === "storage" ? "storageLoadError" : error === "source" ? "sourceError" : "loading")}</p><div className="flex gap-2">{error && <Button onClick={() => { setError(null); setRetry((n) => n + 1) }}>{t("retry")}</Button>}{error === "storage" && <Button onClick={() => setRecover(true)}>{t("recover")}</Button>}<Button onClick={onBack}>{t("back")}</Button></div>
    <ConfirmDialog open={recover} title={t("confirmTitle")} body={t("recoverBody")} onClose={() => setRecover(false)} onConfirm={() => { void adapter.delete({ templateId: screen.template.id, instanceId: screen.instanceId }).then(() => { setRecover(false); setError(null); setRetry((n) => n + 1) }).catch(() => setError("storage")) }} />
  </div>
  return <LoadedBoard initial={initial} adapter={adapter} preset={preset} onBack={onBack} onOpen={onOpen} />
}

function LoadedBoard({ initial, adapter, preset, onBack, onOpen }: { initial: TierListDocument; adapter: ToolDbTierListAdapter; preset: TierListTemplate | null; onBack: () => void; onOpen: (doc: TierListDocument, kind?: "board" | "edit") => void }) {
  const t = useTierListT()
  const migrate = useCallback((doc: TierListDocument) => withTierListPresetRules(doc, preset), [preset])
  const state = useTierList(initial, adapter, migrate)
  const doc = withTierListStarterImages(state.document)
  const presetChanged = !!preset && doc.template.ownership?.type === "system" && JSON.stringify([doc.template.rows, doc.template.settings, doc.template.initialPlacements, doc.items.map(({ id, fixedRowId }) => [id, fixedRowId])]) !== JSON.stringify([preset.rows, preset.settings, preset.initialPlacements, preset.source.type === "reference" ? [] : preset.source.items.map(({ id, fixedRowId }) => [id, fixedRowId])])
  const [display, setDisplay] = useState(defaultTierListDisplay)
  const [editingHeading, setEditingHeading] = useState(false)
  const [recover, setRecover] = useState(false)
  const [error, setError] = useState(false)
  const presentationRef = useRef<HTMLDivElement>(null)
  if (!state.loaded) return <div className="grid gap-3 p-6"><p role={state.loadFailed ? "alert" : "status"}>{t(state.loadFailed ? "storageLoadError" : "loading")}</p><div className="flex gap-2">{state.loadFailed && <Button onClick={() => setRecover(true)}>{t("recover")}</Button>}<Button onClick={onBack}>{t("back")}</Button></div>
    <ConfirmDialog open={recover} title={t("confirmTitle")} body={t("recoverBody")} onClose={() => setRecover(false)} onConfirm={() => { void state.recoverLocal().then(() => setRecover(false)).catch(() => {}) }} />
  </div>
  const title = getTierListTitle(doc.template, doc.instance)
  const description = getTierListDescription(doc.template, doc.instance)
  return <main className="mx-auto grid w-full max-w-7xl gap-6 py-8">
    <header className="flex flex-wrap items-center gap-2"><Button size="sm" variant="ghost" onClick={onBack}>{t("back")}</Button><span role="status" className={state.status === "error" ? "text-sm text-bad" : "text-sm text-txt-muted"}>{t(`status.${state.status}`)}</span>{state.status === "error" && <Button size="sm" onClick={state.retrySave}>{t("retry")}</Button>}
      <span className="hidden flex-1 sm:block" /><Button size="sm" onClick={() => onOpen(doc, "edit")}>{t(doc.template.ownership?.type === "system" ? "remix" : "editTemplate")}</Button>
      <Button size="sm" onClick={() => { void (async () => { const definition = presetChanged && preset ? preset : doc.template; const items = presetChanged ? await resolveTierListItems(definition.source, sources) : doc.items; const next = createDocument(definition, items); await adapter.save(next); onOpen(next) })().catch(() => setError(true)) }}>{t("newInstance")}</Button>
    </header>
    {error && <p role="alert" className="text-bad">{t("newInstanceError")}</p>}
    {presetChanged && <p className="text-sm text-txt-muted">{t("presetUpdated")}</p>}
    <TierListToolbar document={doc} getPresentation={() => presentationRef.current} onEditHeading={() => setEditingHeading(true)} dispatch={state.dispatch} canUndo={state.canUndo} canRedo={state.canRedo} onImport={async (imported) => { const template = cloneTemplate(imported.template); const next = { ...imported, template, instance: { ...imported.instance, id: newTierListId(), templateId: template.id, visibility: "private" as const, ownerId: undefined } }; await adapter.save(next); onOpen(next) }} />
    <TierListDisplayControls value={display} onChange={setDisplay} collapsible />
    <TierList template={doc.template} instance={doc.instance} items={doc.items} onChange={(_instance, action) => state.dispatch(action)} display={display} presentationRef={presentationRef} heading={(display.title || (display.descriptions && description)) && <TierListHeading title={title} description={description} display={display} />} />
    {editingHeading && <TierListHeadingEditor title={title} description={description} onClose={() => setEditingHeading(false)} onSave={(title, description) => state.dispatch({ type: "editHeading", title, description })} />}
  </main>
}

function DesktopEditor({ screen, adapter, onBack, onOpen }: { screen: EditorScreen; adapter: ToolDbTierListAdapter; onBack: () => void; onOpen: (doc: TierListDocument) => void }) {
  const t = useTierListT()
  const session = useToolSession()
  const [draft] = useState(() => screen.template.ownership?.type === "system" ? cloneTemplate(screen.template, t("copyTitle", { title: screen.template.title })) : screen.template)
  const [pending, setPending] = useState<TierListTemplate | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const save = async (template: TierListTemplate) => {
    setBusy(true); setError(false)
    try {
      const items = await resolveTierListItems(template.source, sources)
      const next = screen.original ? reconcileTemplate(screen.original, template, items) : createDocument(template, items)
      if (screen.original && template.id !== screen.original.template.id) next.instance = { ...next.instance, id: newTierListId(), ownerId: undefined, visibility: "private" }
      next.template.updatedAt = new Date().toISOString()
      await adapter.save(next)
      onOpen(next)
    } catch (cause) { setError(true); throw cause } finally { setBusy(false); setPending(null) }
  }
  return <main className="mx-auto grid w-full max-w-7xl gap-6 py-8"><header className="grid gap-3"><h1 className="text-3xl">{t(screen.template.ownership?.type === "system" ? "presetEditor" : "templateEditor")}</h1><p className="text-sm text-txt-muted">{t(screen.template.ownership?.type === "system" ? "presetEditorHint" : "localOnly")}</p><div><Button size="sm" onClick={onBack}>{t("back")}</Button></div></header>
    {error && <p role="alert" className="text-bad">{t("editorError")}</p>}
    <TierListTemplateEditor template={draft} busy={busy} imageStorage={session.signedIn && getToolHost().uploadImage ? { upload: getToolHost().uploadImage! } : undefined} sources={[{ key: "site-games", label: t("templates.games.title") }]} onSave={async (next) => { if (screen.original && Object.values(screen.original.instance.placements).some((row) => row.length)) setPending(next); else await save(next) }} />
    <ConfirmDialog open={!!pending} busy={busy} title={t("applyTemplateTitle")} body={t("applyTemplateBody")} onClose={() => setPending(null)} onConfirm={() => { if (pending) void save(pending).catch(() => {}) }} />
  </main>
}
