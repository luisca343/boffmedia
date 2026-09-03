// PAPER.

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { RailChapter } from "../ChapterRail"
import { PageHead } from "../ui"

/**
 * The table of contents. Each row carries its chapter's spine chip and numeral in that
 * chapter's own ink — spelled-out classes, because the accent of a row is NOT the accent of
 * the page it is printed on (and see `Chapter.deep` / `Chapter.tab`).
 */
export function Indice({
  chapters,
  onFlip,
}: {
  chapters: (RailChapter & { deep: string })[]
  onFlip: (page: number) => void
}) {
  const t = useTranslations("pasaporte")
  return (
    <>
      <PageHead eyebrow={t("indice.eyebrow")} title={t("indice.title")} />

      <div className="flex flex-col gap-0.5">
        {chapters.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onFlip(c.page)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-[0.5625rem] text-left text-ps-ink",
              "transition-colors duration-200 hover:bg-white/40 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-chapter",
            )}
          >
            <span aria-hidden="true" className={cn("h-[1.125rem] w-1 flex-none rounded-sm", c.tab)} />
            <span className={cn("ps-num w-[1.625rem] flex-none font-ps-display text-[0.8125rem] font-bold", c.deep)}>
              {c.no}
            </span>
            <span className="flex-none font-ps-ceremony text-[1.0625rem]">{c.label}</span>
            <span aria-hidden="true" className="mx-1 mb-1 flex-1 border-b-2 border-dotted border-ps-ink/22" />
            <span className="ps-num flex-none font-ps-mono text-[0.75rem] text-ps-ink-faint">p.{c.page}</span>
          </button>
        ))}
      </div>
    </>
  )
}
