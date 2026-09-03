"use client"

import { useTranslations } from "next-intl"
import { Icon, Pill, Skeleton } from "./ui"
import { formatMoney } from "../_utils/format"

/**
 * The app bar. Two live figures only — the balance (which every fare spends) and who you
 * are. Players online and a happy-hour countdown have no data behind them and are
 * registered as deferred.
 *
 * There is deliberately NO light/dark toggle: the mode is a platform choice made once in
 * Ajustes → Temas, not per app.
 */
export function TopBar({
  balance,
  loadingBalance,
  playerName,
  onWallet,
  onProfile,
}: {
  balance?: number
  loadingBalance: boolean
  playerName: string
  onWallet: () => void
  onProfile: () => void
}) {
  const t = useTranslations("taxi.topBar")
  return (
    <header className="z-40 flex h-[3.75rem] shrink-0 items-center justify-between border-b border-solid border-tx-line bg-tx-bg-1/70 px-4 backdrop-blur-[18px]">
      <div className="flex min-w-0 items-center gap-[0.6875rem]">
        <span className="grid h-[2.125rem] w-[2.125rem] shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(140deg,rgb(var(--tx-blue-400)),rgb(var(--tx-blue-700)))] text-white shadow-[0_4px_14px_rgb(37_99_235/0.45)]">
          <Icon name="spark" size={18} stroke={2} />
        </span>
        <span className="whitespace-nowrap font-tx-display text-base font-bold tracking-[0.6px] text-tx-txt">
          {t("appName")}
        </span>
        <span className="mx-[3px] hidden h-[1.375rem] w-px bg-tx-line-2 sm:block" />
        <span className="hidden items-center gap-1.5 whitespace-nowrap text-[0.84375rem] font-semibold text-tx-txt-2 sm:flex">
          <Icon name="nav" size={15} stroke={2.4} className="text-tx-accent" />
          {t("taxiName")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {loadingBalance ? (
          <Skeleton className="h-[2.375rem] w-[7.5rem] rounded-tx-pill" />
        ) : (
          <Pill as="button" tone="money" onClick={onWallet} title={t("openWallet")}>
            <Icon name="coins" size={14} stroke={2.2} />
            {balance === undefined ? "— ¥" : formatMoney(balance)}
            <span className="ml-px grid h-[1.0625rem] w-[1.0625rem] place-items-center rounded-full bg-tx-accent text-tx-on-accent">
              <Icon name="plus" size={11} stroke={3} />
            </span>
          </Pill>
        )}

        <button
          type="button"
          onClick={onProfile}
          aria-label={t("passport")}
          title={t("passport")}
          className="grid h-[2.375rem] w-[2.375rem] shrink-0 place-items-center rounded-full border-2 border-solid border-tx-accent/70 bg-[linear-gradient(140deg,rgb(var(--tx-blue-400)),rgb(var(--tx-blue-700)))] text-sm font-extrabold text-white transition-transform duration-150 ease-tx hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent"
        >
          {playerName.slice(0, 1).toUpperCase() || "?"}
        </button>
      </div>
    </header>
  )
}

export type TaxiTab = "go" | "pass"

/**
 * The panel's tabs. An Eventos tab is gated out rather than shown empty: the events
 * board has no API behind it (the board itself is built and lives in `_deferred/`).
 */
export function NavTabs({ tab, onChange }: { tab: TaxiTab; onChange: (t: TaxiTab) => void }) {
  const t = useTranslations("taxi.navTabs")
  const tabs: { id: TaxiTab; label: string; icon: "pin" | "trophy" }[] = [
    { id: "go", label: t("go"), icon: "pin" },
    { id: "pass", label: t("pass"), icon: "trophy" },
  ]
  return (
    <div className="flex gap-1 px-3 pt-3" role="tablist">
      {tabs.map((tabItem) => {
        const on = tab === tabItem.id
        return (
          <button
            key={tabItem.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tabItem.id)}
            className={`relative flex flex-1 items-center justify-center gap-[0.4375rem] rounded-t-tx-md border-b-2 border-solid px-1.5 py-[0.6875rem] text-[0.8125rem] font-bold transition-[color,border-color,background] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent ${
              on
                ? "border-tx-accent bg-tx-surface text-tx-txt"
                : "border-transparent text-tx-txt-3 hover:text-tx-txt-2"
            }`}
          >
            <Icon name={tabItem.icon} size={15} stroke={2.2} />
            {tabItem.label}
          </button>
        )
      })}
    </div>
  )
}
