"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Icon, Modal } from "../ui"
import { fareBreakdown } from "../../_utils/fare"
import { formatMoney, formatNum } from "../../_utils/format"
import { PRICE_PER_BLOCK } from "../../_utils/constants"
import type { EnrichedStop, Position } from "../../_types"

/**
 * The last screen before money moves. It shows the route, itemises the fare (base +
 * distance — exactly the formula the server charges), and states the balance before and
 * after, so nothing about the charge is a surprise.
 */
export function ConfirmModal({
  stop,
  player,
  balance,
  pending,
  onConfirm,
  onCancel,
}: {
  stop: EnrichedStop
  player: Position
  balance: number
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const t = useTranslations("taxi.confirmModal")
  const fare = fareBreakdown(stop.dist)
  const after = balance - fare.total

  return (
    <Modal onClose={onCancel} label={t("title")}>
      <div className="rounded-tx-lg border border-solid border-tx-line bg-tx-surface px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="h-[1.625rem] w-[1.625rem] shrink-0 rounded-full bg-tx-blue-500 shadow-[0_0_0_4px_rgb(var(--tx-blue-500)/0.22)]" />
          <div>
            <div className="text-[0.6875rem] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">{t("origin")}</div>
            <div className="mt-px text-sm font-bold text-tx-txt">
              {t("yourPosition")} ·{" "}
              <span className="font-tx-mono">
                {player.x}, {player.z}
              </span>
            </div>
          </div>
        </div>
        <div className="pl-[0.8125rem]">
          <span className="block h-[1.375rem] w-0.5 rounded-sm bg-gradient-to-b from-tx-blue-500 to-tx-accent" />
        </div>
        <div className="flex items-center gap-3">
          <span className="grid h-[1.625rem] w-[1.625rem] shrink-0 place-items-center rounded-full bg-tx-accent text-tx-on-accent shadow-[0_0_0_4px_var(--tx-accent-soft)]">
            <Icon name="pin" size={12} stroke={2.6} />
          </span>
          <div>
            <div className="text-[0.6875rem] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">{t("destination")}</div>
            <div className="mt-px text-sm font-bold text-tx-txt">
              {stop.id} ·{" "}
              <span className="font-tx-mono">
                {stop.x}, {stop.z}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="my-4 flex flex-col gap-2.5">
        <FareRow label={t("baseFare")} value={formatMoney(fare.base)} />
        <FareRow
          label={t("distanceFare", { blocks: formatNum(fare.dist), rate: PRICE_PER_BLOCK })}
          value={formatMoney(fare.distanceFare)}
        />
        <div className="mt-0.5 flex justify-between border-t border-dashed border-tx-line-2 pt-3 text-base font-extrabold text-tx-txt">
          <span>{t("total")}</span>
          <span className="font-tx-mono text-tx-money">{formatMoney(fare.total)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-tx-md border border-solid border-tx-line bg-tx-surface px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.6875rem] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">{t("currentBalance")}</span>
          <strong className="font-tx-mono text-base text-tx-txt">{formatMoney(balance)}</strong>
        </div>
        <span className="shrink-0 text-tx-txt-3">
          <Icon name="arrowR" size={16} stroke={2.2} />
        </span>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[0.6875rem] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">{t("afterTrip")}</span>
          <strong className="font-tx-mono text-base text-tx-txt">{formatMoney(after)}</strong>
        </div>
      </div>

      <div className="mt-[1.125rem] flex gap-2.5">
        <Button variant="quiet" onClick={onCancel} disabled={pending} className="flex-[0_0_38%]">
          {t("cancel")}
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={pending}>
          <Icon name="nav" size={17} stroke={2.4} />
          {pending ? t("charging") : t("confirm")}
        </Button>
      </div>
    </Modal>
  )
}

function FareRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between text-[0.84375rem] text-tx-txt-2", className)}>
      <span>{label}</span>
      <span className="font-tx-mono font-bold text-tx-txt">{value}</span>
    </div>
  )
}

/** The fare exceeds the balance. States the shortfall exactly, then offers the way out. */
export function InsufficientModal({
  stop,
  price,
  balance,
  onClose,
  onTopUp,
}: {
  stop: EnrichedStop
  price: number
  balance: number
  onClose: () => void
  onTopUp: () => void
}) {
  const t = useTranslations("taxi.insufficientModal")
  return (
    <Modal onClose={onClose} label={t("title")}>
      <div className="px-0 pb-1.5 pt-2 text-center">
        <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-[18px] bg-tx-no-soft text-tx-no">
          <Icon name="wallet" size={26} stroke={2} />
        </span>
        <h3 className="mb-1.5 text-[1.1875rem] font-extrabold text-tx-txt">{t("title")}</h3>
        <p className="mb-4 text-sm text-tx-txt-2">
          {t("missing", { amount: formatMoney(price - balance), destination: stop.id })}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-tx-md border border-solid border-tx-line bg-tx-surface px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.6875rem] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">{t("yourBalance")}</span>
          <strong className="font-tx-mono text-base text-tx-no">{formatMoney(balance)}</strong>
        </div>
        <span className="shrink-0 text-tx-txt-3">
          <Icon name="arrowR" size={16} stroke={2.2} />
        </span>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[0.6875rem] font-extrabold uppercase tracking-[0.4px] text-tx-txt-3">{t("fare")}</span>
          <strong className="font-tx-mono text-base text-tx-money">{formatMoney(price)}</strong>
        </div>
      </div>

      <div className="mt-[1.125rem] flex gap-2.5">
        <Button variant="quiet" onClick={onClose} className="flex-[0_0_38%]">
          {t("close")}
        </Button>
        <Button variant="primary" onClick={onTopUp}>
          <Icon name="wallet" size={16} stroke={2.2} />
          {t("viewWallet")}
        </Button>
      </div>
    </Modal>
  )
}
