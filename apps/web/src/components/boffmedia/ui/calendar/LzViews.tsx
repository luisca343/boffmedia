"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import { LzBannerCard, LzPosterCard } from "./LzCards"
import { LZ_MONTHS, LZ_ONE_DAY, LZ_PLATFORMS, LZ_WD, LZ_WD_LONG, lzKeyOf, lzParse, lzSameDay, lzWdShort, lzRelativeDays, type LzRelease } from "./calendar-util"

type WishSet = { has: (id: LzRelease["id"]) => boolean } | undefined
const platColor = (g: LzRelease) => LZ_PLATFORMS[g.platforms[0]]?.color

// Generic month grid (mon→sun). Knows no data: countFor(date)→n and
// renderDay(date)→node fill the cells. Mirrors .lz-cmon.
export function LzCalendarMonth({
  year,
  month,
  today = new Date(),
  renderDay,
  onSelectDay,
  countFor,
}: {
  year: number
  month: number
  today?: Date
  renderDay?: (d: Date, meta: { inMonth: boolean; isToday: boolean }) => React.ReactNode
  onSelectDay?: (d: Date) => void
  countFor?: (d: Date) => number
}) {
  const t = useTranslations("common.calendar")
  const start = new Date(year, month, 1 - ((new Date(year, month, 1).getDay() + 6) % 7))
  const weeks: Date[][] = []
  let cur = new Date(start)
  for (let w = 0; w < 6; w++) {
    const row: Date[] = []
    for (let dd = 0; dd < 7; dd++) {
      row.push(new Date(cur))
      cur = new Date(cur.getTime() + LZ_ONE_DAY)
    }
    weeks.push(row)
  }
  const trimmed = weeks[5].every((d) => d.getMonth() !== month) ? weeks.slice(0, 5) : weeks
  const cells = trimmed.flat()
  return (
    <div className="flex flex-col" role="grid" aria-label={LZ_MONTHS[month] + " " + year}>
      <div className="grid grid-cols-7" role="row">
        {LZ_WD.map((w, i) => (
          <span key={w} role="columnheader" className={cn("px-3 py-2.5 font-mono text-[10px]/none font-semibold uppercase tracking-[0.14em]", i >= 5 ? "text-[color:color-mix(in_oklab,var(--accent)_60%,var(--dim))]" : "text-txt-dim")}>
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, idx) => {
          const inMonth = d.getMonth() === month
          const isToday = lzSameDay(d, today)
          const n = countFor ? countFor(d) : 0
          return (
            <div
              key={lzKeyOf(d)}
              role="gridcell"
              onClick={() => n && onSelectDay && onSelectDay(d)}
              className={cn(
                "flex min-h-[118px] flex-col gap-1.5 border-l border-t border-solid border-line p-2",
                idx % 7 === 6 && "border-r",
                idx >= cells.length - 7 && "border-b",
                !inMonth && "bg-base-2",
                isToday && "bg-accent-soft [box-shadow:inset_0_0_0_1px_var(--accent-line)]",
                n > 0 && "cursor-pointer",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn("font-mono text-[14px]/none font-bold", isToday ? "text-accent" : inMonth ? "text-txt-muted" : "text-txt-dim")}>{d.getDate()}</span>
                {isToday && <span className="bg-accent px-[5px] py-[3px] font-mono text-[8px]/none font-bold uppercase tracking-[0.1em] text-accent-ink">{t("today")}</span>}
                {n > 0 && <span className="ml-auto font-mono text-[10px]/none font-bold text-txt-dim">{n}</span>}
              </div>
              <div className="flex min-h-0 flex-col gap-1">{renderDay && renderDay(d, { inMonth, isToday })}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// A date in the agenda (releases.com style): the date is a SEPARATOR, releases
// staggered below by hype (banners then poster grid). Mirrors .lz-group.
export function LzDateGroup({ date, items = [], today = new Date(), wished, onWish, onOpen, id }: { date: Date; items?: LzRelease[]; today?: Date; wished?: WishSet; onWish?: (id: LzRelease["id"]) => void; onOpen?: (g: LzRelease) => void; id?: string }) {
  const t = useTranslations("common.calendar")
  const days = Math.round((date.getTime() - today.getTime()) / LZ_ONE_DAY)
  const isToday = lzSameDay(date, today)
  const past = date < today && !isToday
  const has = wished && wished.has ? (gid: LzRelease["id"]) => wished.has(gid) : () => false
  const featured = items.filter((g) => g.hype >= 4).sort((a, b) => b.hype - a.hype)
  const normal = items.filter((g) => g.hype <= 3)
  return (
    <section id={id} className={cn("scroll-mt-[84px]", past && "opacity-50")}>
      <div className={cn("mb-[14px] flex items-baseline gap-3 border-b border-solid pb-[9px]", isToday ? "border-accent" : "border-line-2")}>
        <span className="inline-flex flex-none items-baseline gap-[7px]">
          <b className={cn("font-display text-[30px]/[0.9] font-extrabold italic tracking-[-0.01em]", isToday ? "text-accent" : "text-txt")}>{date.getDate()}</b>
          <span className="font-mono text-[12px]/none font-bold uppercase tracking-[0.14em] text-txt-muted">{LZ_MONTHS[date.getMonth()].slice(0, 3)}</span>
        </span>
        <span className="font-mono text-[12px]/none font-semibold capitalize tracking-[0.03em] text-txt-muted">{LZ_WD_LONG[(date.getDay() + 6) % 7]}</span>
        <span className={cn("font-mono text-[10px]/none font-semibold uppercase tracking-[0.08em]", isToday ? "text-accent" : "text-txt-dim")}>{isToday ? t("today") : lzRelativeDays(days)}</span>
        {isToday && <span className="bg-accent px-[7px] py-1 font-mono text-[9px]/none font-bold uppercase tracking-[0.12em] text-accent-ink">{t("today")}</span>}
        <span className="flex-1" />
        <span className="flex-none font-mono text-[11px]/none font-semibold uppercase tracking-[0.08em] text-txt-dim">
          {items.length} {t("premieres", { count: items.length })}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {featured.length > 0 && (
          <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${featured.length <= 2 ? 2 : 3}, minmax(0, 1fr))` }}>
            {featured.map((g) => (
              <LzBannerCard key={g.id} game={g} popular={g.hype >= 5} wished={has(g.id)} onWish={onWish} onOpen={onOpen} />
            ))}
          </div>
        )}
        {normal.length > 0 && (
          <div className="grid gap-x-3 gap-y-4 [grid-template-columns:repeat(auto-fill,minmax(158px,1fr))]">
            {normal.map((g) => (
              <LzPosterCard key={g.id} game={g} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// A 7-column week strip (mon→sun) with per-day cards. Mirrors .lz-week.
export function LzWeekStrip({ days, byDay, today, wished, onOpen }: { days: Date[]; byDay: Record<string, LzRelease[]>; today: Date; wished?: WishSet; onOpen?: (g: LzRelease) => void }) {
  const t = useTranslations("common.calendar")
  return (
    <div className="grid grid-cols-7">
      {days.map((d) => {
        const items = byDay[lzKeyOf(d)] || []
        const isToday = lzSameDay(d, today)
        return (
          <div key={lzKeyOf(d)} className={cn("flex min-h-[340px] flex-col border-l border-solid border-line first:border-l-0", isToday && "bg-accent-soft")}>
            <div className={cn("relative flex flex-col items-center gap-[3px] border-b border-solid px-2 py-3", isToday ? "border-accent-line" : "border-line")}>
              <span className="font-mono text-[10px]/none font-semibold uppercase tracking-[0.12em] text-txt-dim">{lzWdShort(d)}</span>
              <span className={cn("font-display text-[24px]/none font-extrabold italic", isToday && "text-accent")}>{d.getDate()}</span>
              {isToday && <span className="bg-accent px-[5px] py-[2px] font-mono text-[8px]/none font-bold uppercase tracking-[0.1em] text-accent-ink">{t("today")}</span>}
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-2">
              {items.length === 0 ? (
                <span className="pt-[14px] text-center font-mono text-[12px]/none font-semibold text-txt-dim">—</span>
              ) : (
                items.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onOpen && onOpen(g)}
                    title={g.title}
                    style={{ "--ph": platColor(g) } as React.CSSProperties}
                    className={cn("relative overflow-hidden border border-solid border-line py-[9px] pl-[14px] pr-2.5 text-left transition-[border-color,transform] duration-[140ms] hover:translate-x-[2px] hover:border-[color:var(--ph)]", g.hype >= 5 ? "bg-[color-mix(in_oklab,var(--accent)_8%,var(--panel-2))]" : "bg-panel-2")}
                  >
                    <span className="absolute bottom-0 left-0 top-0 w-1 bg-[color:var(--ph)]" />
                    <span className="mb-[7px] block text-[12.5px] font-semibold leading-[1.25]">
                      {g.title}
                      {wished && wished.has(g.id) && <Icon name="star" size={10} className="ml-[3px] inline-block fill-current align-middle text-warn" />}
                    </span>
                    <span className="flex gap-1">
                      {g.platforms.map((p) => (
                        <span key={p} title={LZ_PLATFORMS[p]?.label} className="h-2 w-2" style={{ background: LZ_PLATFORMS[p]?.color }} />
                      ))}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Horizontal month-by-month scroller. Mirrors .lz-tl.
export function LzTimeline({ releases, today, wished, onOpen }: { releases: LzRelease[]; today: Date; wished?: WishSet; onOpen?: (g: LzRelease) => void }) {
  const months = React.useMemo(() => {
    const m: Record<string, { y: number; mo: number; items: LzRelease[] }> = {}
    releases
      .filter((g) => g.date)
      .forEach((g) => {
        const d = lzParse(g.date as string)
        const k = d.getFullYear() + "-" + d.getMonth()
        ;(m[k] = m[k] || { y: d.getFullYear(), mo: d.getMonth(), items: [] }).items.push(g)
      })
    return Object.values(m)
      .sort((a, b) => a.y - b.y || a.mo - b.mo)
      .map((col) => ({ ...col, items: col.items.sort((a, b) => lzParse(a.date as string).getTime() - lzParse(b.date as string).getTime()) }))
  }, [releases])
  const todayKey = today.getFullYear() + "-" + today.getMonth()
  return (
    <div className="flex overflow-x-auto [scroll-snap-type:x_proximity]" role="list">
      {months.map((col) => {
        const key = col.y + "-" + col.mo
        const isNow = key === todayKey
        return (
          <div key={key} role="listitem" className={cn("flex flex-[0_0_264px] flex-col border-l border-solid border-line first:border-l-0 [scroll-snap-align:start]", isNow && "bg-[color-mix(in_oklab,var(--accent)_5%,transparent)]")}>
            <div className={cn("sticky top-0 z-[1] flex items-baseline gap-2 border-b border-solid bg-panel px-4 py-[14px]", isNow ? "border-b-2 border-accent" : "border-line")}>
              <span className={cn("font-display text-[20px]/none font-extrabold italic", isNow && "text-accent")}>{LZ_MONTHS[col.mo].charAt(0).toUpperCase() + LZ_MONTHS[col.mo].slice(1)}</span>
              <span className="font-mono text-[11px]/none font-semibold text-txt-dim">{col.y}</span>
              <span className="ml-auto border border-solid border-line bg-base-2 px-[7px] py-1 font-mono text-[11px]/none font-bold text-txt-muted">{col.items.length}</span>
            </div>
            <div className="flex flex-col gap-2 p-3">
              {col.items.map((g) => {
                const d = lzParse(g.date as string)
                const past = d < today && !lzSameDay(d, today)
                const isToday = lzSameDay(d, today)
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onOpen && onOpen(g)}
                    title={g.title}
                    style={{ "--ph": platColor(g) } as React.CSSProperties}
                    className={cn("flex gap-[11px] border border-solid border-line border-l-4 border-l-[color:var(--ph)] px-[11px] py-2.5 text-left transition-[border-color,transform] duration-[140ms] hover:translate-x-[2px] hover:border-line-2 hover:border-l-[color:var(--ph)]", past && "opacity-55", isToday && "[box-shadow:inset_0_0_0_1px_var(--accent-line)]", g.hype >= 5 ? "bg-[color-mix(in_oklab,var(--accent)_8%,var(--panel-2))]" : "bg-panel-2")}
                  >
                    <span className="flex min-w-[30px] flex-none flex-col items-center font-display text-[19px]/none font-extrabold italic">
                      {d.getDate()}
                      <small className="mt-1 font-mono text-[8px]/none font-semibold uppercase tracking-[0.08em] text-txt-dim">{lzWdShort(d)}</small>
                    </span>
                    <span className="flex min-w-0 flex-col gap-1.5">
                      <span className="text-[12.5px] font-semibold leading-[1.25]">
                        {g.title}
                        {wished && wished.has(g.id) && <Icon name="star" size={10} className="ml-[3px] inline-block fill-current align-middle text-warn" />}
                      </span>
                      <span className="flex gap-1">
                        {g.platforms.map((p) => (
                          <span key={p} className="h-2 w-2" style={{ background: LZ_PLATFORMS[p]?.color }} />
                        ))}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
