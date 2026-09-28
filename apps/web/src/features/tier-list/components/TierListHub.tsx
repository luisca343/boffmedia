"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, ConfirmDialog, Panel } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import type { TierListDocument, TierListTemplate } from "../core/schema"
import { LocalStorageTierListAdapter } from "../persistence/adapters"
import { importTierListFile } from "../serialization/document"
import { cloneTemplate, getTierListTitle, newTierListId } from "../core/engine"
import { tierListHref } from "../routes"

export function TierListHub({ templates }: { templates: TierListTemplate[] }) {
  const t = useTranslations("tierLists")
  const router = useRouter()
  const [documents, setDocuments] = useState<TierListDocument[]>([])
  const [error, setError] = useState(false)
  const [invalid, setInvalid] = useState(0)
  const [remove, setRemove] = useState<TierListDocument | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let cancelled = false
    void (async () => new LocalStorageTierListAdapter(window.localStorage).list())().then((result) => {
      if (cancelled) return
      setDocuments(result.documents); setInvalid(result.invalidCount); setReady(true)
    }).catch(() => { if (!cancelled) { setError(true); setReady(true) } })
    return () => { cancelled = true }
  }, [])
  return <main className="wrap-wide grid gap-8 py-10">
    <header className="grid gap-4">
      <h1 className="text-4xl">{t("hubTitle")}</h1><p className="max-w-3xl text-txt-muted">{t("hubLead")}</p>
      <div className="flex flex-wrap items-center gap-3"><Button variant="pri" href="/tier-lists/new/edit">{t("createTemplate")}</Button>
        <label className="text-sm text-txt-muted">{t("importJson")}<input type="file" accept=".json,application/json" className="ml-2 max-w-full" disabled={busy} onChange={async (e) => {
          const file = e.target.files?.[0]; e.target.value = ""
          if (!file) return
          setBusy(true); setError(false)
          try {
            const imported = await importTierListFile(file)
            const template = cloneTemplate(imported.template)
            const next: TierListDocument = { ...imported, template, instance: { ...imported.instance, id: newTierListId(), templateId: template.id, ownerId: undefined, visibility: "private", createdAt: undefined, updatedAt: undefined } }
            await new LocalStorageTierListAdapter(window.localStorage).save(next)
            router.push(tierListHref(next))
          } catch { setError(true) } finally { setBusy(false) }
        }} /></label>
      </div>
    </header>
    {error && <p role="alert" className="text-bad">{t("hubError")}</p>}
    {!!invalid && <p role="status" className="text-sm text-txt-muted">{t("invalidLocal", { count: invalid })}</p>}
    <section className="grid gap-4"><h2 className="text-2xl">{t("systemTemplates")}</h2>
      <div className="grid gap-4 md:grid-cols-3">{templates.map((template) => <Panel key={template.id} title={template.title} bodyClassName="grid gap-4">
        <p className="text-sm text-txt-muted">{template.description}</p><div className="flex flex-wrap gap-2"><Button href={`/tier-lists/${template.slug}`}>{t("openTemplate")}</Button><Button size="sm" icon="edit" href={`/tier-lists/${template.slug}/edit`}>{t("editPreset")}</Button></div>
      </Panel>)}</div>
    </section>
    <section className="grid gap-4"><h2 className="text-2xl">{t("localLists")}</h2><p className="text-sm text-txt-muted">{t("localLead")}</p>
      {!ready && <p role="status">{t("loading")}</p>}
      {ready && !documents.length && <p className="text-txt-muted">{t("noLocalLists")}</p>}
      <div className="grid gap-4 md:grid-cols-2">{documents.map((doc) => <Panel key={`${doc.template.id}:${doc.instance.id}`} title={getTierListTitle(doc.template, doc.instance)} bodyClassName="grid gap-3">
        <p className="text-sm text-txt-muted">{t("instanceLabel", { id: doc.instance.id === "default" ? t("defaultInstance") : doc.instance.id.slice(0, 8) })}</p>
        <div className="flex flex-wrap gap-2"><Button href={tierListHref(doc)} size="sm">{t("open")}</Button><Button size="sm" href={tierListHref(doc, true)}>{t("editTemplate")}</Button><Button variant="ghost" size="sm" onClick={() => setRemove(doc)}>{t("deleteList")}</Button></div>
      </Panel>)}</div>
    </section>
    <ConfirmDialog open={!!remove} busy={busy} tone="error" title={t("confirmTitle")} body={t("deleteListBody")} onClose={() => setRemove(null)} onConfirm={() => {
      if (!remove) return
      const doc = remove
      setBusy(true)
      void new LocalStorageTierListAdapter(window.localStorage).delete({ templateId: doc.template.id, instanceId: doc.instance.id }).then(() => {
        setDocuments((current) => current.filter((d) => d.template.id !== doc.template.id || d.instance.id !== doc.instance.id)); setRemove(null)
      }).catch(() => setError(true)).finally(() => setBusy(false))
    }} />
  </main>
}
