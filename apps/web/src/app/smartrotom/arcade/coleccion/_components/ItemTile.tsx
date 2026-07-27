"use client"

import { useTranslations } from "next-intl"
import type { ArcadeInventoryItem } from "@boffmedia/shared"
import { ItemImage } from "@/lib/ItemImage"
import { remaining } from "../../_utils/inventory"
import { raritySkin } from "../../_utils/rarity"

export interface ItemTileProps {
  item: ArcadeInventoryItem
  name: string
  onClick: () => void
}

/** One item in the collection grid, skinned by its rarity (data-driven → inline). */
export function ItemTile({ item, name, onClick }: ItemTileProps) {
  const t = useTranslations("arcade")
  const skin = raritySkin(item.rarity)
  const count = remaining(item)

  return (
    <button
      type="button"
      onClick={onClick}
      className="ar-lift relative rounded-[10px] border p-3 text-left"
      style={{
        background: `linear-gradient(180deg, ${skin.bg}, rgba(0,0,0,0.55))`,
        borderColor: skin.bd,
      }}
    >
      <div
        className="mb-2 grid aspect-square w-full place-items-center overflow-hidden rounded-lg border"
        style={{
          background: `radial-gradient(60% 60% at 50% 40%, ${skin.fg}33, transparent 70%)`,
          borderColor: skin.bd,
        }}
      >
        <ItemImage type={item.itemType} itemId={item.itemData || item.itemId} size={56} />
      </div>

      <div
        className="mb-1 font-ar-display text-[8px] uppercase tracking-[0.12em]"
        style={{ color: skin.fg }}
      >
        {t(skin.nameKey)}
      </div>
      <div className="line-clamp-2 min-h-[28px] font-ar-mono text-[11px] font-semibold leading-tight text-ar-ink">
        {name}
      </div>

      {count > 1 && (
        <span className="absolute right-1.5 top-1.5 rounded border border-white/10 bg-black/70 px-1.5 py-0.5 font-ar-display text-[9px] text-ar-amber">
          ×{count}
        </span>
      )}
    </button>
  )
}
