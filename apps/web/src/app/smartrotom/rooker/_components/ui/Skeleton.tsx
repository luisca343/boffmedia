"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

/** A loading block. Pulses, and honours the OS reduced-motion preference (§11). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-rk-md bg-rk-line motion-reduce:animate-none", className)} />
}

/**
 * The timeline's loading state — shaped like the posts it is standing in for, so the
 * layout does not jump when the real trinos land.
 */
export function PostSkeleton() {
  return (
    <div className="flex gap-3 border-b border-rk-line px-4 py-3.5">
      <Skeleton className="h-[46px] w-[46px] flex-none rounded-full" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-3.5 w-[38%]" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-[64%]" />
      </div>
    </div>
  )
}

export function FeedSkeleton({ rows = 5 }: { rows?: number }) {
  const t = useTranslations("rooker")
  return (
    <div aria-busy="true" aria-label={t("common.loadingPosts")}>
      {Array.from({ length: rows }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}
