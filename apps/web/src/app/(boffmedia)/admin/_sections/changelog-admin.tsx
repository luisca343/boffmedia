"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import type { ChangelogAdminItemEntity, ChangelogTranslationInputDto, CreateChangelogDto, UpdateChangelogDto } from "@boffmedia/shared"
import { Button, ChangelogFeed, Icon, Spinner } from "@boffmedia/ui"
import { cn } from "@/lib/utils"

import {
  ChangelogAdminService,
  type AdminChangelogPlatform,
  type AdminChangelogProduct,
} from "@/services/api/boffmedia/changelogAdminService"
import { AvAlert, AvPanel, AvPill, AvSectionHead } from "../_components/ui/av-kit"

type Locale = "es" | "en"
type TranslationStatus = "draft" | "translated" | "reviewed"
type CtaProduct = AdminChangelogProduct
type CtaPlatform = AdminChangelogPlatform

type TranslationDraft = {
  locale: Locale
  title: string
  summary: string
  body: string
  ctaLabel: string
  status: TranslationStatus
}

type CtaDraft = {
  product: CtaProduct
  platform: CtaPlatform
  url: string
}

type Draft = {
  product: AdminChangelogProduct
  platform: AdminChangelogPlatform
  version: string
  translations: Record<Locale, TranslationDraft>
  ctas: CtaDraft[]
}

const PRODUCTS: AdminChangelogProduct[] = ["boffmedia", "smartrotom", "all"]
const PLATFORMS: AdminChangelogPlatform[] = ["all", "web", "desktop"]
const LOCALES: Locale[] = ["es", "en"]
const TRANSLATION_STATUSES: TranslationStatus[] = ["draft", "translated", "reviewed"]

function emptyTranslation(locale: Locale): TranslationDraft {
  return { locale, title: "", summary: "", body: "", ctaLabel: "", status: "draft" }
}

function emptyDraft(): Draft {
  return {
    product: "boffmedia",
    platform: "web",
    version: "",
    translations: { es: emptyTranslation("es"), en: emptyTranslation("en") },
    ctas: [],
  }
}

function draftFromRow(row: ChangelogAdminItemEntity): Draft {
  const translations = { es: emptyTranslation("es"), en: emptyTranslation("en") }
  for (const translation of row.translations) {
    if (translation.locale !== "es" && translation.locale !== "en") continue
    translations[translation.locale] = {
      locale: translation.locale,
      title: translation.title,
      summary: translation.summary ?? "",
      body: translation.body,
      ctaLabel: translation.ctaLabel ?? "",
      status: translation.status as TranslationStatus,
    }
  }
  return {
    product: row.product as AdminChangelogProduct,
    platform: row.platform as AdminChangelogPlatform,
    version: row.version ?? "",
    translations,
    ctas: row.ctas.map((cta) => ({
      product: cta.product as CtaProduct,
      platform: cta.platform as CtaPlatform,
      url: cta.url,
    })),
  }
}

function toInput(draft: Draft): CreateChangelogDto {
  const translations: ChangelogTranslationInputDto[] = LOCALES.map((locale) => {
    const value = draft.translations[locale]
    return {
      locale: value.locale,
      title: value.title,
      summary: value.summary || undefined,
      body: value.body,
      ctaLabel: value.ctaLabel || undefined,
      status: value.status,
    } as ChangelogTranslationInputDto
  }).filter((translation) => translation.title.trim() || translation.body.trim())
  return {
    product: draft.product as CreateChangelogDto["product"],
    platform: draft.platform as CreateChangelogDto["platform"],
    version: draft.version.trim() || undefined,
    translations,
    ctas: draft.ctas.map((cta) => ({
      product: cta.product as "boffmedia" | "smartrotom" | "all",
      platform: cta.platform as "all" | "web" | "desktop",
      url: cta.url,
    })) as CreateChangelogDto["ctas"],
  }
}

function statusTone(status: string): "muted" | "amber" | "green" {
  if (status === "published") return "green"
  if (status === "unpublished") return "amber"
  return "muted"
}

