"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Badge,
  Button,
  Empty,
  Field,
  Icon,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
  toast,
} from "@boffmedia/ui"

import {
  ModerationService,
  type ModerationQueueItem,
  type ModerationQueueSort,
  type ReportableContentType,
} from "@/services/api/boffmedia/moderationService"
import { AvAlert, AvKpi, AvKpis, AvPanel, AvPill, AvSectionHead, formatAdminDate } from "../_components/ui/av-kit"
import { useStepUp } from "../_components/hooks/useStepUp"

const PAGE = 20

const CONTENT_TYPES: ReportableContentType[] = [
  "forum_thread",
  "forum_post",
  "rooker_post",
  "user_profile",
]

type Decision = "dismiss" | "hide" | "unhide" | "sanction"

type PendingAction = {
  kind: Decision
  item: ModerationQueueItem
}

/** Days between the report and now, for the age column. */
function ageInDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

/**
 * The report queue.
 *
 * Sorted by report count by default rather than by age: a chronological list
 * surfaces the oldest complaint, and the oldest complaint is rarely the one
 * still hurting people. The author's record sits on every row for the same
 * reason — the second offence only reads as a second offence if you can see the
 * first without leaving the page.
 */
export function ModerationAdmin() {
  const t = useTranslations("admin.moderation")
  // Only the sanction asks for a fresh code. Hiding and dismissing are one item
  // and one click to undo; a content ban stops a person participating.
  const { requestStepUp, stepUpDialog } = useStepUp()

  const [items, setItems] = useState<ModerationQueueItem[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [sort, setSort] = useState<ModerationQueueSort>("reports")
  const [contentType, setContentType] = useState<ReportableContentType | "">("")
  const [status, setStatus] = useState<"open" | "actioned" | "dismissed">("open")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pending, setPending] = useState<PendingAction | null>(null)
  const [reason, setReason] = useState("")
  const [banDays, setBanDays] = useState("7")
  const [permanent, setPermanent] = useState(false)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ModerationService.queue({
        status,
        sort,
        contentType: contentType || undefined,
        limit: PAGE,
        offset,
      })
      if (!response.success) {
        setError(response.userMessage ?? t("loadFailed"))
        return
      }
      setItems(response.data?.items ?? [])
      setTotal(response.data?.total ?? 0)
    } catch {
      setError(t("loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [status, sort, contentType, offset, t])

  useEffect(() => {
    void reload()
  }, [reload])

  const openReports = useMemo(
    () => items.reduce((sum, item) => sum + item.reportCount, 0),
    [items],
  )
  const repeatAuthors = useMemo(
    () => items.filter((item) => item.author.actionedReports > 0).length,
    [items],
  )

  const startAction = (kind: Decision, item: ModerationQueueItem) => {
    setPending({ kind, item })
    setReason("")
    setBanDays("7")
    setPermanent(false)
  }

  const confirm = async () => {
    if (!pending) return
    const { kind, item } = pending
    const text = reason.trim()
    if (!text) {
      toast({ tone: "bad", title: t("reasonRequired") })
      return
    }

    setBusy(true)
    try {
      if (kind === "sanction") {
        // The step-up prompt comes AFTER the reason is typed: asking for a code
        // first and then discovering the form is incomplete trains people to
        // keep the authenticator open.
        const token = await requestStepUp()
        if (!token) return
        const res = await ModerationService.sanction(
          {
            contentType: item.contentType,
            contentId: item.contentId,
            kind: "content_ban",
            reason: text,
            days: permanent ? undefined : Number(banDays) || 7,
          },
          token,
        )
        if (!res.success) {
          toast({ tone: "bad", title: t("actionFailed"), msg: res.userMessage ?? undefined })
          return
        }
      } else {
        const call =
          kind === "dismiss"
            ? ModerationService.dismiss
            : kind === "hide"
              ? ModerationService.hide
              : ModerationService.unhide
        const res = await call(item.contentType, item.contentId, text)
        if (!res.success) {
          toast({ tone: "bad", title: t("actionFailed"), msg: res.userMessage ?? undefined })
          return
        }
      }
      toast({ tone: "ok", title: t(`done.${kind}`) })
      setPending(null)
      await reload()
    } catch {
      toast({ tone: "bad", title: t("actionFailed") })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {stepUpDialog}

      <AvSectionHead title={t("title")} desc={t("desc")} />

      <AvKpis>
        <AvKpi label={t("kpiItems")} value={String(total)} icon="alert" />
        <AvKpi label={t("kpiReports")} value={String(openReports)} icon="flame" />
        <AvKpi label={t("kpiRepeat")} value={String(repeatAuthors)} icon="user" />
      </AvKpis>

      <AvPanel
        title={t("queueTitle")}
        icon="shield"
        aside={<AvPill tone="muted">{total}</AvPill>}
      >
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Select
            label={t("filterStatus")}
            value={status}
            onChange={(value) => {
              setOffset(0)
              setStatus(value as typeof status)
            }}
            options={[
              { value: "open", label: t("status.open") },
              { value: "actioned", label: t("status.actioned") },
              { value: "dismissed", label: t("status.dismissed") },
            ]}
          />
          <Select
            label={t("filterSort")}
            value={sort}
            onChange={(value) => {
              setOffset(0)
              setSort(value as ModerationQueueSort)
            }}
            options={[
              { value: "reports", label: t("sort.reports") },
              { value: "oldest", label: t("sort.oldest") },
              { value: "newest", label: t("sort.newest") },
            ]}
          />
          <Select
            label={t("filterType")}
            value={contentType}
            onChange={(value) => {
              setOffset(0)
              setContentType(value as ReportableContentType | "")
            }}
            options={[
              { value: "", label: t("type.all") },
              ...CONTENT_TYPES.map((value) => ({ value, label: t(`type.${value}`) })),
            ]}
          />
        </div>

        {error ? (
          <AvAlert tone="error">{error}</AvAlert>
        ) : loading ? (
          <Spinner size={30} className="text-accent" />
        ) : items.length === 0 ? (
          <Empty icon="check" title={t("emptyTitle")} lead={t("emptyLead")} />
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <article
                key={`${item.contentType}:${item.contentId}`}
                className="border border-solid border-line bg-panel p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="info">{t(`type.${item.contentType}`)}</Badge>
                  <AvPill tone={item.reportCount > 2 ? "rose" : "amber"}>
                    {t("reportsCount", { count: item.reportCount })}
                  </AvPill>
                  {item.hidden && <AvPill tone="muted">{t("hiddenFlag")}</AvPill>}
                  {!item.contentExists && <AvPill tone="muted">{t("goneFlag")}</AvPill>}
                  <span className="ml-auto font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-muted">
                    {t("ageDays", { count: ageInDays(item.firstReportedAt) })} ·{" "}
                    {formatAdminDate(item.lastReportedAt, { time: true })}
                  </span>
                </div>

                <p className="mb-3 whitespace-pre-wrap break-words text-[0.85rem] text-txt">
                  {item.excerpt || t("noExcerpt")}
                </p>

                <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="user" size={12} className="text-accent" />
                    {item.author.username ?? item.author.uuid ?? t("unknownAuthor")}
                  </span>
                  {/* The author's record, on the row: a first offence and a
                      fifth need different answers, and going to look it up is
                      the step that never happens. */}
                  <span>{t("authorTotal", { count: item.author.totalReports })}</span>
                  <span>{t("authorActioned", { count: item.author.actionedReports })}</span>
                  {item.author.sanctions > 0 && (
                    <span>{t("authorSanctions", { count: item.author.sanctions })}</span>
                  )}
                  {item.author.contentBanned && <AvPill tone="rose">{t("bannedFlag")}</AvPill>}
                  <span>{t("reasons")}: {item.reasons.map((r) => t(`reason.${r}`)).join(", ")}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" icon="check" onClick={() => startAction("dismiss", item)}>
                    {t("dismiss")}
                  </Button>
                  {item.hidden ? (
                    <Button size="sm" icon="eye" onClick={() => startAction("unhide", item)}>
                      {t("unhide")}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      icon="x"
                      onClick={() => startAction("hide", item)}
                      disabled={!item.contentExists}
                    >
                      {t("hide")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    icon="shield"
                    onClick={() => startAction("sanction", item)}
                  >
                    {t("sanction")}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        {total > PAGE && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <Button
              size="sm"
              icon="arrow"
              disabled={offset === 0}
              onClick={() => setOffset((value) => Math.max(0, value - PAGE))}
            >
              {t("prev")}
            </Button>
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-txt-muted">
              {t("pageOf", { from: offset + 1, to: Math.min(offset + PAGE, total), total })}
            </span>
            <Button
              size="sm"
              iconRight="chevronRight"
              disabled={offset + PAGE >= total}
              onClick={() => setOffset((value) => value + PAGE)}
            >
              {t("next")}
            </Button>
          </div>
        )}
      </AvPanel>

      <Modal
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        title={pending ? t(`confirm.${pending.kind}`) : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button
              variant={pending?.kind === "sanction" ? "danger" : "default"}
              onClick={() => void confirm()}
              disabled={busy}
            >
              {busy ? t("working") : t("confirmAction")}
            </Button>
          </>
        }
      >
        {/* Every decision takes a reason: it is what the audit row carries, and
            it is the only thing a later reader has to understand the call. */}
        <Field label={t("reasonLabel")} hint={t("reasonHint")}>
          <Textarea rows={3} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>

        {pending?.kind === "sanction" && (
          <div className="mt-3 grid gap-3">
            <Field label={t("banDays")} hint={t("banDaysHint")}>
              <Input
                type="number"
                min={1}
                max={3650}
                value={banDays}
                disabled={permanent}
                onChange={(e) => setBanDays(e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-[0.8rem]">
              <input
                type="checkbox"
                checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
              />
              {t("banPermanent")}
            </label>
          </div>
        )}
      </Modal>
    </div>
  )
}
