"use client"

import { useMemo } from "react"
import { MewData } from "@/components/boffmedia/ui/mewgenics"
import type { MewRec } from "@/components/boffmedia/ui/mewgenics"
import { EQUIP_SLOTS, itemFrame, type EquipSlot } from "./builder-state"

/**
 * Wearable items grouped by the slot they occupy, and story cats.
 *
 * Reads the already-loaded store rather than calling `useMewData` again: the
 * store is a singleton keyed by language, and a second subscriber asking for a
 * different language re-fetches the whole codex behind the builder's back.
 * `rev` is the parent's readiness signal and is what invalidates these memos.
 */
export function useEquipItems(rev: unknown): Record<EquipSlot, MewRec[]> {
  return useMemo(() => {
    const out = Object.fromEntries(EQUIP_SLOTS.map((s) => [s, [] as MewRec[]])) as Record<EquipSlot, MewRec[]>
    for (const item of (MewData.data.items as MewRec[]) || []) {
      const kind = String(item.kind || "").toLowerCase() as EquipSlot
      if (!EQUIP_SLOTS.includes(kind)) continue
      // No trailing frame number on the icon path means no art to draw.
      if (itemFrame(item) === null) continue
      out[kind].push(item)
    }
    return out
  }, [rev])
}

export function useStoryCats(rev: unknown): MewRec[] {
  return useMemo(() => ((MewData.data.story_cats as MewRec[]) || []).slice(), [rev])
}

/** The item currently worn in `slot`, or null. */
export function equippedItem(
  items: Record<EquipSlot, MewRec[]>,
  slot: EquipSlot,
  frame: number | undefined,
): MewRec | null {
  if (frame == null) return null
  return items[slot].find((i) => itemFrame(i) === frame) ?? null
}
