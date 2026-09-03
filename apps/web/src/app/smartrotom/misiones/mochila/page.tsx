"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { useBoard } from "../_hooks/useBoard"
import { buildSatchel } from "../_utils/items"
import { Divider, EmptyBoard, Label } from "../_components/ui"
import { BoardError, BoardLoading } from "../_components/BoardStatus"
import { SatchelSlot } from "../_components/SatchelSlot"

/**
 * La Mochila — every reward any quest hands out, aggregated into one ledger.
 * No rarity tally here: the API has no rarity, so the only split that means
 * anything is reclaimed vs. still out there; a field the API does not serve is
 * deferred rather than invented.
 */
export default function MochilaPage() {
  const t = useTranslations("misiones.mochila")
  const { quests, isLoading, error } = useBoard()
  const satchel = useMemo(() => buildSatchel(quests), [quests])
  const ownedItems = useMemo(() => satchel.filter((item) => item.owned), [satchel])
  const lockedItems = useMemo(() => satchel.filter((item) => !item.owned), [satchel])

  if (isLoading) return <BoardLoading>{t("loading")}</BoardLoading>
  if (error) return <BoardError message={error} />

  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-6 mt-2.5 text-center">
        <Label className="text-ms-gold-1">{t("eyebrow")}</Label>
        <h1 className="mb-1.5 mt-1 font-ms-display text-[2.375rem] text-ms-paper-1 [text-shadow:0_2px_12px_rgba(0,0,0,.6)]">
          {t("title")}
        </h1>
        <div className="font-ms text-sm italic text-ms-paper-3">
          {t("summary", { owned: ownedItems.length, locked: lockedItems.length })}
        </div>
        <div className="mt-3.5">
          <Divider glyph="❖" className="text-ms-gold-2" />
        </div>
      </div>

      <Label className="mb-2.5 text-ms-gold-1">{t("ownedTitle")}</Label>
      <div className="mb-[1.875rem] grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-3">
        {ownedItems.length === 0 ? (
          <p className="col-span-full py-8 text-center font-ms italic text-ms-paper-3">
            {t("ownedEmpty")}
          </p>
        ) : (
          ownedItems.map((item) => <SatchelSlot key={item.item} item={item} />)
        )}
      </div>

      <Label className="mb-2.5 text-ms-paper-3">{t("lockedTitle")}</Label>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-3">
        {lockedItems.length === 0 ? (
          <p className="col-span-full py-8 text-center font-ms italic text-ms-paper-3">
            {t("lockedEmpty")}
          </p>
        ) : (
          lockedItems.map((item) => <SatchelSlot key={item.item} item={item} />)
        )}
      </div>
    </div>
  )
}
