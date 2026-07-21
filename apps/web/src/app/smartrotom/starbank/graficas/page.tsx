"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import useStarBank from "../_hooks/useStarBank";
import { useTransactions } from "../_hooks/queries";
import { PageHeader, Card, SectionHead, CardBody, Kpi, Button, Ico, Seg, AreaChart, BarChart, Donut, Skeleton } from "../_components/ui";
import { income, expense, withinDays, balanceSeries, expenseByCategory, weeklyIncomeExpense, largestExpense } from "../_utils/analytics";
import { displayName } from "../_utils/account";
import { formatMoney } from "../_utils/format";
import type { SBTransaction } from "../_types";

const DAY = 86_400_000;

export default function Graficas() {
  const t = useTranslations("starbank");
  const { activeAccount } = useStarBank();

  const RANGES = [
    { id: "7d", label: t("graficas.rangeLabels.7d"), days: 7 },
    { id: "30d", label: t("graficas.rangeLabels.30d"), days: 30 },
    { id: "90d", label: t("graficas.rangeLabels.90d"), days: 90 },
    { id: "1y", label: t("graficas.rangeLabels.1y"), days: 365 },
  ];
  const accId = activeAccount?.id ?? -1;
  const { data: transactions, isLoading } = useTransactions(accId, 100);
  const [range, setRange] = React.useState("30d");

  const days = RANGES.find((r) => r.id === range)?.days ?? 30;
  const all = (transactions ?? []) as SBTransaction[];
  const filtered = React.useMemo(() => withinDays(all, days), [all, days]);

  if (isLoading || !activeAccount) {
    return (
      <>
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[104px] rounded-sb-lg" />)}</div>
        <Skeleton className="h-[320px] rounded-sb-lg" />
      </>
    );
  }

  const inc = income(filtered, accId);
  const exp = expense(filtered, accId);
  const avg = filtered.length ? (inc + exp) / filtered.length : 0;
  const series = balanceSeries(filtered, accId).map((p) => ({ balance: p.balance, day: p.day }));
  const byCat = expenseByCategory(filtered, accId);
  const weekly = weeklyIncomeExpense(all, accId, 4);
  const largest = largestExpense(filtered, accId);
  const catTotal = byCat.reduce((s, c) => s + c.value, 0) || 1;

  // real 14-day activity (transaction count per day)
  const now = Date.now();
  const activity = Array.from({ length: 14 }).map((_, i) => {
    const dayStart = now - (13 - i) * DAY;
    return all.filter((t) => { const ts = +new Date(t.date); return ts >= dayStart - DAY && ts < dayStart; }).length;
  });
  const maxAct = Math.max(1, ...activity);

  return (
    <>
      <PageHeader
        title={t("graficas.title")}
        sub={t("graficas.sub", { name: displayName(activeAccount.name), count: filtered.length })}
        actions={
          <>
            <Seg options={RANGES} value={range} onChange={setRange} />
            <Button variant="secondary"><Ico name="download" size={14} /> {t("common.export")}</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label={t("graficas.kpi.income")} value={formatMoney(inc)} icon="arrUR" tone="pos" />
        <Kpi label={t("graficas.kpi.expenses")} value={formatMoney(exp)} icon="arrDR" tone="neg" />
        <Kpi label={t("graficas.kpi.avgTransaction")} value={formatMoney(Math.round(avg))} icon="chart" tone="brand" sub={t("graficas.kpi.operations", { count: filtered.length })} />
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-8">
          <SectionHead eyebrow={t("graficas.charts.balanceEvolution")} title={t("graficas.charts.balanceEvolution")} />
          <CardBody>
            <AreaChart data={series} height={260} color="#2463eb" />
          </CardBody>
        </Card>
        <Card className="md:col-span-4">
          <SectionHead eyebrow={t("graficas.charts.largestExpense")} title={t("graficas.charts.largestExpense")} />
          <CardBody>
            <div className="font-sb-display text-[32px] font-semibold tabular-nums tracking-[-0.01em]">{formatMoney(largest)}</div>
            <div className="text-[13px] text-sb-fg-muted">{t("graficas.charts.largestExpenseDesc")}</div>
            <div className="h-px bg-sb-border" />
            <div className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.02em] text-sb-fg-muted">{t("graficas.charts.activity14d")}</div>
            <div className="flex h-20 w-full items-end gap-1">
              {activity.map((a, i) => (
                <div key={i} className="flex-1 rounded" style={{ height: `${20 + (a / maxAct) * 60}%`, background: a === maxAct && a > 0 ? "#2463eb" : "#bfdbfe" }} />
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-6">
          <SectionHead eyebrow={t("graficas.charts.incomeVsExpenses")} title={t("graficas.charts.incomeVsExpenses")} />
          <CardBody>
            <BarChart data={weekly} height={220} />
            <div className="flex justify-center gap-4 pt-2">
              <span className="flex items-center gap-1.5 text-[12px]"><span className="size-2.5 rounded bg-sb-pos-2" /> {t("graficas.kpi.income")}</span>
              <span className="flex items-center gap-1.5 text-[12px]"><span className="size-2.5 rounded bg-sb-neg-2" /> {t("graficas.kpi.expenses")}</span>
            </div>
          </CardBody>
        </Card>

        <Card className="md:col-span-6">
          <SectionHead eyebrow={t("graficas.charts.byCategory")} title={t("graficas.charts.byCategory")} />
          <CardBody className="flex-row items-center justify-between gap-7">
            {byCat.length === 0 ? (
              <div className="w-full py-8 text-center text-[13px] text-sb-fg-muted">{t("graficas.charts.noExpenses")}</div>
            ) : (
              <>
                <Donut data={byCat} size={200} thickness={26} />
                <div className="flex flex-1 flex-col gap-2">
                  {byCat.map((c) => {
                    const pct = (c.value / catTotal) * 100;
                    return (
                      <div key={c.id} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="flex items-center gap-2"><span className="size-2.5 rounded" style={{ background: c.hex }} />{c.label}</span>
                          <span className="font-semibold tabular-nums">{formatMoney(c.value)}</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-sb-surface-3">
                          <div className="h-full" style={{ width: `${pct}%`, background: c.hex }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
