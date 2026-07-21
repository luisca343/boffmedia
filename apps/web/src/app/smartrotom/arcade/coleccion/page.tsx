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
        <Skeleton className="h-[68px] rounded-2xl" />
        <Skeleton className="h-[120px] rounded-2xl" />
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
        <p role="alert" className="font-ar-mono text-[12px] text-ar-amber">
          Inicia sesión con tu cuenta de SmartRotom para ver tu colección.
        </p>
      </Panel>
    )
  }

  if (inventory.isError) {
    return (
      <Panel tone="deep">
        <p role="alert" className="font-ar-mono text-[12px] text-ar-danger">
          No se pudo cargar tu inventario. Vuelve a intentarlo en un momento.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          icon={<Icon.Reset s={12} />}
          onClick={() => void inventory.refetch()}
        >
          Reintentar
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
              className="ar-lift inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 font-ar text-[11px] font-semibold uppercase tracking-[0.08em] text-ar-ink-dim hover:text-ar-ink"
            >
              <Icon.Chevron s={12} dir="left" /> Cajas
            </Link>
            <span className="ar-chrom font-ar-display text-[15px] text-ar-ink">Tu colección</span>
            <Tag tone="cyan" size="md">
              {total} objetos · {items.length} únicos
            </Tag>
          </div>

          <Button
            variant="amber"
            size="sm"
            icon={<Icon.Sparkle s={12} />}
            onClick={() => setClaiming(true)}
            disabled={items.length === 0}
          >
            Reclamar al juego
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
