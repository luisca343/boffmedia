"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Icon, Stat } from "./ui"
import { formatMoney, formatNum } from "../_utils/format"
import { compassLabel } from "../_utils/geo"
import type { EnrichedStop } from "../_types"

/**
 * The destination card — the one surface in the app that spends money, so it is the one
 * surface with an amber button.
 *
 * It always states the balance the player will be left with BEFORE they commit. When the
 * fare exceeds the balance, the primary action becomes "recargar" rather than a disabled
 * "viajar": a dead button tells the player they're stuck, this one tells them the way out.
 */
export function SelectedCard({
  stop,
  balance,
  onTravel,
  onTopUp,
  onClose,
  onRecenter,
  favorite,
  onToggleFavorite,
  bare = false,
}: {
  stop: EnrichedStop
  balance?: number
  onTravel: (stop: EnrichedStop) => void
  onTopUp: () => void
  onClose: () => void
  onRecenter: () => void
  favorite: boolean
  onToggleFavorite: (id: string) => void
  /** Inside the mobile sheet the card IS the surface — it drops its own chrome. */
  bare?: boolean
}) {
  const t = useTranslations("taxi.selectedCard")
  const affordable = balance !== undefined && balance >= stop.price
  const after = (balance ?? 0) - stop.price

  return (
    <div
      role="group"
      aria-label={t("destination", { name: stop.id })}
      className={cn(
        bare
          ? "p-0"
          : "rounded-tx-xl border border-solid border-tx-accent-soft bg-tx-surface-solid/90 p-4 shadow-tx-2 backdrop-blur-[22px] animate-tx-card-in motion-reduce:animate-none",
      )}
    >
      <div className="flex items-center gap-[11px]">
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-tx-accent text-tx-on-accent shadow-[0_0_18px_var(--tx-accent-glow)]">
          <Icon name="pin" size={18} stroke={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-extrabold text-tx-txt">{stop.id}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-tx-txt-2">
            <Icon
              name="nav"
              size={12}
              stroke={2.2}
              className="text-tx-accent"
              style={{ transform: `rotate(${stop.bearing}deg)` }}
            />
            {compassLabel(stop.bearing)}
            {stop.region && <> · {stop.region}</>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite(stop.id)}
          aria-label={favorite ? t("removeFavorite") : t("addFavorite")}
          aria-pressed={favorite}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-[10px] bg-tx-surface transition-all duration-150",
            "hover:bg-tx-surface-2 hover:text-tx-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent",
            favorite ? "text-tx-accent" : "text-tx-txt-3",
          )}
        >
          <Icon name="star" size={18} stroke={2.2} style={{ fill: favorite ? "currentColor" : "none" }} />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-tx-surface text-tx-txt-2 transition-[background,color] duration-150 hover:bg-tx-surface-2 hover:text-tx-txt"
        >
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat icon="crosshair" label={t("coords")} value={`${stop.x}, ${stop.z}`} />
        <Stat icon="walking" label={t("distance")} value={`${formatNum(stop.dist)} b`} />
        <Stat icon="coins" label={t("fare")} value={formatMoney(stop.price)} tone={affordable ? "money" : "bad"} />
      </div>

      <div className="mt-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between px-0.5 text-[13px] text-tx-txt-2">
          <span>{t("balanceAfter")}</span>
          <strong className={cn("font-tx-mono text-[15px]", affordable ? "text-tx-txt" : "text-tx-no")}>
            {balance === undefined ? "— ¥" : formatMoney(Math.max(0, after))}
          </strong>
        </div>
        <div className="flex gap-[9px]">
          <Button variant="ghost" onClick={onRecenter} aria-label={t("centerMap")} title={t("centerMap")}>
            <Icon name="crosshair" size={17} stroke={2} />
          </Button>
          {affordable ? (
            <Button variant="primary" onClick={() => onTravel(stop)}>
              <Icon name="nav" size={17} stroke={2.4} />
              {t("travel", { price: formatMoney(stop.price) })}
            </Button>
          ) : (
            <Button variant="secondary" onClick={onTopUp}>
              <Icon name="wallet" size={17} stroke={2.2} />
              {t("topUp")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
