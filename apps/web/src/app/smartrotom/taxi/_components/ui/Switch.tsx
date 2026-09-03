import { cn } from "@/lib/utils"

/** A blue toggle — structure, not spend. Presentational: the row around it owns the click. */
export function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative h-6 w-[2.625rem] shrink-0 rounded-xl border border-solid transition-colors duration-200",
        "after:absolute after:left-0.5 after:top-0.5 after:h-[1.125rem] after:w-[1.125rem] after:rounded-full",
        "after:transition-[transform,background] after:duration-200 after:ease-tx",
        on
          ? "bg-tx-blue-600 border-tx-blue-500 after:translate-x-[18px] after:bg-white"
          : "bg-tx-surface-2 border-tx-line-2 after:bg-tx-txt-2",
      )}
    />
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-tx-sm bg-tx-surface-2 motion-reduce:animate-none", className)} />
}
