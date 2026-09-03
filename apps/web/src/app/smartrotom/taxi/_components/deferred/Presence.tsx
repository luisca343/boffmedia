import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "../ui"
import { formatNum, countdown } from "../../_utils/format"

/**
 * [deferred] Live presence — how many players are standing at a stop right now.
 *
 * Wingull exposes no player-position or online-count endpoint, so there is nothing to
 * count. It would need the game server to publish per-stop presence; until then this
 * renders nowhere in the app.
 */
export function LivePill({ count }: { count: number }) {
  const hot = count >= 40
  const quiet = count < 5
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-tx-mono text-xs font-bold",
        hot ? "text-tx-ok" : "text-tx-txt-2",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full bg-current",
          hot && "shadow-[0_0_0_3px_var(--tx-ok-soft)]",
        )}
      />
      {quiet ? 0 : formatNum(count)}
    </span>
  )
}

/** [deferred] The "N en línea" pill in the top bar — same missing endpoint as `LivePill`. */
export function OnlinePill({ count }: { count: number }) {
  const t = useTranslations("taxi.presence")
  return (
    <span className="flex items-center gap-[0.4375rem] whitespace-nowrap rounded-tx-pill border border-solid border-tx-line bg-tx-surface px-3 py-2 text-[0.8125rem] font-bold text-tx-txt-2">
      <span className="h-2 w-2 animate-pulse rounded-full bg-tx-ok shadow-[0_0_0_3px_var(--tx-ok-soft)] motion-reduce:animate-none" />
      {t("onlineCount", { count: formatNum(count) })}
    </span>
  )
}

/**
 * [deferred] Happy hour — a time-boxed discount on every fare.
 *
 * There is no promotions backend and no discount field on the fare. Applying one
 * client-side would mean the client decides what to charge, which the payment path must
 * never do.
 */
export function HappyHourBanner({ discount, endsInMin }: { discount: number; endsInMin: number }) {
  const t = useTranslations("taxi")
  const c = countdown(endsInMin)
  return (
    <div className="flex items-center gap-[0.6875rem] rounded-tx-md border border-solid border-tx-accent-soft bg-[linear-gradient(120deg,var(--tx-accent-soft),rgb(var(--tx-blue-600)/0.16))] px-3.5 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-tx-accent text-tx-on-accent shadow-[0_0_16px_var(--tx-accent-glow)]">
        <Icon name="flame" size={19} stroke={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[0.84375rem] font-extrabold text-tx-txt">
          {t("presence.happyHourTitle", { percent: Math.round(discount * 100) })}
        </div>
        <div className="mt-px text-xs text-tx-txt-2">{t("presence.happyHourSub")}</div>
      </div>
      <span className="font-tx-mono text-[0.8125rem] font-extrabold text-tx-money">{t(`countdown.${c.key}`, c.values)}</span>
    </div>
  )
}
