"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Badge, Icon } from "@/components/boffmedia/primitives"
import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"
import { formatEventDate } from "./events-util"

export interface GameLike {
  id: number
  title: string
  description?: string | null
  icon?: string | null
  active?: number
  createdAt?: string | null
  deletedAt?: string | null
  // ── Fields the games API does NOT provide yet — optional + deferred. ─────────
  /** [deferred] Per-game hue (CSS colour) — no game→hue field; falls back to accent. */
  hue?: string | null
  /** [deferred] Short code (e.g. "VGC") — not on the DTO. */
  short?: string | null
  /** [deferred] Total events for this game — not passed to the list card. */
  events?: number | null
  /** [deferred] Player count — not in the API. */
  players?: number | null
}

export function GameCard({ game }: { game: GameLike }) {
  const t = useTranslations("juegos")
  const active = game.active !== 0 && !game.deletedAt
  const hue = game.hue || "var(--accent)" // [deferred] no game→hue field

  return (
    <Link
      href={`/juegos/${game.id}`}
      style={{ "--ghue": hue } as React.CSSProperties}
      className={cn(
        "group relative flex flex-col overflow-hidden border border-solid border-line bg-panel no-underline cut-corner [--cut-lg:18px]",
        "transition-[border-color,transform] duration-[140ms] hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--ghue)_55%,var(--line))]",
        !active && "opacity-[0.86]",
      )}
    >
      <div className="relative aspect-[16/8] overflow-hidden border-b-2 border-[color-mix(in_srgb,var(--ghue)_70%,transparent)] bg-base-2">
        <ArtImage
          src={game.icon}
          alt=""
          fallback={
            <div className="absolute inset-0 grid place-items-center bg-panel-2">
              <Icon name="gamepad" size={64} className="text-line-2" />
            </div>
          }
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.35] mix-blend-multiply [background:repeating-linear-gradient(to_bottom,transparent_0_3px,rgba(0,0,0,0.2)_3px_4px)]"
        />
        <Icon name="gamepad" size={128} className="pointer-events-none absolute right-[-18px] top-1/2 z-[1] -translate-y-1/2 text-[var(--ghue)] opacity-[0.14]" />
        <div className="pointer-events-none absolute inset-0 z-[2] [background:linear-gradient(to_top,var(--panel)_2%,color-mix(in_srgb,var(--panel)_40%,transparent)_40%,transparent_80%),radial-gradient(120%_130%_at_88%_8%,color-mix(in_srgb,var(--ghue)_20%,transparent),transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 z-[3] flex items-center gap-2.5 p-3.5">
          <span className="grid h-9 w-9 flex-none place-items-center border-[1.5px] border-solid border-[color-mix(in_srgb,var(--ghue)_55%,var(--line-2))] bg-[color-mix(in_srgb,var(--ghue)_14%,var(--bg))] text-[var(--ghue)] cut-seal [--cut:6px]">
            <Icon name="gamepad" size={18} />
          </span>
          {/* [deferred] short code — omitted until the API has it */}
          {game.short && (
            <span className="font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.14em] text-txt">{game.short}</span>
          )}
          <span className="ml-auto">
            <Badge tone={active ? "ok" : "default"}>{active ? t("active") : t("inactive")}</Badge>
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[clamp(24px,2.2vw,30px)]/[0.98] text-txt">{game.title}</h3>
        {game.description && (
          <p className="mt-2 line-clamp-3 font-body text-[13.5px]/[1.5] text-txt-muted text-pretty">{game.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-line pt-3.5">
          {/* [deferred] events / players counts — not passed to the list card */}
          {game.events != null && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px]/none uppercase tracking-[0.05em] text-txt-muted [&_b]:font-bold [&_b]:text-txt">
              <Icon name="trophy" size={13} className="text-[var(--ghue)]" />
              <b>{game.events}</b> {t("detail.events")}
            </span>
          )}
          {game.players != null && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px]/none uppercase tracking-[0.05em] text-txt-muted [&_b]:font-bold [&_b]:text-txt">
              <Icon name="users" size={13} className="text-[var(--ghue)]" />
              <b>{game.players.toLocaleString("es-ES")}</b> jugadores
            </span>
          )}
          {game.createdAt && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px]/none uppercase tracking-[0.05em] text-txt-muted">
              <Icon name="calendar" size={13} className="text-txt-dim" />
              {t("since", { date: formatEventDate(game.createdAt) })}
            </span>
          )}
          <Icon
            name="arrow"
            size={16}
            className="ml-auto flex-none text-txt-dim transition-[color,transform] duration-[140ms] group-hover:translate-x-1 group-hover:text-accent-bright"
          />
        </div>
      </div>
    </Link>
  )
}
