"use client"

import { memo, type MouseEvent, type PointerEvent } from "react"
import { useTranslations } from "next-intl"
import { useMarks, useSetMark } from "../_hooks/queries"
import { dropAttrs, isOver, useDragLayer } from "../_hooks/useDrag"
import { locId, usePcUi } from "../_stores/pcUiStore"
import type { Mon, SlotLoc } from "../_types/pc.types"
import { displayName, hasItem, isFainted, isShiny } from "../_utils/derive"
import { markOf } from "../_utils/marks"
import { GenderIconFor, Icon, ItemDot, Sprite } from "./ui"

export interface PokemonSlotProps {
  mon: Mon | null
  /**
   * `null` for a padded results cell: it draws as an empty slot so the results grid
   * keeps a box's exact frame, but it is nowhere, so it can never be a drop target.
   */
  loc: SlotLoc | null
  droppable?: boolean
  onHover?: (mon: Mon | null, el: HTMLElement | null) => void
}

/**
 * One storage cell. The state classes are additive rather than an enum because they
 * genuinely compose — a favourite can be selected, hovered as a drop target, and part
 * of a comparison at the same time.
 */
export const PokemonSlot = memo(function PokemonSlot({
  mon,
  loc,
  droppable = true,
  onHover,
}: PokemonSlotProps) {
  const t = useTranslations("pc")
  const { drag, beginDrag } = useDragLayer()
  const id = loc ? locId(loc) : ""

  const isDetail = usePcUi((s) => id !== "" && !s.multiMode && s.detail != null && locId(s.detail) === id)
  const isMulti = usePcUi((s) => id !== "" && s.multiMode && s.selected.has(id))
  const isCompare = usePcUi((s) => id !== "" && s.compare.includes(id))
  const multiMode = usePcUi((s) => s.multiMode)
  const setDetail = usePcUi((s) => s.setDetail)
  const toggleSelected = usePcUi((s) => s.toggleSelected)

  const { data: marks } = useMarks()
  const setMark = useSetMark()

  const p = mon?.pokemon
  const favorite = mon ? markOf(marks ?? {}, mon.key).favorite : false
  const dragging = !!drag?.active && id !== "" && drag.items.some((m) => locId(m.loc) === id)
  const dropping = !!drag?.active && droppable && !!loc && isOver(drag.over, loc)

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (mon) beginDrag(e, mon)
  }

  const onClick = () => {
    if (!mon || !loc || drag?.active) return
    if (multiMode) toggleSelected(locId(loc))
    else setDetail(loc)
  }

  // Right-click is the favourite toggle — the one destructive-free action worth a
  // shortcut, and the only use we make of the context menu.
  const onContextMenu = (e: MouseEvent<HTMLButtonElement>) => {
    if (!mon || setMark.isPending) return
    e.preventDefault()
    setMark.mutate({ key: mon.key, patch: { favorite: !favorite } })
  }

  const className = [
    "pc-slot",
    !mon && "pc-slot-empty",
    isDetail && "pc-slot-selected",
    isMulti && "pc-slot-multi",
    isCompare && "pc-slot-compare",
    dropping && "pc-slot-drop",
    dragging && "pc-slot-dragging",
    favorite && "pc-slot-fav",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button
      type="button"
      tabIndex={mon ? 0 : -1}
      aria-label={p ? `${displayName(p)}, ${t("detail.level")} ${p.level}` : t("team.emptySlot")}
      className={className}
      style={{ touchAction: "none" }}
      {...(droppable && loc ? dropAttrs(loc) : {})}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={(e) => mon && onHover?.(mon, e.currentTarget)}
      onMouseLeave={() => onHover?.(null, null)}
    >
      {p && (
        <>
          <Sprite
            dex={p.dex}
            form={p.form}
            palette={p.palette}
            className="absolute inset-[7%] h-[86%] w-[86%]"
          />

          {isShiny(p) && (
            <span className="absolute left-[3px] top-[3px] flex text-pc-gold">
              <Icon name="sparkles" size={13} fill="rgb(var(--pc-gold))" />
            </span>
          )}
          <span className="absolute right-[3px] top-[3px] flex">
            <GenderIconFor pokemon={p} size={13} />
          </span>
          {hasItem(p) && (
            <span className="absolute bottom-[3px] left-[3px] flex">
              <ItemDot pokemon={p} />
            </span>
          )}
          {favorite && (
            <span className="absolute bottom-[3px] right-[3px] flex text-pc-rose">
              <Icon name="heart" size={12} fill="rgb(var(--pc-rose))" />
            </span>
          )}

          {isFainted(p) && (
            <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-50 shadow-[inset_0_0_0_2px_rgb(var(--pc-rose))]" />
          )}

          {isMulti && (
            <span className="pointer-events-none absolute inset-0 flex items-start justify-end rounded-[inherit] bg-pc-cyan/[.18] p-1">
              <span className="flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-pc-pill bg-pc-cyan text-[#06222a]">
                <Icon name="check" size={12} stroke={3} />
              </span>
            </span>
          )}
        </>
      )}
    </button>
  )
})
