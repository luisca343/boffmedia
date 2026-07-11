"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import { CtCover } from "./CtCard"
import { CtStars } from "./CtAtoms"
import { CT_STATUS, ctRatingDist, type CtActivity, type CtGame } from "./catalog-util"

// Community rating histogram (deterministic per game). Mirrors .ct-dist.
export function CtRatingBars({ game, height = 66 }: { game: CtGame; height?: number }) {
  const dist = ctRatingDist(game)
  const max = Math.max(1, ...dist.counts)
  return (
    <div className="flex flex-col gap-[5px]">
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {dist.counts.map((c, i) => (
          <span key={i} className="relative flex h-full flex-1 items-end border border-solid border-line bg-panel-2" title={dist.buckets[i] + "★ · " + c.toLocaleString("es")}>
            <span className="min-h-[2px] w-full transition-[height] duration-[260ms] [background:linear-gradient(180deg,var(--accent-bright),var(--accent))]" style={{ height: (c / max) * 100 + "%" }} />
          </span>
        ))}
      </div>
      <div className="flex items-center gap-[3px] text-txt-dim [&_svg]:flex-1">
        <Icon name="star" size={11} />
        <span className="flex-[4]" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Icon key={i} name="star" size={11} />
        ))}
      </div>
    </div>
  )
}

// A collection preview (fanned cover stack + meta). Mirrors .ct-listcard.
export function CtListCard({ list, games, onOpen }: { list: { title: string; desc?: string; system?: boolean }; games: CtGame[]; onOpen?: () => void }) {
  const stack = games.slice(0, 5)
  return (
    <article onClick={onOpen} tabIndex={0} role="button" onKeyDown={(e) => e.key === "Enter" && onOpen?.()} className="group flex cursor-pointer gap-[14px] border border-solid border-line bg-panel p-[14px] transition-[border-color] duration-[140ms] hover:border-accent-line">
      <div className="relative h-[84px] w-[84px] flex-none">
        {stack.length === 0 ? (
          <span className="grid h-full w-full place-items-center border border-dashed border-line-2 bg-panel-2 text-txt-dim">
            <Icon name="layers" size={22} />
          </span>
        ) : (
          stack.map((g, i) => (
            <span key={g.id} className="absolute top-0 w-[46px] [box-shadow:0_2px_8px_rgba(0,0,0,0.4)]" style={{ left: i * 9, zIndex: i }}>
              <CtCover game={g} xs />
            </span>
          ))
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-body text-[16px]/[1.15] font-bold text-txt group-hover:text-accent">{list.title}</h4>
          <span className={cn("border border-solid px-1.5 py-[3px] font-mono text-[9px]/none font-semibold uppercase tracking-[0.1em]", list.system ? "border-line text-txt-muted" : "border-accent-line text-accent")}>{list.system ? "Boffmedia" : "Tuya"}</span>
        </div>
        {list.desc && <p className="my-[5px] line-clamp-2 font-body text-[12.5px]/[1.4] font-medium text-txt-muted">{list.desc}</p>}
        <span className="inline-flex items-center gap-[5px] font-mono text-[11px]/none font-semibold text-txt-dim">
          <Icon name="gamepad" size={12} />
          {games.length} {games.length === 1 ? "juego" : "juegos"}
        </span>
      </div>
    </article>
  )
}

// A feed entry — user · action · game · rating · optional review. Mirrors .ct-act.
export function CtActivityRow({ item, game, onOpen }: { item: CtActivity; game?: CtGame; onOpen?: (g: CtGame) => void }) {
  const s = item.status ? CT_STATUS[item.status] : null
  const verb = item.verb || (s ? s.verb.toLowerCase() : "registró")
  return (
    <div onClick={() => game && onOpen?.(game)} role={onOpen ? "button" : undefined} tabIndex={onOpen ? 0 : undefined} onKeyDown={(e) => onOpen && e.key === "Enter" && game && onOpen(game)} className="flex cursor-pointer gap-3 border-b border-solid border-line px-1 py-[14px] hover:bg-[color-mix(in_oklch,var(--panel)_60%,transparent)]">
      <span className="grid h-[34px] w-[34px] flex-none place-items-center border border-solid border-line-2 bg-panel-2 font-mono text-[11px]/none font-bold text-txt-muted">{(item.user || "AX").slice(0, 2).toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 font-body text-[14px]/[1.45] font-medium text-txt-muted [&_b]:font-bold [&_b]:text-txt">
          <b>{item.user || "axelcraft"}</b> {verb}{" "}
          <a
            className="cursor-pointer font-semibold text-txt hover:text-accent"
            onClick={(e) => {
              e.stopPropagation()
              game && onOpen?.(game)
            }}
          >
            {game ? game.title : "un juego"}
          </a>
          {item.rating ? <CtStars value={item.rating} size={12} /> : null}
        </p>
        {item.review && <p className="mt-1.5 border-l-2 border-solid border-line-2 pl-2.5 font-body text-[13px]/[1.5] font-medium text-txt-muted">“{item.review}”</p>}
        <span className="mt-1.5 inline-block font-mono text-[10px]/none font-semibold uppercase tracking-[0.08em] text-txt-dim">{item.time || "ahora"}</span>
      </div>
      {game && <CtCover game={game} xs className="w-[34px] flex-none self-start" />}
    </div>
  )
}
