"use client"

import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"
import { MediaCardContent } from "@boffmedia/ui"
import type { TierListItem } from "../core/schema"

export function TierListItemVisual({ item, showLabel = true }: { item: TierListItem; showLabel?: boolean }) {
  return <MediaCardContent label={item.name} showLabel={showLabel}>
    <ArtImage src={item.image} alt={item.name} sizes="96px" fallback={
      <span className="flex h-full items-center justify-center px-1 text-center font-display text-xl font-bold text-txt-muted" aria-hidden="true">
        {item.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}
      </span>
    } />
  </MediaCardContent>
}
