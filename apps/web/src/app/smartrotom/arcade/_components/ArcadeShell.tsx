"use client"

import { useIsFetching } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useArcadePrefs } from "../_hooks/useArcadePrefs"
import { useArcadeInventory, useArcadeStreak, useLootboxConfig } from "../_hooks/queries"
import { ownedBoxes, resolveBoxes, totalBoxesOwned } from "../_utils/inventory"
import { ArcadeHud } from "./ArcadeHud"
import { ArcadeSidebar } from "./ArcadeSidebar"

/**
 * The `.ar-app` scope root: every `ar-*` token resolves from the CSS vars this
 * class declares, so nothing arcade-flavoured renders outside it (§2). It also
 * carries the two preference switches the token layer reads — `data-scanlines`
 * and `data-motion`.
 *
 * The sidebar and HUD both need the streak and the inventory, so they are
 * fetched once here; TanStack dedupes the same keys used by the screens below.
 */
export function ArcadeShell({ children }: { children: ReactNode }) {
  const { scanlines, motion } = useArcadePrefs()
  const streak = useArcadeStreak()
  const inventory = useArcadeInventory()
  const lootConfig = useLootboxConfig()
  const inFlight = useIsFetching({ queryKey: ["arcade"] })

  const boxes = resolveBoxes(lootConfig.data)
  const owned = totalBoxesOwned(ownedBoxes(inventory.data, boxes))

  return (
    <div
      className="ar-app ar-canvas min-h-screen font-ar text-ar-ink"
      data-scanlines={scanlines}
      data-motion={motion ? "on" : "off"}
    >
      <div className="mx-auto flex max-w-[1600px] items-start gap-[18px] p-4 md:p-6">
        <ArcadeSidebar
          boxesOwned={owned}
          rewardReady={Boolean(streak.data && !streak.data.claimedToday)}
        />
        <main className="min-w-0 flex-1">
          <ArcadeHud
            streak={streak.data}
            boxesOwned={owned}
            loading={streak.isLoading}
            syncing={inFlight > 0}
          />
          {children}
        </main>
      </div>
    </div>
  )
}
