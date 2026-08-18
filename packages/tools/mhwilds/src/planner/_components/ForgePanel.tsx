"use client"

import * as React from "react"
import { useToolT } from "../../i18n"
import { Weapon } from "../../types"
import { MhPanel, MhLabel, MhMaterial } from "../../ui/mh-kit"
import { useForgePath } from "../_hooks/useForgePath"

const OWNED_KEY = "mhw-owned-mats"

/**
 * Forge materials for the equipped weapon. Prefers the cumulative full-path total
 * from the real weapon tree (`useForgePath`); falls back to the weapon's direct
 * crafting materials while the tree loads. Owned-material tracking persists in
 * localStorage (`MhMaterial`'s built-in checkbox).
 */
export function ForgePanel({ weapon }: { weapon: Weapon }) {
  const t = useToolT("tools.mhwilds")
  const { materials, steps, zenny, loading } = useForgePath(String(weapon.id), (weapon as any).kind)

  const direct: { item: { id: string | number; name: string; rarity?: number }; quantity: number }[] =
    (weapon as any).crafting?.materials || []
  const fullPath = materials.length > 0
  const mats = fullPath ? materials : direct

  const [owned, setOwned] = React.useState<Record<string, boolean>>({})
  React.useEffect(() => {
    try {
      setOwned(JSON.parse(localStorage.getItem(OWNED_KEY) || "{}"))
    } catch {
      /* ignore */
    }
  }, [])
  const toggle = (id: string) =>
    setOwned((o) => {
      const n = { ...o }
      if (n[id]) delete n[id]
      else n[id] = true
      try {
        localStorage.setItem(OWNED_KEY, JSON.stringify(n))
      } catch {
        /* ignore */
      }
      return n
    })

  if (mats.length === 0) return null
  const ownedCount = mats.filter((m) => owned[String(m.item?.id)]).length

  return (
    <MhPanel
      title={t("build_planner.forge_materials")}
      icon="hammer"
      count={mats.length}
      aside={
        <span className="font-mono text-[11px] leading-none text-txt-muted">
          {t("build_planner.forge.owned", { owned: ownedCount, total: mats.length })}
        </span>
      }
    >
      {fullPath && (
        <MhLabel className="mb-2">
          {t("build_planner.forge.full_path", { steps })}
          {zenny ? ` · ${zenny.toLocaleString()}z` : ""}
        </MhLabel>
      )}
      <div className="flex flex-col gap-[5px]">
        {mats.map((m, i) => {
          const id = String(m.item?.id ?? i)
          return (
            <MhMaterial
              key={id}
              name={m.item?.name ?? "?"}
              rarity={m.item?.rarity}
              quantity={m.quantity ?? 1}
              owned={!!owned[id]}
              onToggle={() => toggle(id)}
            />
          )
        })}
      </div>
      {loading && !fullPath && (
        <div className="mt-2 font-mono text-[10px] uppercase leading-none tracking-[0.08em] text-txt-dim">
          {t("build_planner.forge.loading_path")}
        </div>
      )}
    </MhPanel>
  )
}
