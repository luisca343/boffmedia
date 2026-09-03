"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Verified } from "./Verified"
import { useFormat } from "../../_hooks/useFormat"
import type { RookerAuthor } from "../../_types"

/**
 * The name · @handle · time line above every trino.
 *
 * The name shrinks by 1px in compact density and the whole row wraps rather than
 * truncating — a Minecraft username can be 16 characters and a handle 32, and clipping
 * the handle is worse than a second line.
 */
export interface AuthorLineProps {
  author: RookerAuthor
  createdAt: string | null
  compact?: boolean
  className?: string
}

export function AuthorLine({ author, createdAt, compact = false, className }: AuthorLineProps) {
  const { relTime } = useFormat()
  const name = author.displayName || author.username

  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-x-[0.3125rem] gap-y-0", className)}>
      {author.handle ? (
        <Link
          href={`/smartrotom/rooker/${author.handle}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "whitespace-nowrap font-bold text-rk-fg hover:underline",
            compact ? "text-[0.875rem]" : "text-[0.9375rem]",
          )}
        >
          {name}
        </Link>
      ) : (
        <span className={cn("whitespace-nowrap font-bold text-rk-fg", compact ? "text-[0.875rem]" : "text-[0.9375rem]")}>
          {name}
        </span>
      )}

      {author.isVerified && <Verified size={compact ? 13 : 15} />}

      {author.handle && (
        <span
          className={cn("whitespace-nowrap text-rk-fg-subtle", compact ? "text-[0.8125rem]" : "text-[0.875rem]")}
        >
          @{author.handle}
        </span>
      )}
      <span className="text-[0.8125rem] text-rk-fg-subtle" aria-hidden="true">
        ·
      </span>
      <time
        dateTime={createdAt ?? undefined}
        className={cn("whitespace-nowrap text-rk-fg-subtle", compact ? "text-[0.8125rem]" : "text-[0.875rem]")}
      >
        {relTime(createdAt)}
      </time>
    </div>
  )
}
