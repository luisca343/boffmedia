"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import { LzCover, LzVersList, LzWishStar } from "./LzAtoms"
import { LZ_GENRE_ICON, LZ_MONTHS, lzFollowers, lzParse, lzWdShort, type LzRelease } from "./calendar-util"

// The release cards: compact row (dense/dated), featured banner and poster.
// Prefix lz- in calendario.css. [deferred] cover art uses the striped LzCover
// placeholder until the Catálogo dataset (CtCover) is wired.

function onCardKey(e: React.KeyboardEvent, fn: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    fn()
  }
}

export function LzReleaseCard({ game, wished, onWish, onOpen, dense = false, showDate = false }: { game: LzRelease; wished?: boolean; onWish?: (id: LzRelease["id"]) => void; onOpen?: (g: LzRelease) => void; dense?: boolean; showDate?: boolean }) {
  const t = useTranslations("common.calendar")
  const max = dense ? 3 : 4
  const followers = lzFollowers(game)
  const dateLabel = game.date
    ? (() => {
        const d = lzParse(game.date)
        return lzWdShort(d) + " " + d.getDate() + " " + LZ_MONTHS[d.getMonth()].slice(0, 3)
      })()
    : game.window || t("noDate")
  const open = () => onOpen && onOpen(game)
  return (
    <article
      onClick={open}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => onCardKey(e, open)}
      className={cn("group flex cursor-pointer items-stretch gap-3 border border-solid border-line bg-panel p-2.5 outline-none transition-[border-color,background] duration-[140ms] hover:border-line-2 hover:bg-panel-2 focus-visible:[box-shadow:inset_0_0_0_1px_var(--accent-line)]", dense && "gap-2.5 p-2")}
    >
      <LzCover genre={game.genre} size={dense ? 18 : 24} className={cn(dense ? "w-[2.75rem]" : "w-[3.25rem]", "group-hover:border-line-2")} />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <h4 className={cn("line-clamp-2", dense ? "text-[0.84375rem]/[1.2]" : "text-[0.9375rem]/[1.2]")}>{game.title}</h4>
        <LzVersList platforms={game.platforms} max={max} />
        {showDate && (
          <div className="inline-flex items-center gap-[0.3125rem] font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.06em] text-txt-dim">
            <Icon name="calendar" size={11} className="text-txt-dim" />
            {dateLabel}
          </div>
        )}
      </div>
      <div className="flex min-w-[2.625rem] flex-none flex-col items-center justify-center gap-[3px] pl-1">
        <span className={cn("font-display font-extrabold italic text-txt", dense ? "text-[1.125rem]/none" : "text-[1.3125rem]/none")} title={t("viewCount", { count: followers })}>
          {followers}
        </span>
        <LzWishStar on={wished} onToggle={() => onWish && onWish(game.id)} size={dense ? 15 : 17} />
      </div>
    </article>
  )
}

