import { Button } from "../ui"

// A minimal prev/next pager shared by every paginated register in Población + Gobierno.
export function Pager({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <span className="font-gt-mono text-[10.5px] uppercase tracking-[.1em] text-gt-ink-400">
        Página {page} de {totalPages} · {total} en total
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          tone="ghost"
          size="sm"
          icon="chevronLeft"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Página anterior"
        />
        <Button
          tone="ghost"
          size="sm"
          iconRight="chevronRight"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Página siguiente"
        />
      </div>
    </div>
  )
}
