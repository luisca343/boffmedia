import type { SBTransaction } from "../_types";
import { balanceAfter, isOutgoing } from "./account";
import { CATEGORIES, resolveCategory, type CategoryId } from "./categories";

const DAY = 86_400_000;

export function withinDays(transactions: SBTransaction[] = [], days: number): SBTransaction[] {
  if (days >= 9999) return transactions;
  const cutoff = Date.now() - days * DAY;
  return transactions.filter((t) => new Date(t.date).getTime() >= cutoff);
}

export function income(transactions: SBTransaction[] = [], accountId: number): number {
  return transactions.reduce((s, t) => (isOutgoing(t, accountId) ? s : s + t.amount), 0);
}

export function expense(transactions: SBTransaction[] = [], accountId: number): number {
  return transactions.reduce((s, t) => (isOutgoing(t, accountId) ? s + t.amount : s), 0);
}

export function savingsRate(transactions: SBTransaction[] = [], accountId: number): number {
  const inc = income(transactions, accountId);
  if (inc <= 0) return 0;
  return ((inc - expense(transactions, accountId)) / inc) * 100;
}

export function largestExpense(transactions: SBTransaction[] = [], accountId: number): number {
  return transactions.reduce((m, t) => (isOutgoing(t, accountId) && t.amount > m ? t.amount : m), 0);
}

export interface BalancePoint { date: string; balance: number; day: number }

/** Chronological running-balance series (oldest → newest) from the account's
 *  perspective, using the real per-transaction balances. */
export function balanceSeries(transactions: SBTransaction[] = [], accountId: number): BalancePoint[] {
  const chrono = [...transactions].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const now = Date.now();
  return chrono.map((t) => ({
    date: t.date,
    balance: balanceAfter(t, accountId),
    day: Math.max(0, Math.round((now - new Date(t.date).getTime()) / DAY)),
  }));
}

export interface CategorySlice { id: CategoryId; label: string; hex: string; value: number }

/** Expense totals grouped by derived category (desc), for the donut. */
export function expenseByCategory(transactions: SBTransaction[] = [], accountId: number): CategorySlice[] {
  const acc = new Map<CategoryId, number>();
  for (const t of transactions) {
    if (!isOutgoing(t, accountId)) continue;
    const cat = resolveCategory(t);
    acc.set(cat.id, (acc.get(cat.id) ?? 0) + t.amount);
  }
  return [...acc.entries()]
    .map(([id, value]) => ({ id, value, hex: CATEGORIES[id].hex, label: CATEGORIES[id].label }))
    .sort((a, b) => b.value - a.value);
}

export interface WeekBar { label: string; income: number; expense: number }

/** Income vs expense for the last `weeks` calendar weeks (oldest → newest). */
export function weeklyIncomeExpense(transactions: SBTransaction[] = [], accountId: number, weeks = 4): WeekBar[] {
  const out: WeekBar[] = [];
  const now = Date.now();
  for (let w = weeks - 1; w >= 0; w--) {
    const end = now - w * 7 * DAY;
    const start = end - 7 * DAY;
    const slice = transactions.filter((t) => {
      const ts = new Date(t.date).getTime();
      return ts >= start && ts < end;
    });
    out.push({
      label: `S${weeks - w}`,
      income: income(slice, accountId),
      expense: expense(slice, accountId),
    });
  }
  return out;
}

/** Percentage delta of a metric between the current and previous window of
 *  `days`. Returns `null` when there isn't enough history to be meaningful. */
export function periodDelta(
  transactions: SBTransaction[] = [],
  accountId: number,
  days: number,
  metric: (txs: SBTransaction[], id: number) => number,
): number | null {
  const now = Date.now();
  const curr = transactions.filter((t) => now - +new Date(t.date) < days * DAY);
  const prev = transactions.filter((t) => {
    const age = now - +new Date(t.date);
    return age >= days * DAY && age < 2 * days * DAY;
  });
  if (prev.length === 0) return null;
  const p = metric(prev, accountId);
  if (p === 0) return null;
  return ((metric(curr, accountId) - p) / p) * 100;
}
