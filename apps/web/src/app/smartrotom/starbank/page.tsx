"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import useStarBank from "./_hooks/useStarBank";
import { useTransactions } from "./_hooks/queries";
import { PageHeader, Card, SectionHead, CardBody, Kpi, Button, Ico, AccountAvatar, Skeleton, type IconName } from "./_components/ui";
import { TxRow } from "./_components/TxRow";
import { TxDetail } from "./_components/TxDetail";
import { HeroBalance } from "./_components/dashboard/HeroBalance";
import { income, expense, savingsRate, balanceSeries, periodDelta } from "./_utils/analytics";
import { formatMoney } from "./_utils/format";
import { displayName } from "./_utils/account";
import type { SBTransaction } from "./_types";

const BASE = "/smartrotom/starbank";
const DAY = 86_400_000;

export default function Dashboard() {
  const router = useRouter();
  const t = useTranslations("starbank");
  const locale = useLocale();
  const { accounts, activeAccount } = useStarBank();
  const accId = activeAccount?.id ?? -1;
  const { data: transactions, isLoading } = useTransactions(accId, 100);
  const [openTx, setOpenTx] = React.useState<SBTransaction | null>(null);

  if (!activeAccount || isLoading) return <DashboardSkeleton />;

  const txs = (transactions ?? []) as SBTransaction[];
  const inc = income(txs, accId);
  const exp = expense(txs, accId);
  const sav = savingsRate(txs, accId);
  const points = balanceSeries(txs, accId);
  const series = points.map((p) => p.balance);
  const recent = txs.slice(0, 6);

  const now = Date.now();
  const weekAgo = [...points].reverse().find((p) => now - +new Date(p.date) >= 7 * DAY);
  const weekAgoBal = weekAgo?.balance ?? points[0]?.balance;
  const weekDelta = weekAgoBal
    ? { amount: activeAccount.balance - weekAgoBal, pct: ((activeAccount.balance - weekAgoBal) / weekAgoBal) * 100 }
    : undefined;

  const today = new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader
        title={t("dashboard.greeting", { name: displayName((accounts?.find((a) => a.type === "MAIN") ?? activeAccount).name) })}
        sub={t("dashboard.sub", { date: today })}
        actions={
          <Button variant="primary" href={`${BASE}/enviar`}>
            <Ico name="send" size={16} /> {t("common.send")}
          </Button>
        }
      />

      <HeroBalance account={activeAccount} series={series} weekDelta={weekDelta} />

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label={t("dashboard.incomePeriod")} value={formatMoney(inc)} icon="arrUR" tone="pos" delta={periodDelta(txs, accId, 30, income)} sub={t("dashboard.vsPeriod")} />
        <Kpi label={t("dashboard.expensePeriod")} value={formatMoney(exp)} icon="arrDR" tone="neg" delta={periodDelta(txs, accId, 30, expense)} sub={t("dashboard.vsPeriod")} />
        <Kpi label={t("dashboard.savingsRate")} value={`${sav.toFixed(0)} %`} icon="shield" tone="brand" sub={t("dashboard.savedAmount", { amount: formatMoney(Math.max(0, inc - exp)) })} />
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-8">
          <SectionHead eyebrow={t("dashboard.kicker")} title={t("dashboard.quickActions")} />
          <CardBody>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <QuickAction icon="send" t1={t("quickActions.sendMoney")} t2={t("quickActions.sendMoneySub")} onClick={() => router.push(`${BASE}/enviar`)} />
              <QuickAction icon="card" t1={t("quickActions.moveAccounts")} t2={t("quickActions.moveAccountsSub")} onClick={() => router.push(`${BASE}/cuentas`)} />
              <QuickAction icon="qrcode" t1={t("quickActions.requestPayment")} t2={t("quickActions.requestPaymentSub")} />
              <QuickAction icon="cal" t1={t("quickActions.schedulePayment")} t2={t("quickActions.schedulePaymentSub")} onClick={() => router.push(`${BASE}/calendario`)} />
            </div>
          </CardBody>
        </Card>

        <Card className="md:col-span-4">
          <SectionHead eyebrow={t("dashboard.days7")} title={t("dashboard.noScheduledPayments")} action={<Button variant="ghost" size="sm" href={`${BASE}/calendario`}>{t("common.viewAll")}</Button>} />
          <CardBody className="items-center justify-center py-10 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-sb-surface-3 text-sb-fg-subtle">
              <Ico name="cal" size={22} />
            </div>
            <div className="text-[13px] text-sb-fg-muted">{t("dashboard.noScheduledPayments")}</div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-8">
          <SectionHead eyebrow={t("dashboard.recentTransactions")} title={t("dashboard.recentTransactions")} action={<Button variant="ghost" size="sm" href={`${BASE}/transacciones`}>{t("common.viewAll")} <Ico name="arrR" size={14} /></Button>} />
          <CardBody noPad>
            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-sb-fg-muted">{t("dashboard.noTransactions")}</div>
            ) : (
              <div className="flex flex-col">
                {recent.map((tx, i) => (
                  <TxRow key={`${tx.date}-${i}`} tx={tx} activeAccountId={accId} onClick={setOpenTx} />
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="md:col-span-4">
          <SectionHead eyebrow={`${accounts?.length ?? 0} ${t("sidebar.nav.accounts").toLowerCase()}`} title={t("dashboard.yourAccounts")} action={<Button variant="ghost" size="sm" href={`${BASE}/cuentas`}>{t("common.manage")}</Button>} />
          <CardBody noPad className="pb-3.5">
            {(accounts ?? []).map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => router.push(`${BASE}/cuentas`)}
                className="flex items-center gap-3 border-t border-sb-border px-5 py-2.5 text-left transition-colors first:border-t-0 hover:bg-sb-surface-2"
              >
                <AccountAvatar account={acc} size={36} square />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{displayName(acc.name)}</div>
                  <div className="text-[11.5px] text-sb-fg-muted">{acc.type === "MAIN" ? t("accounts.main") : t("accounts.secondary")}</div>
                </div>
                <div className="text-[13.5px] font-semibold tabular-nums">{formatMoney(acc.balance)}</div>
              </button>
            ))}
          </CardBody>
        </Card>
      </div>

      {openTx && <TxDetail tx={openTx} activeAccountId={accId} onClose={() => setOpenTx(null)} />}
    </>
  );
}

function QuickAction({ icon, t1, t2, onClick }: { icon: IconName; t1: string; t2: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-sb-md border border-sb-border bg-sb-surface p-3.5 text-left transition-all hover:border-sb-300 hover:bg-sb-50 hover:shadow-sb-2"
    >
      <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-sb-surface-3 text-sb-700 transition-colors group-hover:bg-sb-100">
        <Ico name={icon} size={18} />
      </span>
      <div>
        <div className="text-[13.5px] font-semibold text-sb-fg">{t1}</div>
        <div className="text-[11.5px] text-sb-fg-muted">{t2}</div>
      </div>
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24 rounded-sb-md" />
      </div>
      <Skeleton className="h-[240px] w-full rounded-sb-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[104px] rounded-sb-lg" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-12">
        <Skeleton className="h-48 rounded-sb-lg md:col-span-8" />
        <Skeleton className="h-48 rounded-sb-lg md:col-span-4" />
      </div>
    </>
  );
}
