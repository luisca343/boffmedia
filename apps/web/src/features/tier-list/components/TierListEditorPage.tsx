"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button, ConfirmDialog } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { cloneTemplate, createDocument, newTierListId, reconcileTemplate } from "../core/engine"
import type { TierListDocument, TierListTemplate } from "../core/schema"
import { LocalStorageTierListAdapter } from "../persistence/adapters"
import { resolveTierListItems } from "../adapters/sources"
import { createBlankTemplate } from "../templates"
import { tierListSources, tierListImageStorage } from "@/services/api/boffmedia/tierListSourcesService"
import { TierListTemplateEditor } from "./TierListTemplateEditor"
import { tierListHref } from "../routes"

export function TierListEditorPage({ template, slug, instanceId = "default", editBasePreset = false }: { template: TierListTemplate | null; slug: string; instanceId?: string; editBasePreset?: boolean }) {
  const t = useTranslations("tierLists")
  const router = useRouter()
  const session = useSession()
  const [value, setValue] = useState<{ template: TierListTemplate; original: TierListDocument | null } | null>(null)
  const [error, setError] = useState(false)
  const [pending, setPending] = useState<TierListTemplate | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const adapter = new LocalStorageTierListAdapter(window.localStorage)
      const original = slug === "new" || editBasePreset ? null : await adapter.load({ templateId: template?.id ?? slug, instanceId })
      const base = original?.template ?? template
      if (!base && slug !== "new") throw new Error("Local template missing")
      const draft = base ? (base.ownership?.type === "system" ? cloneTemplate(base, t("copyTitle", { title: base.title })) : base) : createBlankTemplate(t, newTierListId())
      if (!cancelled) setValue({ template: draft, original })
    })().catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [template, slug, instanceId, editBasePreset, t])
  const save = async (nextTemplate: TierListTemplate) => {
    setBusy(true); setError(false)
    try {
      const items = await resolveTierListItems(nextTemplate.source, tierListSources)
      const original = value?.original
      const next = original ? reconcileTemplate(original, nextTemplate, items) : createDocument(nextTemplate, items)
      if (original && nextTemplate.id !== original.template.id) next.instance = { ...next.instance, id: newTierListId(), ownerId: undefined, visibility: "private" }
      next.template.updatedAt = new Date().toISOString()
      await new LocalStorageTierListAdapter(window.localStorage).save(next)
      router.push(tierListHref(next))
    } catch { setError(true); throw new Error("Template save failed") } finally { setBusy(false); setPending(null) }
  }
  return <div className="grid gap-6">
    <header className="grid gap-3"><h1 className="text-3xl">{t(template?.ownership?.type === "system" ? "presetEditor" : "templateEditor")}</h1><p className="text-sm text-txt-muted">{t(template?.ownership?.type === "system" ? "presetEditorHint" : "localOnly")}</p><div><Button size="sm" href="/tier-lists">{t("back")}</Button></div></header>
    {error && <p role="alert" className="text-bad">{t("editorError")}</p>}
    {value ? <TierListTemplateEditor template={value.template} busy={busy} imageStorage={session.data?.user?.accessToken ? tierListImageStorage : undefined} sources={[{ key: "site-games", label: t("templates.games.title") }]} onSave={async (next) => {
      if (value.original && Object.values(value.original.instance.placements).some((row) => row.length)) setPending(next)
      else await save(next)
    }} /> : !error && <p role="status">{t("loading")}</p>}
    <ConfirmDialog open={!!pending} busy={busy} title={t("applyTemplateTitle")} body={t("applyTemplateBody")} onClose={() => setPending(null)} onConfirm={() => { if (pending) void save(pending).catch(() => {}) }} />
  </div>
}
