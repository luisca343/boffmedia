"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"
import type { ChangelogItemEntity, ChangelogListEntity } from "@boffmedia/shared"
import { ArrowUpRight, CalendarDays, ExternalLink, MARKDOWN_LAYOUT_CLASS, RefreshCw, SafeMarkdown } from "@boffmedia/ui"

import { cn } from "@/lib/utils"
import { ChangelogService, type ChangelogLocale } from "@/services/api/boffmedia/changelogService"
import { useBoffSession } from "@/services/useBoffSession"
import { SmartRotomBadge, SmartRotomButton, SmartRotomPanel } from "@/components/smartrotom/ui"

function isInternalUrl(url: string): boolean {
  return url.startsWith("/") || url.startsWith("#")
}

function SmartRotomEntry({ item }: { item: ChangelogItemEntity }) {
  const t = useTranslations("changelog")
  const locale = useLocale()
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(item.publishedAt))
  const ctaUrl = item.cta?.url
  const ctaLabel = item.translation.ctaLabel

  return (
    <SmartRotomPanel
      bodyClassName="p-4 sm:p-6"
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span>{item.translation.title}</span>
          {item.version && <SmartRotomBadge variant="neutral">{t("version", { version: item.version })}</SmartRotomBadge>}
        </span>
      }
      aside={<SmartRotomBadge variant="neutral">{t(`platform.${item.platform}`)}</SmartRotomBadge>}
    >
      <div className="mb-4 flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-sr-txt-muted">
        <CalendarDays size={14} aria-hidden="true" />
        {date}
      </div>
      {item.translation.summary && <p className="mb-4 text-sm leading-relaxed text-sr-txt-muted">{item.translation.summary}</p>}
      <SafeMarkdown className={cn(
        "text-sm leading-7 text-sr-txt",
        MARKDOWN_LAYOUT_CLASS,
        "[&_a]:font-bold [&_a]:text-sr-accent-bright [&_a]:underline [&_h2]:mt-5 [&_h2]:font-display [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:font-display [&_h3]:font-bold [&_strong]:text-sr-txt",
      )}>
        {item.translation.body}
      </SafeMarkdown>
      {ctaUrl && ctaLabel && (
        <SmartRotomButton asChild size="sm" variant="default" className="mt-5">
          {isInternalUrl(ctaUrl) ? (
            <Link href={ctaUrl}>
              {ctaLabel}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          ) : (
            <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
              {ctaLabel}
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
        </SmartRotomButton>
      )}
    </SmartRotomPanel>
  )
}

export function SmartRotomChangelog() {
  const t = useTranslations("changelog")
  const locale = useLocale() as ChangelogLocale
  const { status } = useBoffSession()
  const [result, setResult] = useState<ChangelogListEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const seenEntryRef = useRef<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await ChangelogService.list("smartrotom", "web", locale)
      if (!response.success || !response.data) {
        setError(true)
        return
      }
      setResult(response.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const newest = result?.items[0]
    if (status !== "authenticated" || !newest || seenEntryRef.current === newest.id) return
    seenEntryRef.current = newest.id
    void ChangelogService.markSeen({
      entryId: newest.id,
      product: "smartrotom",
      platform: "web",
    }).then((response) => {
      if (response.success) {
        setResult((current) => current ? { ...current, hasUnread: false, unreadCount: 0 } : current)
      }
    }).catch(() => {
      seenEntryRef.current = null
    })
  }, [result, status])

  return (
    <div className="h-full overflow-y-auto bg-sr-bg px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 border-b border-sr-line pb-5">
          <h1 className="font-display text-2xl font-bold uppercase tracking-[0.05em] text-sr-txt sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sr-txt-muted">{t("smartrotomDescription")}</p>
        </header>

        {loading && (
          <SmartRotomPanel flat bodyClassName="flex min-h-[18rem] items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.12em] text-sr-txt-muted">
            <RefreshCw size={16} className="animate-spin text-sr-accent" aria-hidden="true" />
            {t("loading")}
          </SmartRotomPanel>
        )}
        {!loading && error && (
          <SmartRotomPanel className="border-sr-bad" bodyClassName="p-5">
            <p className="font-display font-bold uppercase text-sr-txt">{t("error")}</p>
            <SmartRotomButton type="button" size="sm" variant="neutral" onClick={() => void load()} className="mt-4">
              <RefreshCw size={14} aria-hidden="true" />
              {t("retry")}
            </SmartRotomButton>
          </SmartRotomPanel>
        )}
        {!loading && !error && result && result.items.length === 0 && (
          <SmartRotomPanel bodyClassName="p-8 text-center">
            <p className="font-display font-bold uppercase text-sr-txt">{t("empty")}</p>
            <p className="mt-2 text-sm text-sr-txt-muted">{t("emptyDescription")}</p>
          </SmartRotomPanel>
        )}
        {!loading && !error && result && result.items.length > 0 && (
          <div className={cn("grid gap-5", result.items.length > 1 && "lg:grid-cols-2")}>
            {result.items.map((item) => <SmartRotomEntry key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  )
}
