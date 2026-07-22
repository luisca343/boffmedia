"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { RARITY_ORDER, raritySkin, type ItemRarity } from "../../_utils/rarity"
import { Icon, Input, Panel, Segmented, type SegmentedOption } from "../../_components/ui"
import type { RarityFilter } from "../_hooks/useCollectionFilter"

/** The API's five real tiers — `mythic` exists only as a showcase skin. */
const RARITIES: ItemRarity[] = RARITY_ORDER.filter((r) => r !== "mythic") as ItemRarity[]

export interface CollectionToolbarProps {
  search: string
  onSearch: (value: string) => void
  rarity: RarityFilter
  onRarity: (value: RarityFilter) => void
  type: string
  onType: (value: string) => void
  /** The item types actually present in the inventory — never a fixed list. */
  types: string[]
}

export function CollectionToolbar({
  search,
  onSearch,
  rarity,
  onRarity,
  type,
  onType,
  types,
}: CollectionToolbarProps) {
  const t = useTranslations("arcade")

  const typeLabel: Record<string, string> = {
    item: t("coleccion.toolbar.typeItems"),
    pokemon: "Pokémon",
    mina: t("coleccion.toolbar.typeMine"),
    box: t("coleccion.toolbar.typeBoxes"),
  }

  const typeOptions: SegmentedOption<string>[] = [
    { value: "all", label: t("coleccion.toolbar.all") },
    ...types.map((value) => ({ value, label: typeLabel[value] ?? value })),
  ]

  return (
    <Panel tone="void" tight className="mb-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ar-ink-muted">
            <Icon.Search s={14} />
          </span>
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("coleccion.toolbar.searchPlaceholder")}
            aria-label={t("coleccion.toolbar.searchAriaLabel")}
            className="pl-9"
          />
        </div>

        {types.length > 1 && (
          <Segmented options={typeOptions} value={type} onChange={onType} label={t("coleccion.toolbar.typeLabel")} />
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onRarity("all")}
          aria-pressed={rarity === "all"}
          className={cn(
            "ar-lift rounded-md border px-2.5 py-1.5 font-ar text-[11px] font-semibold uppercase tracking-[0.08em]",
            rarity === "all"
              ? "border-ar-cyan/50 bg-ar-cyan/[.18] text-ar-cyan"
              : "border-white/[.08] bg-white/[.04] text-ar-ink-dim hover:text-ar-ink",
          )}
        >
          {t("coleccion.toolbar.allRarities")}
        </button>

        {RARITIES.map((r) => {
          const skin = raritySkin(r)
          const active = rarity === r
          return (
            <button
              key={r}
              type="button"
              onClick={() => onRarity(r)}
              aria-pressed={active}
              className="ar-lift rounded-md border px-2.5 py-1.5 font-ar text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={
                active
                  ? { background: skin.bg, borderColor: skin.bd, color: skin.fg }
                  : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }
              }
            >
              <span className={active ? undefined : "text-ar-ink-dim"}>{skin.name}</span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
