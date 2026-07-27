"use client"

import { useTranslations } from "next-intl"
import type { ArcadeInventoryItem } from "@boffmedia/shared"
import { getItemDescription, getItemName } from "@/lib/intlUtils"
import { ItemImage } from "@/lib/ItemImage"
import { remaining } from "../../_utils/inventory"
import { raritySkin } from "../../_utils/rarity"
import { Button, Modal, Panel } from "../../_components/ui"

export interface ItemDetailModalProps {
  item: ArcadeInventoryItem | null
  onClose: () => void
}

const SOURCE_LABEL_KEY: Record<string, string> = {
  arcade: "coleccion.detail.sources.arcade",
  mina: "coleccion.detail.sources.mina",
  lootbox: "coleccion.detail.sources.lootbox",
  streak: "coleccion.detail.sources.streak",
}

export function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const t = useTranslations("arcade")
  if (!item) return null

  const skin = raritySkin(item.rarity)
  const description =
    item.itemType === "pokemon" ? item.itemData || item.itemId : getItemDescription(t, item.itemId)

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      kicker={t(skin.nameKey)}
      title={getItemName(t, item.itemId, item.itemType)}
      footer={
        <Button variant="cyan" size="md" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      <div
        className="mx-auto mb-4 grid h-[132px] w-[132px] place-items-center overflow-hidden rounded-[18px] border-2"
        style={{
          background: `radial-gradient(60% 60% at 50% 40%, ${skin.fg}33, transparent 70%)`,
          borderColor: skin.fg,
          boxShadow: `inset 0 0 30px ${skin.bd}`,
        }}
      >
        <ItemImage type={item.itemType} itemId={item.itemData || item.itemId} size={80} />
      </div>

      <Panel tone="deep" tight className="mb-3">
        <dl className="grid grid-cols-2 gap-y-2.5 font-ar-mono text-[11px]">
          <dt className="uppercase tracking-[0.12em] text-ar-ink-muted">{t("coleccion.detail.quantity")}</dt>
          <dd className="text-right tabular-nums text-ar-amber">×{remaining(item)}</dd>

          <dt className="uppercase tracking-[0.12em] text-ar-ink-muted">{t("coleccion.detail.rarity")}</dt>
          <dd className="text-right" style={{ color: skin.fg }}>
            {t(skin.nameKey)}
          </dd>

          <dt className="uppercase tracking-[0.12em] text-ar-ink-muted">{t("coleccion.detail.origin")}</dt>
          <dd className="text-right text-ar-ink">
            {SOURCE_LABEL_KEY[item.sourceType] ? t(SOURCE_LABEL_KEY[item.sourceType]) : item.sourceType}
          </dd>

          {item.used > 0 && (
            <>
              <dt className="uppercase tracking-[0.12em] text-ar-ink-muted">{t("coleccion.detail.claimed")}</dt>
              <dd className="text-right tabular-nums text-ar-ink-dim">{item.used}</dd>
            </>
          )}
        </dl>
      </Panel>

      {description && <p className="text-ar-ink-dim">{description}</p>}
    </Modal>
  )
}
