"use client"

import * as React from "react"
import { Icon } from "@boffmedia/ui"
import type { ArmorPiece, Charm, Decoration, Weapon } from "../../types"
import { mhwildsArmorAsset, mhwildsWeaponAsset } from "../../bestiary/assets"
import {
  getArmorImagePath,
  getCharmImagePath,
  getDecorationImagePath,
} from "./equipment-utils"

export type WishlistVisualKind = "weapon" | "armor" | "charm" | "decoration"
export type WishlistVisualItem = Weapon | ArmorPiece | Charm | Decoration

function fallbackIcon(kind: WishlistVisualKind): "sword" | "shield" | "sparkles" {
  return kind === "weapon" ? "sword" : kind === "armor" ? "shield" : "sparkles"
}

function assetSources(
  kind: WishlistVisualKind,
  item: WishlistVisualItem | undefined,
): string[] {
  if (!item) return []

  if (kind === "weapon") {
    const weapon = item as Weapon
    return [mhwildsWeaponAsset(weapon)].filter(
      (source): source is string => Boolean(source),
    )
  }

  if (kind === "armor") {
    const armor = item as ArmorPiece
    return [mhwildsArmorAsset(armor), getArmorImagePath(armor.kind)].filter(
      (source): source is string => Boolean(source),
    )
  }

  if (kind === "charm") {
    return [getCharmImagePath((item as Charm).rarity)]
  }

  const decoration = item as Decoration
  return [getDecorationImagePath(decoration.slot, decoration.icon?.color, decoration.icon?.colorId)]
}

export function WishlistItemVisual({
  kind,
  item,
  className = "",
}: {
  kind: WishlistVisualKind
  item?: WishlistVisualItem
  className?: string
}) {
  const sources = React.useMemo(
    () => assetSources(kind, item),
    [item, kind],
  )
  const [sourceIndex, setSourceIndex] = React.useState(0)

  React.useEffect(() => setSourceIndex(0), [sources.join("|")])

  const source = sources[sourceIndex]
  const decoration = kind === "decoration" ? (item as Decoration | undefined) : undefined
  return (
    <div
      className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden ${className}`}
    >
      {source ? (
        <img
          src={source}
          alt=""
          aria-hidden="true"
          width={56}
          height={56}
          draggable={false}
          className="h-full w-full object-contain p-0.5"
          onError={() => setSourceIndex((current) => current + 1)}
        />
      ) : (
        <Icon name={fallbackIcon(kind)} size={25} className="text-[var(--mh-bright)]" />
      )}
    </div>
  )
}
