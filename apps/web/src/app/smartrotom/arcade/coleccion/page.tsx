"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { useTranslations } from "next-intl"
import type { ArcadeInventoryItem } from "@boffmedia/shared"
import { getItemName } from "@/lib/intlUtils"
import { useArcadeInventory, useArcadeUuid, useLootboxConfig } from "../_hooks/queries"
import { collectionItems, remaining, resolveBoxes } from "../_utils/inventory"
import { Button, Icon, Panel, Skeleton, Tag } from "../_components/ui"
import { ClaimModal } from "./_components/ClaimModal"
import { CollectionGrid } from "./_components/CollectionGrid"
import { CollectionStats } from "./_components/CollectionStats"
import { CollectionToolbar } from "./_components/CollectionToolbar"
import { ItemDetailModal } from "./_components/ItemDetailModal"
import { useCollectionFilter } from "./_hooks/useCollectionFilter"

export default function ColeccionPage() {
  const t = useTranslations("arcade")
  const uuid = useArcadeUuid()
  const inventory = useArcadeInventory()
  const config = useLootboxConfig()

  const [detail, setDetail] = useState<ArcadeInventoryItem | null>(null)
  const [claiming, setClaiming] = useState(false)

  const items = collectionItems(inventory.data, resolveBoxes(config.data))
  const nameOf = useCallback(
    (item: ArcadeInventoryItem) => getItemName(t, item.itemId, item.itemType),
    [t],
  )
  const filter = useCollectionFilter(items, nameOf)

  const total = items.reduce((sum, item) => sum + remaining(item), 0)

  if (inventory.isLoading || config.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[4.25rem] rounded-2xl" />
        <Skeleton className="h-[7.5rem] rounded-2xl" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-[10px]" />
          ))}
        </div>
      </div>
    )
  }

  if (!uuid) {
    return (
      <Panel tone="deep">
        <p role="alert" className="font-ar-mono text-[0.75rem] text-ar-amber">
          {t("common.loginRequired")}
        </p>
      </Panel>
    )
  }

  if (inventory.isError) {
    return (
      <Panel tone="deep">
        <p role="alert" className="font-ar-mono text-[0.75rem] text-ar-danger">
          {t("common.errorLoading")}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          icon={<Icon.Reset s={12} />}
          onClick={() => void inventory.refetch()}
        >
          {t("common.retry")}
        </Button>
      </Panel>
    )
  }

  return (
    <>
      <Panel tone="deep" tight className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href="/smartrotom/arcade/loot"
              className="ar-lift inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 font-ar text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ar-ink-dim hover:text-ar-ink"
            >
              <Icon.Chevron s={12} dir="left" /> {t("coleccion.backToBoxes")}
            </Link>
            <span className="ar-chrom font-ar-display text-[0.9375rem] text-ar-ink">{t("coleccion.title")}</span>
            <Tag tone="cyan" size="md">
              {t("coleccion.itemsCount", { total, unique: items.length })}
            </Tag>
          </div>

          <Button
            variant="amber"
            size="sm"
            icon={<Icon.Sparkle s={12} />}
            onClick={() => setClaiming(true)}
            disabled={items.length === 0}
          >
            {t("coleccion.claimToGame")}
          </Button>
        </div>
      </Panel>

      <CollectionStats items={items} />

      <CollectionToolbar
        search={filter.search}
        onSearch={filter.onSearch}
        rarity={filter.rarity}
        onRarity={filter.onRarity}
        type={filter.type}
        onType={filter.onType}
        types={filter.types}
      />

      <CollectionGrid
        items={filter.paginated}
        matches={filter.filtered.length}
        owned={items.length}
        nameOf={nameOf}
        onSelect={setDetail}
        page={filter.page}
        pageCount={filter.pageCount}
        onPrevious={filter.onPrevious}
        onNext={filter.onNext}
      />

      <ItemDetailModal item={detail} onClose={() => setDetail(null)} />
      <ClaimModal open={claiming} onClose={() => setClaiming(false)} items={items} />
    </>
  )
}
