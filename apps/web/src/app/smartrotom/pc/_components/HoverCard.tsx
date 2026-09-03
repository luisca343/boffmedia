"use client"

import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import type { Mon } from "../_types/pc.types"
import { displayName, isShiny, ivPct, typesOf } from "../_utils/derive"
import { Icon, Sprite, TypeBadge } from "./ui"

const WIDTH = 220

export interface HoverCardProps {
  mon: Mon
  /** The hovered slot's box, measured at hover time — the card is fixed-positioned. */
  rect: DOMRect
}

/** The peek. Everything here is already on screen or one click away; nothing is fetched. */
export function HoverCard({ mon, rect }: HoverCardProps) {
  const t = useTranslations("pc")
  const speciesByDex = usePokemonStore((s) => s.pokemonByDex)
  const p = mon.pokemon

  const vw = typeof window === "undefined" ? 1280 : window.innerWidth
  const vh = typeof window === "undefined" ? 800 : window.innerHeight

  // Flip to the slot's left when there is no room on its right.
  const flip = rect.right + 12 > vw - 240
  const left = flip ? rect.left - (WIDTH + 12) : rect.right + 12
  const top = Math.min(Math.max(12, rect.top + rect.height / 2 - 70), vh - 180)

  const types = typesOf(p, speciesByDex)
  const iv = ivPct(p)

  return (
    <div
      role="tooltip"
      style={{ top, left, width: WIDTH }}
      className="pointer-events-none fixed z-[9998] animate-pc-pop rounded-xl border border-pc-line-strong bg-pc-panel-solid px-3 py-2.5 font-pc text-pc-fg shadow-[0_24px_60px_-20px_rgb(0_0_0_/_.8)] motion-reduce:animate-none"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-[3.25rem] w-[3.25rem] flex-none items-center justify-center rounded-[10px] bg-white/[.04]">
          <Sprite dex={p.dex} form={p.form} palette={p.palette} className="h-[2.875rem] w-[2.875rem]" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[0.84375rem] font-bold">{displayName(p)}</span>
            {isShiny(p) && (
              <span className="flex-none text-pc-gold">
                <Icon name="sparkles" size={12} fill="rgb(var(--pc-gold))" />
              </span>
            )}
          </div>
          <div className="font-pc-mono text-[0.6875rem] text-pc-fg-subtle">
            #{String(p.dex).padStart(3, "0")} · Nv {p.level}
          </div>
        </div>
      </div>

      {types.length > 0 && (
        <div className="mt-2 flex gap-1.5">
          {types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[0.71875rem] text-pc-fg-muted">
        <span>
          {t("detail.nature")}: <b className="text-pc-fg">{p.nature || "—"}</b>
        </span>
        <span>
          {t("detail.stats")}: <b className={iv > 80 ? "text-pc-green" : "text-pc-fg"}>{iv}%</b>
        </span>
        <span className="w-full truncate">
          {t("filters.ability")}: <b className="text-pc-fg">{p.ability || "—"}</b>
        </span>
      </div>

      <div className="mt-2 font-pc-mono text-[0.65625rem] text-pc-fg-subtle">
        {t("team.dragHint")}
      </div>
    </div>
  )
}
