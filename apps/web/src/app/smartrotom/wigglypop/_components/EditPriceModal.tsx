"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { WpListing } from "../_types/market.types"
import { fmt } from "../_utils/format"
import { useUpdateListing } from "../_hooks/queries"
import { Button, Chip, Icon, Modal, ModalHead, Price, PriceInput, Range, ValueBox, toast } from "./ui"

/** Reprice a live listing. The valuation is offered as an anchor, never imposed. */
export function EditPriceModal({
  listing: L,
  onClose,
}: {
  listing: WpListing
  onClose: () => void
}) {
  const t = useTranslations("wigglypop")
  const current = L.format === "auction" ? (L.currentBid ?? L.price) : L.price
  const [price, setPrice] = useState(current)
  const update = useUpdateListing()

  const ref = L.value || current
  const verdict =
    price < ref * 0.95
      ? { label: t("common.priceVerdictGood"), tone: "text-wp-green" }
      : price > ref * 1.15
        ? { label: t("common.priceVerdictAbove"), tone: "text-wp-rose" }
        : { label: t("common.priceVerdictInline"), tone: "text-wp-fg-muted" }

  return (
    <Modal onClose={onClose}>
      <ModalHead
        title={t("modal.editPrice.title")}
        sub={`${L.title}${L.kind === "item" ? t("modal.editPrice.perUnitSuffix") : ""}`}
        onClose={onClose}
      />
      <div className="p-5">
        <ValueBox className="mb-4">
          <div className="flex items-center gap-2">
            <Icon name="wand" size={15} className="text-wp-teal" />
            <span className="font-wp text-[0.78125rem] font-bold text-wp-fg">{t("common.smartRotomSuggests")}</span>
            <Price amount={ref} size={15} symbolClassName="text-wp-teal-deep" />
            <Button className="ml-auto px-2.5 py-1 text-xs" onClick={() => setPrice(ref)}>
              {t("common.useSuggested")}
            </Button>
          </div>
        </ValueBox>

        <label className="font-wp text-[0.78125rem] font-semibold text-wp-fg-muted">
          {L.format === "auction" ? t("common.initialBid") : t("common.price")} (₽)
        </label>
        <div className="mb-1 mt-1.5 flex items-center gap-2.5">
          <PriceInput
            value={price || ""}
            min={0}
            onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
          />
          <Chip className={cn(verdict.tone)}>{verdict.label}</Chip>
        </div>

        <Range
          min={Math.round(ref * 0.4)}
          max={Math.round(ref * 1.6)}
          step={50}
          value={Math.min(Math.round(ref * 1.6), Math.max(Math.round(ref * 0.4), price))}
          aria-label={t("common.price")}
          className="mt-1.5"
          onChange={(e) => setPrice(Number(e.target.value))}
        />

        <Button
          variant="primary"
          className="mt-5 w-full py-[0.8125rem]"
          disabled={!price || update.isPending}
          onClick={() =>
            update.mutate(
              { id: L.id, patch: { price } },
              {
                onSuccess: () => {
                  toast(t("toast.priceUpdated"), "success")
                  onClose()
                },
              },
            )
          }
        >
          <Icon name="check" size={16} />
          {update.isPending ? t("modal.editPrice.saving") : t("modal.editPrice.saveButton", { price: fmt(price) })}
        </Button>
      </div>
    </Modal>
  )
}
