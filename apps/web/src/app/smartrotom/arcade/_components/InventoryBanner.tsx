"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useArcadeInventory, useLootboxConfig } from "../_hooks/queries"
import { ownedBoxes, resolveBoxes, totalBoxesOwned } from "../_utils/inventory"
import { Corners, Icon, Panel } from "./ui"

/** "You have N unopened boxes" — the hub's route into the loot flow. */
export function InventoryBanner() {
  const t = useTranslations("arcade")
  const inventory = useArcadeInventory()
  const config = useLootboxConfig()

  const boxes = resolveBoxes(config.data)
  const owned = ownedBoxes(inventory.data, boxes)
  const total = totalBoxesOwned(owned)

  // Nothing to open is not an empty state worth a banner — the CTA just isn't there.
  if (inventory.isLoading || total === 0) return null

  const breakdown = boxes
    .filter((b) => owned[b.id] > 0)
    .map((b) => `${owned[b.id]}× ${b.name}`)
    .join(" · ")

  return (
    <Panel tone="magenta" className="relative mb-[22px]">
      <div aria-hidden className="ar-horizon opacity-50" />
      <Corners tone="violet" inset={10} size={14} />

      <div className="relative z-[2] flex flex-wrap items-center justify-between gap-[18px]">
        <div className="flex items-center gap-[18px]">
          <div className="relative grid h-[60px] w-[60px] place-items-center rounded-[14px] bg-[linear-gradient(135deg,rgb(var(--ar-magenta)),rgb(var(--ar-violet)))] shadow-[0_0_26px_rgb(var(--ar-magenta)/.45)]">
            <Icon.Box s={28} className="text-white" />
            <span className="absolute -right-1.5 -top-1.5 grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-ar-void-3 bg-ar-amber font-ar-display text-[9px] text-[#1c0e00]">
              {total}
            </span>
          </div>
          <div>
            <div className="mb-1.5 font-ar-display text-[9px] uppercase tracking-[0.18em] text-ar-violet-2">
              {t("inventory.title")}
            </div>
            <div className="font-ar text-lg font-bold text-ar-ink">
              {t("inventory.unopenedBoxes", { count: total })}
            </div>
            {breakdown && <div className="mt-1 font-ar text-xs text-ar-ink-dim">{breakdown}</div>}
          </div>
        </div>

        <Link
          href="/smartrotom/arcade/loot"
          className="ar-lift inline-flex items-center justify-center gap-2 rounded-lg border border-white/[.18] px-4 py-2.5 font-ar text-xs font-semibold uppercase tracking-[0.08em] text-white bg-[linear-gradient(180deg,#ff5fbf_0%,rgb(var(--ar-magenta))_55%,#c4127a_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/.35),inset_0_-2px_0_rgb(0_0_0/.35),0_8px_26px_-8px_rgb(var(--ar-magenta)/.6)]"
        >
          <Icon.Box s={14} /> {t("inventory.openInventory")} <Icon.Chevron s={14} />
        </Link>
      </div>
    </Panel>
  )
}
