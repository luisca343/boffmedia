import { cn } from "@/lib/utils"

/** Shimmer placeholder. Shape it with utilities (h-*, w-*, aspect-*, rounded-*). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-mw-md bg-mw-800", className)} aria-hidden="true" />
}

/** Card-shaped skeleton matching VideoCard / StreamCard (16:9 + avatar + lines). */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col", className)} aria-hidden="true">
      <Skeleton className="aspect-video rounded-mw-xl" />
      <div className="flex gap-2.5 px-1 pb-1 pt-3">
        <Skeleton className="h-9 w-9 flex-none rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}