export function LzBannerCard({ game, popular, wished, onWish, onOpen }: { game: LzRelease; popular?: boolean; wished?: boolean; onWish?: (id: LzRelease["id"]) => void; onOpen?: (g: LzRelease) => void }) {
  const t = useTranslations("common.calendar")
  const isPop = popular != null ? popular : game.hype >= 5
  const followers = lzFollowers(game)
  const gi = LZ_GENRE_ICON[game.genre] || "gamepad"
  const dateLabel = game.date
    ? (() => {
        const d = lzParse(game.date)
        const m = LZ_MONTHS[d.getMonth()].slice(0, 3)
        return m.charAt(0).toUpperCase() + m.slice(1) + " " + d.getDate()
      })()
    : game.window || "TBA"
  const open = () => onOpen && onOpen(game)
  return (
    <article
      onClick={open}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => onCardKey(e, open)}
      className={cn("group relative block min-h-[18.75rem] cursor-pointer overflow-hidden border border-solid border-line bg-panel outline-none transition-[border-color] duration-[140ms] hover:border-line-2 focus-visible:[box-shadow:inset_0_0_0_1px_var(--accent-line)]", isPop && "border-l-4 border-l-accent")}
    >
      <div aria-hidden className="absolute inset-0 grid place-items-center overflow-hidden [background:repeating-linear-gradient(135deg,var(--bg-2)_0_10px,var(--panel-2)_10px_20px)]">
        <span className="relative text-line-2 opacity-60 transition-transform duration-[260ms] group-hover:scale-[1.05]">
          <Icon name={gi} size={100} />
        </span>
        <span className="absolute inset-0 [background:linear-gradient(90deg,color-mix(in_oklab,var(--bg-deep)_90%,transparent)_0%,color-mix(in_oklab,var(--bg-deep)_60%,transparent)_44%,transparent_78%),linear-gradient(0deg,color-mix(in_oklab,var(--bg-deep)_82%,transparent)_0%,transparent_48%)]" />
        <span className="absolute right-3 top-[0.6875rem] z-[2] font-mono text-[0.5rem]/none font-semibold uppercase tracking-[0.14em] text-[color:color-mix(in_oklab,var(--text)_52%,transparent)]">key art · {game.title}</span>
      </div>
      <div className="relative z-[2] flex h-full w-[min(66%,18.75rem)] flex-col gap-[0.6875rem] p-[0.9375rem]">
        <span className="relative w-[7.375rem] flex-none [box-shadow:0_12px_32px_rgba(0,0,0,0.5)]">
          <span className={cn("absolute -left-2 -top-2 z-[3] inline-flex items-center gap-[0.3125rem] border border-solid px-[0.5625rem] py-1.5 font-mono text-[0.5625rem]/none font-bold uppercase tracking-[0.1em]", isPop ? "border-accent bg-accent text-accent-ink" : "border-accent-line bg-base-deep text-accent-bright")}>
            <Icon name="flame" size={11} />
            {isPop ? t("popular") : t("highlyAnticipated")}
          </span>
          <LzCover genre={game.genre} size={34} className="w-full border-line-2" />
        </span>
        <span className="mt-auto flex min-w-0 flex-col gap-2.5">
          <h3 className="line-clamp-2 text-[1.375rem]/[0.98] tracking-[-0.01em] text-txt [text-shadow:0_2px_16px_rgba(0,0,0,0.55)]">{game.title}</h3>
          <LzVersList platforms={game.platforms} max={3} icon />
          <span className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label={t("releaseCard", { title: game.title })}
              onClick={(e) => {
                e.stopPropagation()
                open()
              }}
              className="grid h-[1.875rem] w-9 flex-none place-items-center border border-solid border-accent bg-accent text-accent-ink transition-[background,border-color] duration-[140ms] cut cut-edge-slant hover:[--cut-line:var(--accent-bright)] [--cut-line:var(--accent)] [--cut:6px] hover:border-accent-bright hover:bg-accent-bright"
            >
              <Icon name="play" size={14} />
            </button>
            <button
              type="button"
              aria-pressed={wished}
              title={wished ? t("following") : t("followRelease")}
              onClick={(e) => {
                e.stopPropagation()
                onWish && onWish(game.id)
              }}
              className={cn("group/f inline-flex h-[1.875rem] items-center gap-1.5 border border-solid px-2.5 font-mono text-[0.6875rem]/none font-bold tracking-[0.02em] transition-[color,border-color,background] duration-[140ms]", wished ? "border-[color-mix(in_oklab,var(--warn)_55%,transparent)] bg-warn-soft text-warn" : "border-line-2 bg-panel-2 text-txt-muted hover:border-[color-mix(in_oklab,var(--warn)_55%,transparent)] hover:text-txt")}
            >
              <Icon name="bell" size={13} className={cn(wished ? "fill-current text-warn" : "text-txt-dim group-hover/f:text-warn")} />
              {followers}
            </button>
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem]/none font-bold uppercase tracking-[0.04em] text-[color:color-mix(in_oklab,var(--text)_80%,transparent)]">
              <Icon name="calendar" size={12} className="text-accent" />
              {dateLabel}
            </span>
          </span>
        </span>
      </div>
    </article>
  )
}

export function LzPosterCard({ game, onOpen }: { game: LzRelease; onOpen?: (g: LzRelease) => void }) {
  const open = () => onOpen && onOpen(game)
  return (
    <article onClick={open} tabIndex={0} role="button" onKeyDown={(e) => onCardKey(e, open)} className="group flex cursor-pointer flex-col gap-[0.5625rem] outline-none">
      <LzCover genre={game.genre} size={40} className="w-full group-hover:border-accent-line group-focus-visible:border-accent-line" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <h4 className="line-clamp-2 text-[0.90625rem]/[1.24] text-txt group-hover:text-accent" title={game.title}>
          {game.title}
        </h4>
        <LzVersList platforms={game.platforms} max={3} icon />
      </div>
    </article>
  )
}