export function ChangelogAdmin() {
  const t = useTranslations("admin.changelog")
  const [rows, setRows] = useState<ChangelogAdminItemEntity[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [locale, setLocale] = useState<Locale>("es")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ChangelogAdminService.list()
      if (!response.success || !response.data) {
        setError(response.userMessage ?? t("loadFailed"))
        return
      }
      setRows(response.data)
      setSelectedId((current) => current && response.data?.some((row) => row.id === current) ? current : null)
    } catch {
      setError(t("loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const choose = (row: ChangelogAdminItemEntity) => {
    setSelectedId(row.id)
    setDraft(draftFromRow(row))
    setLocale("es")
    setNotice(null)
  }

  const createNew = () => {
    setSelectedId(null)
    setDraft(emptyDraft())
    setLocale("es")
    setNotice(null)
    setError(null)
  }

  const updateTranslation = (key: keyof TranslationDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [locale]: { ...current.translations[locale], [key]: value },
      },
    }))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const input = toInput(draft)
      const response = selectedId
        ? await ChangelogAdminService.update(selectedId, input as UpdateChangelogDto)
        : await ChangelogAdminService.create(input)
      if (!response.success || !response.data) {
        setError(response.userMessage ?? t("saveFailed"))
        return
      }
      setRows((current) => {
        const next = current.filter((row) => row.id !== response.data?.id)
        return [response.data!, ...next]
      })
      setSelectedId(response.data.id)
      setDraft(draftFromRow(response.data))
      setNotice(t("saved"))
    } catch {
      setError(t("saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const runAction = async (action: "publish" | "unpublish" | "delete") => {
    if (!selectedId) return
    if (action === "delete" && !window.confirm(t("confirmDelete"))) return
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      if (action === "delete") {
        const response = await ChangelogAdminService.remove(selectedId)
        if (!response.success) {
          setError(response.userMessage ?? t("actionFailed"))
          return
        }
        setRows((current) => current.filter((row) => row.id !== selectedId))
        createNew()
        setNotice(t("deleted"))
        return
      }
      const response = action === "publish"
        ? await ChangelogAdminService.publish(selectedId)
        : await ChangelogAdminService.unpublish(selectedId)
      if (!response.success || !response.data) {
        setError(response.userMessage ?? t("actionFailed"))
        return
      }
      setRows((current) => [response.data!, ...current.filter((row) => row.id !== selectedId)])
      setDraft(draftFromRow(response.data))
      setNotice(t(action === "publish" ? "published" : "unpublished"))
    } catch {
      setError(t("actionFailed"))
    } finally {
      setSaving(false)
    }
  }

  const addCta = () => {
    setDraft((current) => ({
      ...current,
      ctas: [...current.ctas, { product: "all", platform: "all", url: "" }],
    }))
  }

  const updateCta = (index: number, key: keyof CtaDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      ctas: current.ctas.map((cta, i) => i === index ? { ...cta, [key]: value } as CtaDraft : cta),
    }))
  }

  return (
    <div className="space-y-6">
      <AvSectionHead
        title={t("title")}
        desc={t("description")}
        actions={<Button type="button" onClick={createNew} icon="plus" variant="pri" size="sm">{t("newEntry")}</Button>}
      />

      {error && <AvAlert tone="error">{error}</AvAlert>}
      {notice && <AvAlert tone="success">{notice}</AvAlert>}

      <div className="grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <AvPanel
          title={t("title")}
          icon="list"
          aside={<AvPill tone="muted">{rows.length}</AvPill>}
          bodyClassName="p-0"
        >
      <div className="max-h-[42rem] overflow-y-auto bg-base-2 p-2.5 bm-scroll">
            {loading && (
              <div className="flex min-h-[12rem] items-center justify-center gap-2 text-sm text-txt-muted">
                <Spinner size={18} className="text-accent" />
                {t("loading")}
              </div>
            )}
            {!loading && rows.length === 0 && <p className="p-4 text-sm text-txt-muted">{t("selectEntry")}</p>}
            {rows.map((row) => {
              const spanish = row.translations.find((translation) => translation.locale === "es")
              const selectedRow = selectedId === row.id
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => choose(row)}
                  aria-pressed={selectedRow}
                  className={cn(
                    "group relative mb-2 flex min-h-[4.75rem] w-full items-center gap-3 overflow-hidden border border-solid p-3 text-left transition-[border-color,background,transform] last:mb-0",
                    selectedRow
                      ? "border-accent bg-accent-soft shadow-[inset_3px_0_0_var(--accent)]"
                      : "border-line bg-panel hover:-translate-y-px hover:border-accent-line hover:bg-panel-2",
                  )}
                >
                  <span className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center border border-solid bg-base-2",
                    selectedRow ? "border-accent text-accent" : "border-line-2 text-txt-dim",
                  )}>
                    <Icon name="book" size={17} />
                  </span>
                  <span className="min-w-0 flex-1 py-0.5">
                    <span className="flex min-w-0 items-start gap-2">
                      <span className="min-w-0 flex-1 truncate font-display text-[0.8125rem] font-bold uppercase text-txt">{spanish?.title || `#${row.id}`}</span>
                      <AvPill tone={statusTone(row.status)}>{t(row.status === "published" ? "publishedStatus" : row.status === "unpublished" ? "unpublishedStatus" : "draft")}</AvPill>
                    </span>
                    <span className="mt-1 block truncate font-mono text-[0.5625rem] uppercase tracking-[0.06em] text-txt-dim">{t(row.product)} · {t(row.platform)}</span>
                  </span>
                  <Icon name="arrow" size={14} className="shrink-0 text-txt-dim transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
                </button>
              )
            })}
          </div>
        </AvPanel>

        <AvPanel className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.16em] text-accent">{selected ? t("editEntry") : t("newEntry")}</p>
              <h2 className="mt-1 font-display text-xl font-bold uppercase text-txt">{selected ? `#${selected.id}` : t("newEntry")}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected?.status === "draft" && <button type="button" disabled={saving} onClick={() => void runAction("delete")} className="border border-bad px-3 py-2 font-mono text-xs font-bold uppercase text-bad disabled:opacity-50">{t("delete")}</button>}
              {selected && selected.status === "published" && <button type="button" disabled={saving} onClick={() => void runAction("unpublish")} className="border border-line-2 px-3 py-2 font-mono text-xs font-bold uppercase text-txt disabled:opacity-50">{t("unpublish")}</button>}
              {selected && selected.status !== "published" && <button type="button" disabled={saving} onClick={() => void runAction("publish")} className="border border-accent bg-accent px-3 py-2 font-mono text-xs font-bold uppercase text-accent-ink disabled:opacity-50">{t("publish")}</button>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1 text-sm font-semibold text-txt"><span>{t("product")}</span><select value={draft.product} onChange={(event) => setDraft((current) => ({ ...current, product: event.target.value as AdminChangelogProduct }))} className="w-full border border-line-2 bg-base px-3 py-2 text-sm text-txt">{PRODUCTS.map((value) => <option key={value} value={value}>{t(value)}</option>)}</select></label>
            <label className="space-y-1 text-sm font-semibold text-txt"><span>{t("platform")}</span><select value={draft.platform} onChange={(event) => setDraft((current) => ({ ...current, platform: event.target.value as AdminChangelogPlatform }))} className="w-full border border-line-2 bg-base px-3 py-2 text-sm text-txt">{PLATFORMS.map((value) => <option key={value} value={value}>{t(value)}</option>)}</select></label>
            <label className="space-y-1 text-sm font-semibold text-txt"><span>{t("version")}</span><input value={draft.version} onChange={(event) => setDraft((current) => ({ ...current, version: event.target.value }))} className="w-full border border-line-2 bg-base px-3 py-2 text-sm text-txt" maxLength={32} /></label>
          </div>

          <div className="mt-7 flex items-center gap-2 border-b border-line">
            <span className="mr-2 font-mono text-[0.625rem] font-bold uppercase tracking-[0.14em] text-txt-dim">{t("translations")}</span>
            {LOCALES.map((value) => <button key={value} type="button" onClick={() => setLocale(value)} className={`border-b-2 px-3 py-2 font-mono text-xs font-bold uppercase ${locale === value ? "border-accent text-accent" : "border-transparent text-txt-muted"}`}>{value === "es" ? t("spanish") : t("english")}</button>)}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="block space-y-1 text-sm font-semibold text-txt"><span>{t("titleLabel")}</span><input value={draft.translations[locale].title} onChange={(event) => updateTranslation("title", event.target.value)} className="w-full border border-line-2 bg-base px-3 py-2 text-sm text-txt" maxLength={255} /></label>
              <label className="block space-y-1 text-sm font-semibold text-txt"><span>{t("summaryLabel")}</span><input value={draft.translations[locale].summary} onChange={(event) => updateTranslation("summary", event.target.value)} className="w-full border border-line-2 bg-base px-3 py-2 text-sm text-txt" /></label>
              <label className="block space-y-1 text-sm font-semibold text-txt"><span>{t("ctaLabel")}</span><input value={draft.translations[locale].ctaLabel} onChange={(event) => updateTranslation("ctaLabel", event.target.value)} className="w-full border border-line-2 bg-base px-3 py-2 text-sm text-txt" maxLength={255} /></label>
              <label className="block space-y-1 text-sm font-semibold text-txt"><span>{t("bodyLabel")}</span><textarea value={draft.translations[locale].body} onChange={(event) => updateTranslation("body", event.target.value)} rows={15} className="w-full resize-y border border-line-2 bg-base px-3 py-2 font-mono text-sm leading-6 text-txt" /></label>
              <label className="block space-y-1 text-sm font-semibold text-txt"><span>{t("translations")} - {t("status")}</span><select value={draft.translations[locale].status} onChange={(event) => updateTranslation("status", event.target.value)} className="w-full border border-line-2 bg-base px-3 py-2 text-sm text-txt">{TRANSLATION_STATUSES.map((value) => <option key={value} value={value}>{value === "reviewed" ? t("reviewed") : value === "translated" ? t("translated") : t("draft")}</option>)}</select></label>
            </div>
            <div className="min-w-0">
              <p className="mb-3 font-mono text-[0.625rem] font-bold uppercase tracking-[0.14em] text-txt-dim">{t("preview")}</p>
              <ChangelogFeed
                compact
                items={[{
                  id: "preview",
                  title: draft.translations[locale].title || "...",
                  version: draft.version.trim() ? `${t("version")} ${draft.version.trim()}` : undefined,
                  platform: t(draft.platform),
                  summary: draft.translations[locale].summary || undefined,
                  body: draft.translations[locale].body || "...",
                }]}
              />
            </div>
          </div>

          <div className="mt-7 border-t border-line pt-5">
            <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-display text-sm font-bold uppercase text-txt">{t("ctas")}</h3><button type="button" onClick={addCta} className="border border-line-2 px-3 py-2 font-mono text-xs font-bold uppercase text-txt hover:border-accent hover:text-accent">{t("addCta")}</button></div>
            <div className="space-y-3">
              {draft.ctas.map((cta, index) => <div key={`${index}-${cta.product}-${cta.platform}`} className="grid gap-2 border border-line bg-base-2 p-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end"><label className="space-y-1 text-xs font-semibold text-txt"><span>{t("ctaProduct")}</span><select value={cta.product} onChange={(event) => updateCta(index, "product", event.target.value)} className="w-full border border-line-2 bg-base px-2 py-2 text-sm text-txt">{PRODUCTS.map((value) => <option key={value} value={value}>{t(value)}</option>)}</select></label><label className="space-y-1 text-xs font-semibold text-txt"><span>{t("ctaPlatform")}</span><select value={cta.platform} onChange={(event) => updateCta(index, "platform", event.target.value)} className="w-full border border-line-2 bg-base px-2 py-2 text-sm text-txt">{PLATFORMS.map((value) => <option key={value} value={value}>{t(value)}</option>)}</select></label><label className="space-y-1 text-xs font-semibold text-txt"><span>{t("ctaUrl")}</span><input value={cta.url} onChange={(event) => updateCta(index, "url", event.target.value)} className="w-full border border-line-2 bg-base px-2 py-2 text-sm text-txt" maxLength={512} /></label><button type="button" onClick={() => setDraft((current) => ({ ...current, ctas: current.ctas.filter((_, i) => i !== index) }))} className="border border-line-2 px-3 py-2 font-mono text-xs font-bold uppercase text-txt-muted hover:border-bad hover:text-bad">{t("removeCta")}</button></div>)}
              {draft.ctas.length === 0 && <p className="text-sm text-txt-muted">{t("selectEntry")}</p>}
            </div>
          </div>

          <div className="mt-7 flex justify-end border-t border-line pt-5"><button type="button" disabled={saving} onClick={() => void save()} className="border border-accent bg-accent px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent-ink disabled:opacity-50">{saving ? t("saving") : selected ? t("save") : t("create")}</button></div>
        </AvPanel>
      </div>
    </div>
  )
}
