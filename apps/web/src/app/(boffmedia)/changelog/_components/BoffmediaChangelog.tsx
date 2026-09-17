"use client"

import { useLocale, useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"
import type { ChangelogListEntity } from "@boffmedia/shared"
import { Button, ChangelogFeed, Empty, Spinner, ToolHeader } from "@boffmedia/ui"
import { ChangelogService, type ChangelogLocale } from "@/services/api/boffmedia/changelogService"
import { useBoffSession } from "@/services/useBoffSession"

export function BoffmediaChangelog() {
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
      const response = await ChangelogService.list("boffmedia", "web", locale)
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
      product: "boffmedia",
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
    <main className="wrap-wide pb-[5.625rem] pt-[2.125rem]">
      <ToolHeader className="mb-6" title={t("title")} sub={t("description")} />

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center gap-3 font-mono text-sm uppercase tracking-[0.12em] text-txt-muted">
          <Spinner size={24} className="text-accent" />
          {t("loading")}
        </div>
      )}

      {!loading && error && (
        <Empty icon="alert" title={t("error")}>
          <Button icon="refresh" onClick={() => void load()}>
            {t("retry")}
          </Button>
        </Empty>
      )}

      {!loading && !error && result && result.items.length === 0 && (
        <Empty icon="book" title={t("empty")} lead={t("emptyDescription")} />
      )}

      {!loading && !error && result && result.items.length > 0 && (
        <ChangelogFeed
          items={result.items.map((item) => ({
            id: item.id,
            title: item.translation.title,
            date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
              new Date(item.publishedAt),
            ),
            version: item.version ? t("version", { version: item.version }) : undefined,
            platform: t(`platform.${item.platform}`),
            summary: item.translation.summary,
            body: item.translation.body,
            cta:
              item.cta && item.translation.ctaLabel
                ? { label: item.translation.ctaLabel, url: item.cta.url }
                : undefined,
          }))}
        />
      )}
    </main>
  )
}
