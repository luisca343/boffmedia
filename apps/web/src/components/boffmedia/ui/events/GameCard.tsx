"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/boffmedia/primitives/badge"
import { Icon } from "@/components/boffmedia/primitives/icon"
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
}

export function GameCard({ game }: { game: GameLike }) {
  const t = useTranslations("juegos")
  const active = game.active !== 0 && !game.deletedAt
  return (
    <Link
      href={`/juegos/${game.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden border border-solid border-line bg-panel no-underline cut-corner [--cut-lg:18px]",
        "transition-[border-color,transform] duration-[140ms] hover:-translate-y-1 hover:border-accent-line",
        !active && "opacity-85",
      )}
    >
      <div className="relative aspect-[16/8] overflow-hidden border-b-2 border-accent bg-base-2">
        <ArtImage
          src={game.icon}
          alt=""
          fallback={
            <div className="absolute inset-0 grid place-items-center bg-panel-2">
              <Icon name="gamepad" size={64} className="text-line-2" />
            </div>
          }
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--panel)_2%,color-mix(in_srgb,var(--panel)_40%,transparent)_40%,transparent_80%)]" />
        <div className="absolute inset-x-0 top-0 flex items-center gap-2.5 p-3.5">
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
        <div className="mt-auto flex items-center gap-4 border-t border-dashed border-line pt-3.5">
          {game.createdAt && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px]/none uppercase tracking-[0.05em] text-txt-muted">
              <Icon name="calendar" size={13} className="text-accent" />
              {t("since", { date: formatEventDate(game.createdAt) })}
            </span>
          )}
          <Icon
            name="chevronRight"
            size={16}
            className="ml-auto flex-none text-txt-dim transition-[color,transform] duration-[140ms] group-hover:translate-x-1 group-hover:text-accent-bright"
          />
        </div>
      </div>
    </Link>
  )
}
