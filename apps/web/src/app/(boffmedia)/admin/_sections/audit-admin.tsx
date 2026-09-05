"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Icon, Spinner, Empty } from "@boffmedia/ui"
import { AvSectionHead, formatAdminDate } from "../_components/ui/av-kit"
import { apiAuthedAutoGET } from "@/services/boffAPI"

/**
 * The wire shape of one `boffmedia_audit` row.
 *
 * Declared here rather than imported: the API's own `BoffMediaAuditRow` is a
 * Drizzle `$inferSelect` over the table, so it is a database type, not a
 * contract — and it is not exported from `@boffmedia/shared` at all. The first
 * version of this file imported it from there anyway and did not compile.
 */
interface AuditRow {
  id: number
  subjectType: string
  subjectId: number
  /** Dotted action, e.g. `event.status`, `match.amend`. */
  action: string
  /** null for system jobs, which act with no Boffmedia account. */
  actorUserId: number | null
  meta: Record<string, unknown> | null
  at: string
}

interface AuditLogsResponse {
  data: AuditRow[]
  total: number
}

const SUBJECT_TYPES = {
  EVENT: 'EVENT',
  TOURNAMENT: 'TOURNAMENT',
  PARTICIPANT: 'PARTICIPANT',
  MATCH: 'MATCH',
  REPORT: 'REPORT',
  CONTENT: 'CONTENT',
  USER: 'USER',
} as const;

export function AuditAdmin() {
  const t = useTranslations("admin.audit")
  const [logs, setLogs] = useState<AuditRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<{ subjectType?: string }>({})
  const [offset, setOffset] = useState(0)
  const limit = 50

  const loadLogs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        ...(filter.subjectType && { subjectType: filter.subjectType }),
      })
      // GET, not POST: the controller declares `@Get('logs')`. The first
      // version posted to it, so the viewer could never have loaded a row.
      const response = await apiAuthedAutoGET<AuditLogsResponse>(
        `/boffmedia/audit/logs?${params}`,
      )
      setLogs(response.data?.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [filter, offset])

  if (isLoading && logs.length === 0) {
    return (
      <div>
        <AvSectionHead title={t("title")} desc={t("desc")} />
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <AvSectionHead title={t("title")} desc={t("desc")} />
        <Empty
          icon="alert"
          title={t("loadFailed")}
          lead={error}
        />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div>
        <AvSectionHead title={t("title")} desc={t("desc")} />
        <Empty
          icon="clock"
          title={t("emptyTitle")}
          lead={t("emptyLead")}
        />
      </div>
    )
  }

  return (
    <div>
      <AvSectionHead title={t("title")} desc={t("desc")} />

      {/* Filter controls */}
      <div className="mb-6 flex gap-3">
        <select
          value={filter.subjectType ?? ""}
          onChange={(e) => {
            setFilter({ subjectType: e.target.value || undefined })
            setOffset(0)
          }}
          className="px-3 py-2 rounded border border-line bg-panel-1 text-txt-primary"
        >
          <option value="">{t("filterSubjectType")}</option>
          {Object.entries(SUBJECT_TYPES).map(([key, value]) => (
            <option key={value} value={value}>
              {key}
            </option>
          ))}
        </select>
      </div>

      {/* Audit logs table */}
      <div className="overflow-x-auto border border-line rounded">
        <table className="w-full text-sm">
          <thead className="bg-panel-2 border-b border-line">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-txt-primary">
                {t("colTime")}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-txt-primary">
                {t("colAction")}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-txt-primary">
                {t("colSubject")}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-txt-primary">
                {t("colActor")}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-txt-primary">
                {t("colMetadata")}
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-line hover:bg-panel-2 transition-colors"
              >
                <td className="px-4 py-3 text-txt-muted font-mono text-xs">
                  {formatAdminDate(log.at)}
                </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {log.action}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-panel-2 text-xs font-medium">
                      {log.subjectType}
                    </span>
                    <span className="text-txt-muted">#{log.subjectId}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {log.actorUserId ? (
                    <span className="text-txt-primary">User #{log.actorUserId}</span>
                  ) : (
                    <span className="text-txt-muted italic">{t("noActor")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-txt-muted font-mono max-w-xs truncate">
                  {log.meta ? JSON.stringify(log.meta) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-txt-muted">
          {t("pagination", {
            from: String(offset + 1),
            to: String(offset + logs.length),
            total: logs.length,
          })}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-3 py-2 rounded border border-line bg-panel-1 hover:bg-panel-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={logs.length < limit}
            className="px-3 py-2 rounded border border-line bg-panel-1 hover:bg-panel-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
