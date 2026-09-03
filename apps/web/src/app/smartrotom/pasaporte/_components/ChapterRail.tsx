"use client"

// DESK. The rail lives OUTSIDE every chapter's root, so `--ps-chapter` is not in scope
// here: each tab carries its chapter's spelled-out class (`Chapter.tab`), never an
// interpolated one.

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { ChapterKey } from "../_types"

export interface RailChapter {
  key: ChapterKey
  label: string
  /** "01", "02" … — the tab's engraved numeral. */
  no: string
  /** The page the tab flips to. */
  page: number
  /** A literal Tailwind class (`bg-ps-olive-deep`). */
  tab: string
}

/**
 * The index tabs down the left edge of the desk: 46px of colour, opening to 188px on
 * rail-hover or when active — like the thumb tabs cut into a real reference book.
 */
export function ChapterRail({
  chapters,
  active,
  onFlip,
}: {
  chapters: RailChapter[]
  /** Index into `chapters`, or −1 when the book is on a cover. */
  active: number
  onFlip: (page: number) => void
}) {
  const t = useTranslations("pasaporte")
  return (
    <nav
      aria-label={t("chapterRail.nav")}
      className="group/rail absolute left-[max(18px,3vw)] top-1/2 z-30 flex -translate-y-1/2 flex-col gap-[0.4375rem]"
    >
      {chapters.map((c, i) => {
        const isActive = i === active
        return (
          <button
            key={c.key}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onFlip(c.page)}
            className={cn(
              "flex w-[2.875rem] items-center gap-[0.5625rem] overflow-hidden whitespace-nowrap rounded-l-md rounded-r-[13px] py-[0.5625rem] pl-[0.6875rem] pr-3.5",
              "text-left font-ps text-[0.75rem] font-bold tracking-[.03em] text-white",
              "shadow-[2px_3px_0_rgba(0,0,0,.4)] transition-[width,opacity,transform] duration-200 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-gild focus-visible:ring-offset-2 focus-visible:ring-offset-ps-desk",
              c.tab,
              isActive
                ? "w-[11.75rem] translate-x-0 opacity-100"
                : "-translate-x-1.5 opacity-[.62] group-hover/rail:w-[11.75rem] group-hover/rail:translate-x-0 group-hover/rail:opacity-100",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-[0.4375rem] w-[0.4375rem] flex-none rounded-full",
                isActive ? "bg-white shadow-[0_0_7px_#fff]" : "bg-white/60",
              )}
            />
            <span className="ps-num font-ps-display text-[0.75rem] opacity-85">{c.no}</span>
            <span
              className={cn(
                "transition-opacity duration-200 motion-reduce:transition-none",
                isActive ? "opacity-100" : "opacity-0 group-hover/rail:opacity-100",
              )}
            >
              {c.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
