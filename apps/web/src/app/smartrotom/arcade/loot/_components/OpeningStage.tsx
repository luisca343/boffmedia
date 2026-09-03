"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import type { OpenLootBoxResponseDto } from "@boffmedia/shared"
import { getItemDescription, getItemName } from "@/lib/intlUtils"
import { ItemImage } from "@/lib/ItemImage"
import { cn } from "@/lib/utils"
import type { ResolvedBox } from "../../_utils/inventory"
import { raritySkin, type ArRarity } from "../../_utils/rarity"
import {
  Button,
  ClaimCelebration,
  Icon,
  Panel,
  Tag,
  type ArCelebrationReward,
  type ArTone,
} from "../../_components/ui"
import { buildReel } from "../_utils/reel"
import { ReelSpinner } from "./ReelSpinner"

export interface OpeningStageProps {
  box: ResolvedBox
  result: OpenLootBoxResponseDto
  /** Boxes of this kind still unopened — gates "abrir otra". */
  owned: number
  /** The next roll is already in flight. */
  opening: boolean
  onOpenAnother: () => void
  onBack: () => void
}

const RARITY_TONE: Record<ArRarity, ArTone> = {
  common: "ghost",
  uncommon: "lime",
  rare: "cyan",
  epic: "violet",
  legendary: "amber",
  mythic: "magenta",
}

export function OpeningStage({
  box,
  result,
  owned,
  opening,
  onOpenAnother,
  onBack,
}: OpeningStageProps) {
  const t = useTranslations("arcade")
  const [settled, setSettled] = useState(false)
  const [celebration, setCelebration] = useState<ArCelebrationReward | null>(null)

  const reel = useMemo(() => buildReel(result, box), [result, box])
  const item = result.item
  const rarity = (item?.rarity ?? "common") as ArRarity
  const skin = raritySkin(rarity)
  const name = item ? getItemName(t, item.id, item.type) : ""
  const art = item ? <ItemImage type={item.type} itemId={item.data || item.id} size={64} /> : null

  const onRevealed = () => {
    setSettled(true)
    if (!item) return
    setCelebration({
      name,
      rarity,
      amount: item.amount && item.amount > 1 ? item.amount : null,
      art: <ItemImage type={item.type} itemId={item.data || item.id} size={72} />,
    })
  }

  const description =
    item && item.type === "pokemon" ? item.data || item.id : item ? getItemDescription(t, item.id) : ""

  return (
    <>
      <Panel tone="deep" tight className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <span className="inline-flex items-center gap-3.5">
            <span className="font-ar-display text-[0.6875rem] text-ar-magenta-2">▸ {t("loot.abriendo")}</span>
            <span className="ar-chrom font-ar-display text-[0.8125rem] text-ar-ink">{box.name}</span>
          </span>
          <span className="font-ar-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ar-cyan">
            {settled ? (
              <span className="text-ar-lime">{t("common.prizeObtained")}</span>
            ) : (
              <span className="motion-reduce:animate-none animate-ar-blink">{t("common.spinning")}</span>
            )}
          </span>
        </div>
      </Panel>

      <Panel tone="deep" className="relative mb-4">
        <div aria-hidden className="ar-horizon opacity-40" />
        <div className="relative z-[2]">
          <div className="mb-3 text-center font-ar-display text-[0.5625rem] uppercase tracking-[0.18em] text-ar-cyan">
            {settled ? t("loot.prizeObtained") : t("common.spinning")}
          </div>
          {reel.tiles.length > 0 && reel.winningPosition >= 0 ? (
            <ReelSpinner
              tiles={reel.tiles}
              winningPosition={reel.winningPosition}
              onRevealed={onRevealed}
            />
          ) : (
            <p role="alert" className="py-8 text-center font-ar-mono text-[0.6875rem] text-ar-danger">
              {t("loot.reelNoServer")}
            </p>
          )}
        </div>
      </Panel>

      <div
        className={cn(
          "grid gap-4 transition-opacity duration-500 lg:grid-cols-2",
          settled ? "opacity-100" : "opacity-55",
        )}
      >
        <Panel tone="magenta" glow innerClassName="p-5">
          <div className="flex items-center gap-[1.125rem]">
            <div
              className={cn(
                "grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[14px] border-2",
                settled && "motion-reduce:animate-none animate-ar-float",
              )}
              style={{
                background: `radial-gradient(60% 60% at 50% 40%, ${skin.fg}33, transparent 70%)`,
                borderColor: skin.fg,
                boxShadow: `inset 0 0 30px ${skin.bd}, 0 0 30px ${skin.bd}`,
              }}
            >
              {art}
            </div>
            <div className="min-w-0">
              <Tag tone={RARITY_TONE[rarity]} size="md">
                {t(skin.nameKey)}
              </Tag>
              <div className="ar-chrom mt-2.5 font-ar-display text-[0.9375rem] leading-relaxed text-ar-ink">
                {name}
              </div>
              {item?.amount && item.amount > 1 ? (
                <div className="mt-1.5 font-ar-mono text-xs text-ar-amber">×{item.amount}</div>
              ) : null}
              {description && (
                <p className="mt-1.5 max-w-[16.25rem] font-ar-mono text-[0.6875rem] leading-relaxed text-ar-ink-dim">
                  {description}
                </p>
              )}
            </div>
          </div>
        </Panel>

        <Panel tone="void">
          <div className="mb-3 font-ar-display text-[0.5625rem] uppercase tracking-[0.18em] text-ar-cyan">
            {t("loot.next")}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="primary"
              size="md"
              icon={<Icon.Box s={14} />}
              onClick={onOpenAnother}
              disabled={!settled || opening || owned <= 0}
            >
              {opening ? t("loot.opening") : t("loot.openAnotherBtn")}
            </Button>
            <Link
              href="/smartrotom/arcade/coleccion"
              aria-disabled={!settled}
              tabIndex={settled ? undefined : -1}
              className={cn(
                "ar-lift inline-flex select-none items-center justify-center gap-2 rounded-lg border border-white/25 px-4 py-2.5 font-ar text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#001016]",
                "bg-[linear-gradient(180deg,rgb(var(--ar-cyan-2))_0%,rgb(var(--ar-cyan))_55%,#008faa_100%)]",
                "shadow-[inset_0_1px_0_rgb(255_255_255/.55),inset_0_-2px_0_rgb(0_0_0/.25),0_8px_26px_-8px_rgb(var(--ar-cyan)/.65)]",
                !settled && "pointer-events-none opacity-45",
              )}
            >
              <Icon.Trophy s={14} /> {t("loot.viewMyCollection")}
            </Link>
            <Button
              variant="ghost"
              size="md"
              icon={<Icon.Chevron s={14} dir="left" />}
              onClick={onBack}
              disabled={!settled}
            >
              {t("loot.backToSelector")}
            </Button>
          </div>

          <div className="mt-[1.125rem] rounded-[10px] border border-white/[.07] bg-black/45 px-3.5 py-3">
            <div className="mb-1.5 font-ar-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ar-ink-muted">
              {t("loot.saved")}
            </div>
            <p className="font-ar text-[0.8125rem] leading-relaxed text-ar-ink-dim">
              {t("loot.itemInCollection", { count: owned })}
            </p>
          </div>
        </Panel>
      </div>

      <ClaimCelebration reward={celebration} onClose={() => setCelebration(null)} />
    </>
  )
}
