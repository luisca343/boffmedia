"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { WpListing, WpMon } from "../../_types/market.types"
import { fmt } from "../../_utils/format"
import { Icon, Price, Sprite, SpriteStage, TypeBadge } from "../ui"

/** The thing you are about to pay for, shown once at the top of every money modal. */
export function MonRow({ mon }: { mon: WpMon }) {
  const t = useTranslations("wigglypop")
  return (
    <div className="flex items-center gap-3 rounded-xl border border-wp-line/24 bg-wp-panel-2 p-3">
      <SpriteStage mon={mon} dots={false} className="h-[3.625rem] w-[3.625rem] flex-none rounded-[10px]">
        <Sprite mon={mon} className="relative z-[2] h-[76%] w-[76%]" />
      </SpriteStage>
      <div className="flex-1">
        <div className="flex items-center gap-1.5 font-wp text-[0.90625rem] font-bold text-wp-fg">
          {mon.shiny && <span className="text-wp-teal">✦</span>}
          {mon.name}
          <span className="wp-num font-wp text-[0.75rem] text-wp-fg-subtle">{t("common.levelDot", { level: mon.level })}</span>
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {mon.types.map((ty) => (
            <TypeBadge key={ty} type={ty} size="sm" />
          ))}
        </div>
      </div>
    </div>
  )
}

/** One line of a cost breakdown. */
export function SumLine({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between font-wp text-[0.84375rem]">
      <span className="font-semibold text-wp-fg-muted">{k}</span>
      <span className="wp-num font-semibold text-wp-fg">₽{fmt(v)}</span>
    </div>
  )
}

/**
 * The cost breakdown every purchase shows. The fee is stated as a separate line, on
 * top of the subtotal — never folded into the price — because the buyer is about to
 * be charged the total and needs to recognise the number when it leaves their wallet.
 */
export function CostSummary({
  subtotal,
  fee,
  total,
  subtotalLabel,
}: {
  subtotal: number
  fee: number
  total: number
  subtotalLabel?: string
}) {
  const t = useTranslations("wigglypop")
  return (
    <div className="my-4 grid gap-2.5">
      <SumLine k={subtotalLabel ?? t("modal.parts.subtotalDefault")} v={subtotal} />
      <SumLine k={t("common.protectionFee")} v={fee} />
      <div className="my-0.5 h-px bg-wp-line/24" />
      <div className="flex items-baseline justify-between">
        <span className="font-wp text-[0.9375rem] font-bold text-wp-fg">{t("common.total")}</span>
        <Price amount={total} size={20} />
      </div>
    </div>
  )
}

/**
 * The wallet strip. Turns rose when the purchase would overdraw — and that state is
 * what disables the pay button, so the two must always be computed from the same
 * `insufficient` flag at the call site.
 */
export function WalletRow({
  balance,
  insufficient,
}: {
  balance: number | null
  insufficient: boolean
}) {
  const t = useTranslations("wigglypop")
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-[11px] border px-3.5 py-3",
        insufficient
          ? "border-wp-rose/30 bg-wp-rose/10"
          : "border-wp-line/24 bg-wp-panel-2",
      )}
    >
      <span className="flex items-center gap-2 font-wp text-[0.8125rem] font-semibold text-wp-fg-muted">
        <Icon name="dollar" size={15} />
        {t("modal.parts.walletLabel")}
      </span>
      <span
        className={cn(
          "wp-num font-wp",
          insufficient ? "text-wp-rose" : "text-wp-fg",
        )}
      >
        {balance === null ? "—" : `₽${fmt(balance)}`}
      </span>
    </div>
  )
}

/** The three-beat explainer on the escrow success screen. */
export function EscrowSteps({ atomic }: { atomic: boolean }) {
  const t = useTranslations("wigglypop")
  // Which story we tell depends on which custody path the server is running. Under
  // atomic custody the Pokémon has ALREADY moved by the time this renders, so
  // promising "the seller will transfer it" would be a lie.
  const steps = atomic
    ? [t("modal.parts.escrowHeld"), t("modal.parts.escrowAtomicTransferred"), t("modal.parts.escrowReleased")]
    : [t("modal.parts.escrowHeld"), t("modal.parts.escrowNotified"), t("modal.parts.escrowWaiting")]

  return (
    <div className="my-5 grid gap-2 text-left">
      {steps.map((s, i) => {
        const done = atomic ? true : i < 2
        return (
          <div
            key={s}
            className="flex items-center gap-2.5 rounded-[10px] border border-wp-line/24 bg-wp-panel-2 px-3 py-2.5 font-wp text-[0.8125rem] font-semibold text-wp-fg"
          >
            <span
              className={cn(
                "flex h-[1.375rem] w-[1.375rem] flex-none items-center justify-center rounded-wp-pill border-2 text-[0.6875rem] font-extrabold text-white",
                done ? "border-wp-green bg-wp-green" : "border-wp-accent bg-wp-accent",
              )}
            >
              {done ? <Icon name="check" size={12} stroke={3} /> : i + 1}
            </span>
            {s}
          </div>
        )
      })}
    </div>
  )
}

export const listingHero = (L: WpListing): WpMon | null => L.mons[0] ?? null
