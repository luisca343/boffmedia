"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import type { ArcadeInventoryItem } from "@boffmedia/shared"
import { Button, Icon, Panel } from "../../_components/ui"
import { ItemTile } from "./ItemTile"

export interface CollectionGridProps {
  items: ArcadeInventoryItem[]
  /** Rows after filtering — 0 with a non-empty collection means "no matches". */
  matches: number
  /** Rows before filtering — 0 means the player has opened nothing yet. */
  owned: number
  nameOf: (item: ArcadeInventoryItem) => string
  onSelect: (item: ArcadeInventoryItem) => void
  page: number
  pageCount: number
  onPrevious: () => void
  onNext: () => void
}

export function CollectionGrid({
  items,
  matches,
  owned,
  nameOf,
  onSelect,
  page,
  pageCount,
  onPrevious,
  onNext,
}: CollectionGridProps) {
  const t = useTranslations("arcade")

  if (owned === 0) {
    return (
      <Panel tone="deep" className="text-center">
        <div className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-[14px] border border-ar-violet/40 bg-ar-violet/[.12] text-ar-violet-2">
          <Icon.Box s={26} />
        </div>
        <h3 className="font-ar-display text-[0.8125rem] leading-relaxed text-ar-ink">
          {t("coleccion.grid.emptyTitle")}
        </h3>
        <p className="mx-auto mt-2 max-w-[23.75rem] font-ar text-[0.8125rem] leading-relaxed text-ar-ink-dim">
          {t("coleccion.grid.emptyBody")}
        </p>
        <Link
          href="/smartrotom/arcade/loot"
          className="ar-lift mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[.18] px-4 py-2.5 font-ar text-xs font-semibold uppercase tracking-[0.08em] text-white bg-[linear-gradient(180deg,#ff5fbf_0%,rgb(var(--ar-magenta))_55%,#c4127a_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/.35),inset_0_-2px_0_rgb(0_0_0/.35),0_8px_26px_-8px_rgb(var(--ar-magenta)/.6)]"
        >
          <Icon.Box s={14} /> {t("coleccion.grid.goToBoxes")}
        </Link>
      </Panel>
    )
  }

  if (matches === 0) {
    return (
      <Panel tone="deep" className="text-center">
        <div className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-[14px] border border-ar-cyan/40 bg-ar-cyan/[.12] text-ar-cyan">
          <Icon.Search s={26} />
        </div>
        <h3 className="font-ar-display text-[0.8125rem] leading-relaxed text-ar-ink">{t("coleccion.grid.noMatchTitle")}</h3>
        <p className="mt-2 font-ar text-[0.8125rem] text-ar-ink-dim">
          {t("coleccion.grid.noMatchBody")}
        </p>
      </Panel>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {items.map((item) => (
          <ItemTile
            key={item.id}
            item={item}
            name={nameOf(item)}
            onClick={() => onSelect(item)}
          />
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon.Chevron s={12} dir="left" />}
            onClick={onPrevious}
            disabled={page === 0}
          >
            {t("coleccion.grid.prev")}
          </Button>
          <span className="font-ar-mono text-[0.6875rem] tabular-nums text-ar-ink-dim">
            {t("coleccion.grid.page", { current: page + 1, total: pageCount })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            iconRight={<Icon.Chevron s={12} />}
            onClick={onNext}
            disabled={page >= pageCount - 1}
          >
            {t("coleccion.grid.next")}
          </Button>
        </div>
      )}
    </>
  )
}
