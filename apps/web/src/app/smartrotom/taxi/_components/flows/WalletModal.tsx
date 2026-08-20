"use client"

import { useTranslations } from "next-intl"
import type { StarBankTransaction } from "@boffmedia/shared"
import { cn } from "@/lib/utils"
import { Empty, Eyebrow, Icon, Modal, ModalTitle, Skeleton } from "../ui"
import { formatMoney, formatNum, relativeTime } from "../../_utils/format"

/**
 * Cartera — the player's StarBank balance and their real recent movements.
 *
 * No coin packs and no top-up grid: there is no packages endpoint, no payment
 * provider and no prices behind them. Inventing a storefront — especially one
 * that takes money — would be fabricating a product, so the wallet states only
 * what is true: what you have, and where it went.
 */
export function WalletModal({
  balance,
  transactions,
  accountIds,
  loading,
  playerName,
  onClose,
}: {
  balance?: number
  transactions: StarBankTransaction[]
  /**
   * The player's own account ids. Money leaving one of them is a debit. This is read
   * from `from`/`to` rather than the entity's `isPayer` flag, which the transactions
   * endpoint does not populate — trusting it painted every debit as a green credit.
   */
  accountIds: number[]
  loading: boolean
  playerName: string
  onClose: () => void
}) {
  const t = useTranslations("taxi.walletModal")
  return (
    <Modal onClose={onClose} label={t("title")} className="max-w-[480px]">
      <ModalTitle icon="wallet" title={t("starbankTitle")} onClose={onClose} />

      <div className="relative mb-[18px] overflow-hidden rounded-tx-lg border border-solid border-tx-line-2 bg-[linear-gradient(135deg,#0b1c45,#15306e)] p-[18px] text-white">
        {/* The amber bloom — the one place the money colour becomes light, not ink. */}
        <span className="pointer-events-none absolute -right-[8%] -top-1/2 h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,var(--tx-accent-glow),transparent_64%)]" />
        <div className="relative text-[11.5px] font-extrabold uppercase tracking-[0.6px] text-white/60">
          {t("availableBalance")}
        </div>
        {loading || balance === undefined ? (
          <Skeleton className="relative mt-1 h-[38px] w-40 bg-white/10" />
        ) : (
          <div className="relative mt-1 font-tx-mono text-[38px] font-extrabold leading-none text-tx-accent">
            {formatNum(balance)}
            <span className="ml-1 text-[22px] text-white/70">¥</span>
          </div>
        )}
        <div className="relative mt-2 text-xs text-white/60">
          {t("syncedWith", { player: playerName })}
        </div>
      </div>

      <Eyebrow icon="clock" className="mb-2.5">
        {t("recentMovements")}
      </Eyebrow>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[52px] rounded-tx-md" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <Empty icon="clock" message={t("emptyMovements")} />
      ) : (
        <div>
          {transactions.slice(0, 8).map((tx, i) => {
            // Money that left one of the player's own accounts.
            const debit = accountIds.includes(tx.from)
            return (
              <div
                key={`${tx.date}-${i}`}
                className="flex items-center gap-[11px] border-b border-solid border-tx-line px-1 py-[11px] last:border-b-0"
              >
                <span
                  className={cn(
                    "grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px]",
                    debit ? "bg-tx-surface-2 text-tx-txt-2" : "bg-tx-ok-soft text-tx-ok",
                  )}
                >
                  <Icon name={debit ? "route" : "arrowDown"} size={16} stroke={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold text-tx-txt">{tx.reason || t("movement")}</div>
                  <div className="mt-px text-[11.5px] text-tx-txt-3">{relativeTime(new Date(tx.date).getTime())}</div>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-tx-mono text-sm font-extrabold",
                    debit ? "text-tx-txt-2" : "text-tx-ok",
                  )}
                >
                  {debit ? "−" : "+"}
                  {formatMoney(tx.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
