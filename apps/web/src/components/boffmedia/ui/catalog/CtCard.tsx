"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import { LzPlatformPills } from "@/components/boffmedia/ui/calendar"
import { CtStars, CtLogButton, CtStatusPill } from "./CtAtoms"
import { CT_GENRE_ICON, CT_STATUS, useCtRating, useCtStatus, type CtGame } from "./catalog-util"

// Striped 2:3 cover placeholder with a genre glyph. [deferred] real box art
// (image-slot / ctCoverUrl) not wired locally. Mirrors .ct-cover.
export function CtCover({ game, className, xs = false, children }: { game: CtGame; className?: string; xs?: boolean; children?: React.ReactNode }) {
  const gi = CT_GENRE_ICON[game.genres[0]] || "gamepad"
  return (
    <span className={cn("relative block aspect-[2/3] overflow-hidden border border-solid border-line [background:repeating-linear-gradient(135deg,var(--stripe)_0_2px,transparent_2px_9px),linear-gradient(160deg,var(--panel-2),var(--panel))]", className)}>
      <span className="absolute inset-0 grid place-items-center text-txt-dim opacity-50">
        <Icon name={gi} size={xs ? 20 : 38} />
      </span>
      <span className={cn("absolute left-2 right-2 z-[1] font-display font-extrabold italic uppercase tracking-[0.01em] text-txt [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]", xs ? "bottom-3 left-[5px] right-[5px] line-clamp-2 text-[9px]/[1.02]" : "bottom-5 line-clamp-3 text-[clamp(12px,1.1vw,15px)]/[1.02]")}>{game.title}</span>
      {!xs && <span className="absolute bottom-1.5 left-2 z-[1] font-mono text-[9px]/none font-semibold tracking-[0.1em] text-txt-muted">{game.year}</span>}
      {children}
    </span>
  )
}

export function CtGameCard({ game, variant = "comoda", onOpen }: { game: CtGame; variant?: "poster" | "comoda" | "fila"; onOpen?: (g: CtGame) => void }) {
  const t = useTranslations("common.catalog")
  const status = useCtStatus(game.id)
  const mine = useCtRating(game.id)
  const s = status ? CT_STATUS[status] : null
  const open = () => onOpen?.(game)
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      open()
    }
  }

  if (variant === "fila") {
    return (
      <article onClick={open} tabIndex={0} role="button" onKeyDown={key} className="grid cursor-pointer grid-cols-[42px_1fr_auto_auto] items-center gap-[14px] border border-solid border-line bg-panel px-[14px] py-2.5 transition-[border-color,background] duration-[140ms] hover:border-accent-line hover:bg-panel-2 max-[720px]:grid-cols-[42px_1fr]">
        <CtCover game={game} xs />
        <div className="group min-w-0">
          <div className="flex items-baseline gap-2">
            <h4 className="font-body text-[15px]/[1.1] font-bold text-txt">{game.title}</h4>
            <span className="font-mono text-[11px]/none font-semibold text-txt-dim">{game.year}</span>
          </div>
          <p className="mt-[3px] font-body text-[12px]/[1.3] font-medium text-txt-muted">
            {game.developer} · {game.genres.slice(0, 2).join(" · ")}
          </p>
          <div className="mt-1.5">
            <LzPlatformPills platforms={game.platforms} compact max={5} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 max-[720px]:col-start-2 max-[720px]:items-start">
          <CtStars value={game.rating} size={14} count={game.ratingCountK + "K"} />
          {s && <CtStatusPill status={status!} size="sm" />}
        </div>
        <span className="flex-none max-[720px]:col-start-2" onClick={(e) => e.stopPropagation()}>
          <CtLogButton gameId={game.id} size="sm" />
        </span>
      </article>
    )
  }

  const poster = variant === "poster"
  return (
    <article onClick={open} tabIndex={0} role="button" onKeyDown={key} className="group flex cursor-pointer flex-col outline-none">
      <CtCover game={game} className="transition-[border-color,transform] duration-[140ms] group-hover:border-accent-line group-focus-visible:border-accent-line">
        {s && (
          <span style={{ "--sc": s.color } as React.CSSProperties} title={t(`status.${status}.label`)} className="absolute left-1.5 top-1.5 z-[3] grid h-[22px] w-[22px] place-items-center bg-[color:var(--sc)] text-accent-ink [box-shadow:0_2px_8px_rgba(0,0,0,0.4)]">
            <Icon name={s.icon} size={12} className={status === "wishlist" ? "fill-current" : undefined} />
          </span>
        )}
        {mine > 0 && (
          <span className="absolute right-1.5 top-1.5 z-[3] inline-flex items-center gap-0.5 bg-[rgba(0,0,0,0.72)] px-1.5 py-0.5 font-mono text-[10px]/none font-bold text-accent">
            <Icon name="star" size={10} className="fill-current" />
            {mine}
          </span>
        )}
        <span className="absolute inset-x-1.5 bottom-1.5 z-[3] translate-y-1 opacity-0 transition-[opacity,transform] duration-[140ms] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100" onClick={(e) => e.stopPropagation()}>
          <CtLogButton gameId={game.id} size="sm" block />
        </span>
      </CtCover>
      {!poster && (
        <div className="px-0.5 pb-1 pt-2">
          <h4 className="line-clamp-2 font-body text-[14px]/[1.15] font-bold text-txt group-hover:text-accent">{game.title}</h4>
          <div className="mt-1 flex items-center gap-1.5 font-body text-[11.5px]/none font-medium text-txt-muted">
            <span>{game.year}</span>
            <span className="text-txt-dim">·</span>
            <span>{game.genres[0]}</span>
          </div>
          <div className="mt-2 flex items-center gap-[7px]">
            <CtStars value={game.rating} size={13} />
            <span className="font-mono text-[12px]/none font-bold text-txt-muted">{game.rating.toFixed(1)}</span>
          </div>
        </div>
      )}
    </article>
  )
}
