"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { WpMon } from "../../_types/market.types"
import { Icon } from "./Icon"
import { Sprite, SpriteStage } from "./Sprite"

/**
 * One cell of the PC grid — the sell flow's Pokémon picker and the trade modal's
 * "what you offer" grid. Lifts and takes an accent glow on hover, exactly like a
 * listing card, so a box of Pokémon reads as a grid of things you could sell.
 *
 * An empty slot is dashed and inert: it is not a button, it takes no focus, and it
 * says nothing to a screen reader.
 */
export function Slot({
  mon,
  selected = false,
  onClick,
  className,
}: {
  mon: WpMon | null
  selected?: boolean
  onClick?: () => void
  className?: string
}) {
  const t = useTranslations("wigglypop")
  if (!mon) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "aspect-square w-full rounded-wp-sm border-wp border-dashed border-wp-line/24 bg-[#fbeef5]",
          className,
        )}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative aspect-square w-full select-none overflow-hidden rounded-wp-sm border-wp",
        "bg-[linear-gradient(180deg,#ffffff,#fdf1f7)] shadow-wp-slot",
        "transition-[transform,border-color,box-shadow] duration-150 ease-wp motion-reduce:transform-none",
        "hover:z-[2] hover:-translate-y-[3px] hover:border-wp-accent hover:shadow-wp-glow",
        selected ? "border-wp-accent shadow-wp-glow" : "border-wp-line/24",
        className,
      )}
    >
      <SpriteStage mon={mon} dots={false} className="absolute inset-0 opacity-50" />
      <Sprite mon={mon} className="absolute inset-0 m-auto h-[86%] w-[86%]" />

      {mon.shiny && (
        <span className="absolute left-1 top-1 z-[3] text-wp-teal">
          <Icon name="sparkles" size={12} />
        </span>
      )}
      {selected && (
        <span className="absolute right-1 top-1 z-[4] flex h-[18px] w-[18px] items-center justify-center rounded-wp-pill bg-wp-accent text-white">
          <Icon name="check" size={11} stroke={3} />
        </span>
      )}
      <span className="wp-num absolute bottom-1 right-1 z-[3] rounded-[5px] bg-wp-fg/70 px-1 py-px font-wp text-[9px] text-white">
        {t("slot.level", { level: mon.level })}
      </span>
    </button>
  )
}
