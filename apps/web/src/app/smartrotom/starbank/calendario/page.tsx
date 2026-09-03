"use client";
import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import useStarBank from "../_hooks/useStarBank";
import { useTransactions } from "../_hooks/queries";
import { PageHeader, Card, SectionHead, CardBody, Button, Ico, Skeleton } from "../_components/ui";
import { resolveCategory } from "../_utils/categories";
import { isOutgoing } from "../_utils/account";
import { formatMoney } from "../_utils/format";
import { cn } from "@/lib/utils";
import type { SBTransaction } from "../_types";

interface DayEvent { reason: string; amount: number; category: ReturnType<typeof resolveCategory>; type: "in" | "out" }

function keyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Calendario() {
  const t = useTranslations("starbank");
  const locale = useLocale();
  const { activeAccount } = useStarBank();
  const accId = activeAccount?.id ?? -1;
  const { data: transactions, isLoading } = useTransactions(accId, 100);

  const today = React.useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [selected, setSelected] = React.useState<string | null>(null);

  const all = (transactions ?? []) as SBTransaction[];

  const events = React.useMemo(() => {
    const m = new Map<string, DayEvent[]>();
    for (const t of all) {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) continue;
      const k = keyOf(d);
      const arr = m.get(k) ?? [];
      arr.push({ reason: t.reason, amount: t.amount, category: resolveCategory(t), type: isOutgoing(t, accId) ? "out" : "in" });
      m.set(k, arr);
    }
    return m;
  }, [all, accId]);

  const first = new Date(viewYear, viewMonth, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { day: number; out?: boolean }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ out: true, day: daysInPrev - startOffset + 1 + i });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i });
  while (cells.length % 7 !== 0) cells.push({ out: true, day: cells.length - daysInMonth - startOffset + 1 });

  const monthName = first.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const selectedEvents = selected ? events.get(selected) ?? [] : [];

  function nav(delta: number) {
    let m = viewMonth + delta, y = viewYear;
    while (m < 0) { m += 12; y--; }
    while (m > 11) { m -= 12; y++; }
    setViewMonth(m); setViewYear(y); setSelected(null);
  }
  function isToday(day: number) {
    return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  }

  if (isLoading || !activeAccount) {
    return (
      <>
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 md:grid-cols-12">
          <Skeleton className="h-[32.5rem] rounded-sb-lg md:col-span-8" />
          <Skeleton className="h-[32.5rem] rounded-sb-lg md:col-span-4" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("calendario.title")}
        sub={t("calendario.sub")}
        actions={<Button variant="primary"><Ico name="plus" size={14} /> {t("calendario.newPayment")}</Button>}
      />

      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-8">
          <div className="flex items-center justify-between px-5 pb-1 pt-[1.125rem]">
            <div>
              <div className="mb-0.5 text-[0.6875rem] uppercase tracking-[0.1em] text-sb-fg-subtle">{t("calendario.monthlyView")}</div>
              <h3 className="m-0 font-sb-display text-[1.125rem] font-semibold capitalize">{monthName}</h3>
            </div>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="icon" onClick={() => nav(-1)} aria-label={t("calendario.prevMonth")}><Ico name="arrL" size={14} /></Button>
              <Button variant="secondary" size="sm" onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}>{t("calendario.today")}</Button>
              <Button variant="secondary" size="icon" onClick={() => nav(1)} aria-label={t("calendario.nextMonth")}><Ico name="arrR" size={14} /></Button>
            </div>
          </div>

          <CardBody>
            <div className="grid grid-cols-7 gap-1">
              {(t.raw("calendario.dayHeaders") as string[]).map((d: string) => (
                <div key={d} className="py-2 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-sb-fg-muted">{d}</div>
              ))}
              {cells.map((c, i) => {
                if (c.out) return <div key={i} className="flex aspect-square flex-col rounded-sb-sm p-1.5 text-[0.75rem] text-sb-fg-subtle">{c.day}</div>;
                const k = keyOf(new Date(viewYear, viewMonth, c.day));
                const ev = events.get(k) ?? [];
                const sel = selected === k;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(sel ? null : k)}
                    className={cn(
                      "flex aspect-square cursor-pointer flex-col rounded-sb-sm border border-transparent p-1.5 text-[0.75rem] transition-colors",
                      sel ? "bg-sb-600 text-white hover:bg-sb-700" : "bg-sb-surface-2 text-sb-fg-2 hover:bg-sb-surface-3",
                      !sel && isToday(c.day) && "border-sb-500 font-bold text-sb-700",
                    )}
                  >
                    <span className="font-semibold">{c.day}</span>
                    {ev.length > 0 && (
                      <span className="mt-auto flex gap-[3px]">
                        {ev.slice(0, 3).map((e, j) => (
                          <span key={j} className="size-[0.3125rem] rounded-full" style={{ background: sel ? "#fff" : e.type === "in" ? "#059669" : "#dc2626" }} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-sb-md bg-sb-surface-2 p-3.5">
              {selected ? (
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <strong className="capitalize">{new Date(selected).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</strong>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(null)}><Ico name="x" size={14} /></Button>
                  </div>
                  {selectedEvents.length === 0 && <div className="text-sb-fg-muted">{t("calendario.noMovements")}</div>}
                  {selectedEvents.map((e, i) => (
                    <div key={i} className={cn("flex items-center gap-3 py-2", i > 0 && "border-t border-sb-border")}>
                      <span className="size-2 rounded-full" style={{ background: e.category.hex }} />
                      <div className="flex-1">
                        <div className="text-[0.8125rem] font-semibold">{e.reason}</div>
                        <div className="text-[0.71875rem] text-sb-fg-muted">{t(`categories.${e.category.id}`)}</div>
                      </div>
                      <div className={cn("font-semibold tabular-nums", e.type === "in" ? "text-sb-pos" : "text-sb-neg")}>{e.type === "in" ? "+ " : "− "}{formatMoney(e.amount)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4 text-[0.75rem] text-sb-fg-muted">
                  <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-sb-pos-2" /> {t("calendario.income")}</span>
                  <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-sb-neg-2" /> {t("calendario.expense")}</span>
                  <span>{t("calendario.selectDay")}</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="md:col-span-4">
          <SectionHead eyebrow={t("calendario.scheduled")} title={t("calendario.upcomingPayments")} />
          <CardBody className="items-center justify-center py-12 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-sb-surface-3 text-sb-fg-subtle">
              <Ico name="cal" size={22} />
            </div>
            <div className="text-[0.8125rem] text-sb-fg-muted">{t("calendario.noScheduledPayments")}</div>
            <div className="max-w-[13.75rem] text-[0.75rem] text-sb-fg-subtle">{t("calendario.noScheduledPaymentsDesc")}</div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
