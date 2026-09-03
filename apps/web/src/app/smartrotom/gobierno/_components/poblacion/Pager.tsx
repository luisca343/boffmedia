import { Button } from "../ui"

// A minimal prev/next pager shared by every paginated register in Población + Gobierno.
// `t` is injected by the caller (this is a plain sub-render function, not a route-level
// server component, so it cannot call `getTranslations`/`useTranslations` itself).
export function Pager({
  page,
  pageSize,
  total,
  onChange,
  t,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const summary = t("common.pagerSummary", { page, totalPages, total })
  const prevLabel = t("common.paginaAnterior")
  const nextLabel = t("common.paginaSiguiente")

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <span className="font-gt-mono text-[0.65625rem] uppercase tracking-[.1em] text-gt-ink-400">{summary}</span>
      <div className="flex items-center gap-1.5">
        <Button
          tone="ghost"
          size="sm"
          icon="chevronLeft"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label={prevLabel}
        />
        <Button
          tone="ghost"
          size="sm"
          iconRight="chevronRight"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label={nextLabel}
        />
      </div>
    </div>
  )
}
