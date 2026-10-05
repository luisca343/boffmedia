"use client"

import { useEffect, useState } from "react"
import { uiAssetUrl } from "@boffmedia/ui/i18n"
import { MediaCardContent } from "@boffmedia/ui"
import type { TierListItem } from "../core/schema"

export function TierListItemVisual({ item, showLabel = true }: { item: TierListItem; showLabel?: boolean }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [item.image])
  return <MediaCardContent label={item.name} showLabel={showLabel}>
    {item.image && !failed ? <img src={uiAssetUrl(item.image)} alt={item.name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} /> :
      <span className="flex h-full items-center justify-center px-1 text-center font-display text-xl font-bold text-txt-muted" aria-hidden="true">
        {item.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}
      </span>
    }
  </MediaCardContent>
}
