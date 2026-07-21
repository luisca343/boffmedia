"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { getItemName } from "@/lib/intlUtils"
import { ItemImage } from "@/lib/ItemImage"
import type { ResolvedBox } from "../../_utils/inventory"
import { RARITY_ORDER, raritySkin, type ArRarity } from "../../_utils/rarity"
import { Button, Modal, Tag } from "../../_components/ui"

export interface LootInfoModalProps {
  open: boolean
  onClose: () => void
  box: ResolvedBox | undefined
}

/** Every figure below is the item's weight over the box's total — no house numbers. */
export function LootInfoModal({ open, onClose, box }: LootInfoModalProps) {
  const t = useTranslations("arcade")

  const groups = useMemo(() => {
    const items = box?.items ?? []
    const total = items.reduce((sum, i) => sum + (i.weight || 0), 0)
    const byRarity = new Map<string, { id: string; type?: string; data?: string; amount?: number; pct: number }[]>()

    for (const item of items) {
      const rarity = item.rarity ?? "common"
      const row = {
        id: item.id,
        type: item.type,
        data: item.data,
        amount: item.amount,
        pct: total > 0 ? ((item.weight || 0) / total) * 100 : 0,
      }
      byRarity.set(rarity, [...(byRarity.get(rarity) ?? []), row])
    }

    return [...byRarity.entries()]
      .map(([rarity, rows]) => ({
        rarity,
        rows: rows.sort((a, b) => b.pct - a.pct),
        pct: rows.reduce((sum, r) => sum + r.pct, 0),
      }))
      .sort(
        (a, b) =>
          RARITY_ORDER.indexOf(b.rarity as ArRarity) - RARITY_ORDER.indexOf(a.rarity as ArRarity),
      )
  }, [box])

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      kicker={t("arcade.loot.howBoxesWork")}
      title={box ? t("arcade.loot.lootBoxProbabilities", { name: box.name }) : t("arcade.loot.lootBoxes")}
      footer={
        <Button variant="cyan" size="md" onClick={onClose}>
          {t("arcade.common.understood")}
        </Button>
      }
    >
      <ol className="mb-5 flex flex-col gap-2.5">
        {(["steps.getBoxes", "steps.chooseBox", "steps.openBox", "steps.itemCollection"] as const).map((key, i) => (
          <li key={key} className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md border border-ar-cyan/40 bg-ar-cyan/[.12] font-ar-display text-[9px] text-ar-cyan">
              {i + 1}
            </span>
            <span className="text-ar-ink-dim">{t(`arcade.loot.${key}`)}</span>
          </li>
        ))}
      </ol>

      <p className="mb-4 rounded-[10px] border border-white/[.07] bg-black/40 p-3 font-ar-mono text-[11px] leading-relaxed text-ar-ink-muted">
        {t("arcade.loot.oddsExplanation")}
      </p>

      <div className="flex flex-col gap-3">
        {groups.map((group) => {
          const skin = raritySkin(group.rarity)
          return (
            <div
              key={group.rarity}
              className="rounded-[10px] border p-3"
              style={{ borderColor: skin.bd, background: skin.bg }}
            >
              <div className="mb-2.5 flex items-center justify-between border-b border-white/[.08] pb-2">
                <span
                  className="font-ar-display text-[10px] uppercase tracking-[0.12em]"
                  style={{ color: skin.fg }}
                >
                  {skin.name}
                </span>
                <Tag tone="ghost" size="sm">
                  {group.pct.toFixed(2)}%
                </Tag>
              </div>

              <ul className="grid gap-1.5 sm:grid-cols-2">
                {group.rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-white/[.06] bg-black/35 px-2 py-1.5"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <ItemImage type={row.type} itemId={row.data || row.id} size={22} />
                      <span className="truncate font-ar text-[12px] text-ar-ink">
                        {getItemName(t, row.id, row.type)}
                        {row.amount && row.amount > 1 ? (
                          <span className="ml-1 font-ar-mono text-ar-amber">×{row.amount}</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="shrink-0 font-ar-mono text-[11px] tabular-nums text-ar-ink-dim">
                      {row.pct.toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
