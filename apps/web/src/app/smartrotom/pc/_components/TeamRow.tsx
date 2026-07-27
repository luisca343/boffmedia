"use client"

import type { PointerEvent as ReactPointerEvent } from "react"
import { useTranslations } from "next-intl"
import { useMarks, useSetMark } from "../_hooks/queries"
import { dropAttrs, isOver, useDragLayer } from "../_hooks/useDrag"
import { locId, usePcUi } from "../_stores/pcUiStore"
import type { Mon, SlotLoc } from "../_types/pc.types"
import { displayName, hpPct, isFainted, isShiny } from "../_utils/derive"
import { markOf } from "../_utils/marks"
import { Bar, Icon, ItemDot, Sprite, hpTone } from "./ui"

export interface TeamRowProps {
  mon: Mon | null
  index: number
}

/**
 * One of the six live party slots. Unlike a storage slot it is a row, not a tile —
 * it has the room to carry the thing only a party member has: live HP.
 */
export function TeamRow({ mon, index }: TeamRowProps) {
  const t = useTranslations("pc")
  const loc: SlotLoc = { kind: "party", index }
  const { drag, beginDrag } = useDragLayer()
  const detail = usePcUi((s) => s.detail)
  const setDetail = usePcUi((s) => s.setDetail)
  const multiMode = usePcUi((s) => s.multiMode)
  const selected = usePcUi((s) => s.selected)
  const toggleSelected = usePcUi((s) => s.toggleSelected)
  const { data: marks } = useMarks()
  const setMark = useSetMark()

  const over = isOver(drag?.active ? drag.over : null, loc)
  const id = locId(loc)

  if (!mon) {
    return (
      <div
        {...dropAttrs(loc)}
        className={[
          "flex h-14 flex-none touch-none items-center gap-2.5 rounded-pc-sm border border-dashed pl-3.5",
          "bg-gradient-to-b from-white/[.015] to-black/[.12] transition-colors",
          over ? "border-solid border-pc-green bg-pc-green/[.12]" : "border-pc-line",
        ].join(" ")}
      >
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-pc-pill border border-pc-line-strong font-pc-mono text-[11px] text-pc-fg-subtle">
          {index + 1}
        </span>
        <span className="text-xs text-pc-fg-subtle">{t("team.emptySlot")}</span>
      </div>
    )
  }

  const p = mon.pokemon
  const fav = marks ? markOf(marks, mon.key).favorite : false
  const isDetail = !multiMode && detail != null && locId(detail) === id
  const isMulti = multiMode && selected.has(id)
  const pct = Math.round(hpPct(p) * 100)

  const onPointerDown = (e: ReactPointerEvent) => beginDrag(e, mon)
  const onClick = () => {
    if (multiMode) toggleSelected(id)
    else setDetail(loc)
  }

  return (
    <div
      {...dropAttrs(loc)}
      role="button"
      tabIndex={0}
      aria-label={displayName(p)}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        if (!setMark.isPending) setMark.mutate({ key: mon.key, patch: { favorite: !fav } })
      }}
      className={[
        "flex h-14 flex-none cursor-pointer touch-none items-center gap-[9px] rounded-pc-sm border py-0 pl-1.5 pr-2.5",
        "bg-gradient-to-b from-[rgb(13_20_36_/_.5)] to-[rgb(9_14_26_/_.65)] transition-colors focus-visible:outline-none",
        over
          ? "border-pc-green shadow-[0_0_0_2px_rgb(var(--pc-green))]"
          : isDetail
            ? "border-pc-accent shadow-[0_0_0_1px_rgb(var(--pc-accent)_/_.4),0_0_24px_-2px_rgb(var(--pc-accent)_/_.35)]"
            : "border-pc-line hover:border-pc-line-strong",
        isMulti ? "bg-pc-cyan/[.14]" : "",
        isFainted(p) ? "opacity-60 grayscale" : "",
      ].join(" ")}
    >
      <Icon name="grip" size={14} className="flex-none text-pc-fg-subtle" />

      <div className="relative h-10 w-10 flex-none">
        <Sprite dex={p.dex} form={p.form} palette={p.palette} className="h-full w-full" />
        {isShiny(p) && (
          <Icon
            name="sparkles"
            size={10}
            fill="currentColor"
            className="absolute -left-0.5 -top-0.5 text-pc-gold"
          />
        )}
        {fav && (
          <Icon
            name="heart"
            size={10}
            fill="currentColor"
            className="absolute -right-0.5 -top-0.5 text-pc-rose"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[12.5px] font-bold text-pc-fg">{displayName(p)}</span>
          <span className="flex-none font-pc-mono text-[10.5px] text-pc-fg-subtle">Nv{p.level}</span>
        </div>
        <div className="mt-[3px] flex items-center gap-[5px]">
          <Bar pct={pct} tone={hpTone(hpPct(p))} height={5} className="flex-1" />
          <ItemDot pokemon={p} />
        </div>
      </div>
    </div>
  )
}
