"use client"

import type { ArcadeInventoryItem } from "@boffmedia/shared"
import { remaining } from "../../_utils/inventory"
import { RARITY_ORDER, raritySkin, type ArRarity, type ItemRarity } from "../../_utils/rarity"
import { Icon, Panel, StatCard } from "../../_components/ui"

const RARITIES: ItemRarity[] = RARITY_ORDER.filter((r) => r !== "mythic") as ItemRarity[]

export interface CollectionStatsProps {
  items: ArcadeInventoryItem[]
}

/**
 * Only figures the inventory actually answers: how many distinct rows, how many
 * units across them, and how those rows split by rarity. The handoff's "set
 * completion / milestone" panel has no backing data and is not rendered.
 */
export function CollectionStats({ items }: CollectionStatsProps) {
  const unique = items.length
  const total = items.reduce((sum, item) => sum + remaining(item), 0)

  const byRarity = RARITIES.map((rarity) => ({
    rarity,
    count: items.filter((item) => item.rarity === rarity).length,
  }))
  const peak = Math.max(1, ...byRarity.map((r) => r.count))

  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-[repeat(2,minmax(0,1fr))_1.6fr]">
      <StatCard
        kicker="Objetos únicos"
        value={unique}
        sub="entradas en la colección"
        tone="cyan"
        icon={<Icon.Grid s={18} />}
      />
      <StatCard
        kicker="Objetos totales"
        value={total}
        sub="unidades sin reclamar"
        tone="amber"
        icon={<Icon.Box s={18} />}
      />

      <Panel tone="deep" tight>
        <div className="mb-2.5 font-ar-display text-[8px] uppercase tracking-[0.12em] text-ar-violet-2">
          Por rareza
        </div>
        <ul className="flex flex-col gap-1.5">
          {byRarity.map(({ rarity, count }) => {
            const skin = raritySkin(rarity as ArRarity)
            return (
              <li key={rarity} className="flex items-center gap-2.5">
                <span
                  className="w-[76px] shrink-0 font-ar-mono text-[10px] uppercase tracking-[0.08em]"
                  style={{ color: skin.fg }}
                >
                  {skin.name}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-sm bg-black/50">
                  <span
                    className="block h-full rounded-sm"
                    style={{
                      width: `${(count / peak) * 100}%`,
                      background: skin.fg,
                      boxShadow: `0 0 8px ${skin.bd}`,
                    }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right font-ar-mono text-[11px] tabular-nums text-ar-ink-dim">
                  {count}
                </span>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
