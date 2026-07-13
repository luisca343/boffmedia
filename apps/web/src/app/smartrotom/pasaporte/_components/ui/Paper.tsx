// PAPER. Everything inside the book stands on this. Ink is `text-ps-ink*`; desk chrome
// colours put here render invisible.

import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * A soft page's surface: guilloché security print, paper grain, foxing at the edges — all
 * of it in `.ps-paper-surface`, plus the gutter shade for the side it is bound on. A page
 * without the gutter reads as a flat rectangle instead of half of an open book.
 */
export function Paper({
  side,
  children,
  className,
  style,
}: {
  side: "left" | "right"
  children?: ReactNode
  className?: string
  /** The chapter's `chapterVars(accent)` pair goes here. */
  style?: CSSProperties
}) {
  return (
    <div
      style={style}
      className={cn(
        "ps-paper-surface relative flex h-full w-full flex-col overflow-hidden px-[34px] py-[30px]",
        "font-ps text-ps-ink",
        side === "left" ? "ps-gutter-l" : "ps-gutter-r",
        className,
      )}
    >
      {children}
    </div>
  )
}
