// PAPER. The trainer's life on the server, in order.

import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { Milestone } from "../../_types"
import { chapterInk } from "../../_utils/chapters"
import { timelineDate } from "../../_utils/dates"
import { EmptyState, Icon, PageHead, Skeleton } from "../ui"

export function Cronica({ milestones, loading }: { milestones: Milestone[]; loading: boolean }) {
  const t = useTranslations("pasaporte")
  const locale = useLocale()

  if (loading) {
    return (
      <>
        <PageHead eyebrow={t("cronica.eyebrow")} title={t("cronica.title")} />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="mb-2.5 h-[52px]" />
        ))}
      </>
    )
  }

  if (milestones.length === 0) {
    return (
      <>
        <PageHead eyebrow={t("cronica.eyebrow")} title={t("cronica.title")} />
        <EmptyState icon="flag" title={t("cronica.empty.title")} sub={t("cronica.empty.sub")} />
      </>
    )
  }

  // The most recent chapter of a life is the one worth reading first on a single leaf.
  const shown = milestones.slice(-8)

  return (
    <>
      <PageHead eyebrow={t("cronica.eyebrow")} title={t("cronica.title")} />

      <ol className="relative py-0.5">
        {shown.map((milestone, i) => {
          const date = timelineDate(milestone.date, locale)
          // The accent is a NAME on the milestone; the ink comes from the literal token map,
          // never from an interpolated class (§4).
          const ink = chapterInk(milestone.accent).accent

          return (
            <li
              key={milestone.id}
              className="relative grid grid-cols-[50px_32px_1fr] items-stretch gap-[9px] py-1"
            >
              <div className="pt-[5px] text-right">
                <b className="ps-num block font-ps-ceremony text-[14px] leading-none text-ps-ink">
                  {date.day} {date.month}
                </b>
                <span className="ps-num font-ps-mono text-[9px] text-ps-ink-faint">{date.year}</span>
              </div>

              <div className="relative flex justify-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-ps-gild-lo to-ps-gild opacity-45",
                    i === 0 ? "top-[15px]" : "-top-1",
                    i === shown.length - 1 ? "h-[17px]" : "-bottom-1",
                  )}
                />
                <span
                  style={{ background: `rgb(${ink})` }}
                  className={cn(
                    "relative z-[2] mt-[3px] grid place-items-center rounded-full text-white",
                    "shadow-[0_0_0_3px_rgb(var(--ps-paper)),0_2px_5px_rgba(0,0,0,.25)]",
                    milestone.big ? "h-9 w-9" : "h-[30px] w-[30px]",
                  )}
                >
                  <Icon
                    name={milestone.icon}
                    className={milestone.big ? "h-[19px] w-[19px]" : "h-4 w-4"}
                  />
                </span>
              </div>

              <div
                style={{
                  borderLeftColor: `rgb(${ink})`,
                  ...(milestone.big
                    ? { background: `linear-gradient(180deg, rgb(${ink} / .15), rgba(255,255,255,.2))` }
                    : {}),
                }}
                className={cn(
                  "rounded-[9px] border border-l-[3px] border-ps-ink/22 px-2.5 py-[7px]",
                  !milestone.big && "bg-gradient-to-b from-white/50 to-white/[.16]",
                )}
              >
                <div
                  className={cn(
                    "font-ps-ceremony leading-[1.05]",
                    milestone.big ? "text-[17px]" : "text-[15px]",
                  )}
                >
                  {milestone.title}
                </div>
                {milestone.desc && (
                  <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-[1.35] text-ps-ink-soft">
                    {milestone.desc}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}
