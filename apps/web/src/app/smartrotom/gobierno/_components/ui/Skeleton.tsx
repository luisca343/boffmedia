export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-gt-pulse rounded-gt-sm border border-gt-line bg-gt-paper-2 motion-reduce:animate-none ${className}`}
    />
  )
}

// The register's loading state: the table's own shape, not a spinner in a box.
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="px-3.5 py-2">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-gt-line-soft py-3 last:border-b-0">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={`h-3.5 ${c === 0 ? "w-28" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  )
}
