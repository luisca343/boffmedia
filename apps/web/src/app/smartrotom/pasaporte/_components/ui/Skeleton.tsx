// PAPER. The stock while the ink is still drying.

import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("ps-skeleton rounded-lg animate-ps-shimmer motion-reduce:animate-none", className)}
    />
  )
}
