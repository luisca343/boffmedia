"use client"

import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"
import type { TierListItem } from "../core/schema"

export function TierListItemVisual({ item, showLabel = true }: { item: TierListItem; showLabel?: boolean }) {
  return <>
    <span className="relative block aspect-square w-full overflow-hidden bg-base-2">
      <ArtImage src={item.image} alt={item.name} sizes="96px" fallback={
        <span className="flex h-full items-center justify-center px-1 text-center font-display text-xl font-bold text-txt-muted" aria-hidden="true">
          {item.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}
        </span>
      } />
    </span>
    {showLabel && <span className="block h-10 px-1 py-1 text-center font-body text-xs leading-tight text-txt" title={item.name}>
      <span className="line-clamp-2 break-words">{item.name}</span>
    </span>}
  </>
}
