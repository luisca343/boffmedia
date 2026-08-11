"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Badge, Icon } from "@boffmedia/ui"
import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"
import { useFormat } from "@boffmedia/ui/useFormat"
import { formatEventDate } from "./events-util"
import type { GameLike } from "./GameCard"

/**
 * Full-bleed game-page header: art background, seal + identity, and a broadcast
 * stats bar (events · en curso · jugadores · desde).
 */
export function GameHero({
  game,
  eventCount,
  liveCount,
  className,
  children,
}: {
  game: GameLike
  eventCount: number
  /** [deferred] Live-event count — not passed on the real page. */
  liveCount?: number | null
  className?: string
  children?: React.ReactNode
}) {
  const t = useTranslations("juegos")
  const { intlLocale, number: formatNumber } = useFormat()
  const active = game.active !== 0 && !game.deletedAt
  const hue = game.hue || "var(--accent)" // [deferred] no game→hue field

  return (
    <div
      style={{ "--ghue": hue } as React.CSSProperties}
      className={cn(
        "relative flex min-h-[420px] flex-col justify-end overflow-hidden border-b-[3px] border-[color-mix(in_srgb,var(--ghue)_75%,transparent)] bg-base-2",
        className,
      )}
    >
      <div className="absolute inset-0 z-0">
        <ArtImage
          src={game.icon}
          alt=""
          fallback={
            <div className="absolute inset-0 grid place-items-center bg-panel-2">
              <Icon name="gamepad" size={140} className="text-line-2" />
            </div>
          }
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] [background:linear-gradient(to_top,var(--bg)_2%,color-mix(in_srgb,var(--bg)_60%,transparent)_42%,transparent_82%),linear-gradient(100deg,color-mix(in_srgb,var(--bg)_82%,transparent)_6%,color-mix(in_srgb,var(--bg)_20%,transparent)_48%,transparent_70%),radial-gradient(120%_120%_at_90%_6%,color-mix(in_srgb,var(--ghue)_18%,transparent),transparent_52%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] opacity-40 mix-blend-multiply [background:repeating-linear-gradient(to_bottom,transparent_0_3px,rgba(0,0,0,0.2)_3px_4px)]" />
      <Icon name="gamepad" size={340} className="pointer-events-none absolute right-[-30px] top-[-20px] z-[1] text-[var(--ghue)] opacity-[0.13]" />

      <div className="relative z-[2] max-w-[1000px] px-[clamp(22px,3.2vw,40px)] pb-[26px] pt-10">
        <div className="mb-4 flex flex-wrap items-center gap-3.5">
          <span className="grid h-[54px] w-[54px] flex-none place-items-center border-[1.5px] border-solid border-[color-mix(in_srgb,var(--ghue)_55%,var(--line-2))] bg-[color-mix(in_srgb,var(--ghue)_14%,var(--bg))] text-[var(--ghue)] cut-seal cut-seal-edge [--cut-w:1.5px] [--cut-line:color-mix(in_srgb,var(--ghue)_55%,var(--line-2))] [--cut:7px]">
            <Icon name="gamepad" size={27} />
          </span>
          {/* [deferred] short code — omitted until the API has it */}
          {game.short && (
            <span className="font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.16em] text-txt-muted">{game.short}</span>
          )}
          <Badge tone={active ? "ok" : "default"}>{active ? t("active") : t("inactive")}</Badge>
        </div>
        <h1 className="text-[clamp(44px,5.4vw,82px)]/[0.9]">{game.title}</h1>
        {game.description && (
          <p className="mt-3.5 max-w-[66ch] font-body text-[17px]/[1.55] text-txt-muted text-pretty">{game.description}</p>
        )}
        {children && <div className="mt-[22px] flex flex-wrap gap-3">{children}</div>}
      </div>

      <div className="relative z-[3] flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-solid border-[color-mix(in_srgb,var(--ghue)_30%,var(--line))] bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] px-[clamp(22px,3.2vw,40px)] py-[13px] backdrop-blur-[6px]">
        <span className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-[11px]/none font-semibold uppercase tracking-[0.09em] text-txt-muted [&_b]:font-bold [&_b]:text-txt">
          <Icon name="trophy" size={14} className="text-[var(--ghue)]" />
          <b>{eventCount}</b> {t("detail.events")}
        </span>
        {/* [deferred] live-event count — omitted on the real page */}
        {liveCount != null && (
          <span className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-[11px]/none font-semibold uppercase tracking-[0.09em] text-txt-muted [&_b]:font-bold [&_b]:text-txt">
            <Icon name="bolt" size={14} className="text-[var(--ghue)]" />
            <b>{liveCount}</b> en curso
          </span>
        )}
        {/* [deferred] player count — not in the API */}
        {game.players != null && (
          <span className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-[11px]/none font-semibold uppercase tracking-[0.09em] text-txt-muted [&_b]:font-bold [&_b]:text-txt">
            <Icon name="users" size={14} className="text-[var(--ghue)]" />
            <b>{formatNumber(game.players)}</b> jugadores
          </span>
        )}
        {game.createdAt && (
          <span className="ml-auto inline-flex items-center gap-2 whitespace-nowrap font-mono text-[11px]/none font-medium uppercase tracking-[0.09em] text-txt-dim">
            <Icon name="calendar" size={14} className="text-txt-dim" />
            {t("since", { date: formatEventDate(game.createdAt, intlLocale) })}
          </span>
        )}
      </div>
    </div>
  )
}
