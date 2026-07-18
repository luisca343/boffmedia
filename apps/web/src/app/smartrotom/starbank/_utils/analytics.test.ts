import { describe, expect, it, vi, afterEach } from "vitest"
import type { SBTransaction } from "../_types"
import {
  balanceSeries,
  expense,
  expenseByCategory,
  income,
  largestExpense,
  periodDelta,
  savingsRate,
  weeklyIncomeExpense,
  withinDays,
} from "./analytics"

const ME = 1
const THEM = 2

const NOW = new Date("2026-07-12T12:00:00Z")
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString()

function tx(over: Partial<SBTransaction> = {}): SBTransaction {
  return {
    from: THEM,
    to: ME,
    amount: 100,
    reason: "Pago",
    date: daysAgo(1),
    fromBalance: 0,
    toBalance: 0,
    ...over,
  }
}

/** Money leaving ME. */
const out = (amount: number, over: Partial<SBTransaction> = {}) =>
  tx({ from: ME, to: THEM, amount, ...over })
/** Money arriving at ME. */
const inc = (amount: number, over: Partial<SBTransaction> = {}) =>
  tx({ from: THEM, to: ME, amount, ...over })

describe("income / expense", () => {
  it("splits by direction from the given account's perspective", () => {
    const txs = [inc(500), out(200), inc(300), out(50)]
    expect(income(txs, ME)).toBe(800)
    expect(expense(txs, ME)).toBe(250)
  })

  it("flips entirely when read from the counterparty's side", () => {
    const txs = [inc(500), out(200)]
    expect(income(txs, THEM)).toBe(200)
    expect(expense(txs, THEM)).toBe(500)
  })

  it("counts a self-transfer as an expense only, never both", () => {
    const txs = [tx({ from: ME, to: ME, amount: 400 })]
    expect(expense(txs, ME)).toBe(400)
    expect(income(txs, ME)).toBe(0)
  })

  it("is zero on an empty or missing list", () => {
    expect(income([], ME)).toBe(0)
    expect(income(undefined, ME)).toBe(0)
    expect(expense(undefined, ME)).toBe(0)
  })
})

describe("savingsRate", () => {
  it("is the share of income not spent", () => {
    expect(savingsRate([inc(1000), out(250)], ME)).toBe(75)
  })

  it("goes negative when spending outruns income", () => {
    expect(savingsRate([inc(100), out(300)], ME)).toBe(-200)
  })

  // Guards the division: no income means no rate, not Infinity or NaN.
  it("is zero when there is no income at all", () => {
    expect(savingsRate([out(300)], ME)).toBe(0)
    expect(savingsRate([], ME)).toBe(0)
  })
})

describe("largestExpense", () => {
  it("ignores incoming rows even when they are bigger", () => {
    expect(largestExpense([inc(9999), out(400), out(120)], ME)).toBe(400)
  })
  it("is zero when nothing went out", () => {
    expect(largestExpense([inc(9999)], ME)).toBe(0)
  })
})

describe("withinDays", () => {
  afterEach(() => vi.useRealTimers())

  it("keeps only rows inside the window", () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    const txs = [inc(1, { date: daysAgo(2) }), inc(2, { date: daysAgo(20) })]
    expect(withinDays(txs, 7)).toHaveLength(1)
  })

  it("treats the sentinel window as 'everything', without touching the clock", () => {
    const txs = [inc(1, { date: daysAgo(2) }), inc(2, { date: daysAgo(5000) })]
    expect(withinDays(txs, 9999)).toBe(txs)
  })
})

describe("balanceSeries", () => {
  afterEach(() => vi.useRealTimers())

  it("orders oldest to newest and reads the balance from the right side of each row", () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    const txs = [
      inc(100, { date: daysAgo(1), fromBalance: 10, toBalance: 900 }),
      out(50, { date: daysAgo(3), fromBalance: 800, toBalance: 20 }),
    ]
    const series = balanceSeries(txs, ME)
    expect(series.map((p) => p.balance)).toEqual([800, 900])
    expect(series.map((p) => p.day)).toEqual([3, 1])
  })

  it("does not mutate the caller's array while sorting", () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    const txs = [inc(1, { date: daysAgo(1) }), inc(2, { date: daysAgo(9) })]
    const order = txs.map((t) => t.date)
    balanceSeries(txs, ME)
    expect(txs.map((t) => t.date)).toEqual(order)
  })
})

describe("expenseByCategory", () => {
  it("groups outgoing rows by derived category, largest first", () => {
    const txs = [
      out(300, { reason: "Compra en la tienda" }),
      out(100, { reason: "Cuota de liga" }),
      out(200, { reason: "Pokébola x10" }),
      inc(9999, { reason: "Compra en la tienda" }),
    ]
    const slices = expenseByCategory(txs, ME)
    expect(slices.map((s) => [s.id, s.value])).toEqual([
      ["shop", 500],
      ["league", 100],
    ])
  })

  it("buckets an unrecognised reason under 'other' rather than dropping it", () => {
    const slices = expenseByCategory([out(75, { reason: "zzzz" })], ME)
    expect(slices).toEqual([expect.objectContaining({ id: "other", value: 75 })])
  })

  it("is empty when nothing went out", () => {
    expect(expenseByCategory([inc(500)], ME)).toEqual([])
  })
})

describe("weeklyIncomeExpense", () => {
  afterEach(() => vi.useRealTimers())

  it("returns one oldest-to-newest bar per week and drops nothing into two buckets", () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    const txs = [inc(100, { date: daysAgo(2) }), out(40, { date: daysAgo(9) }), inc(10, { date: daysAgo(30) })]
    const bars = weeklyIncomeExpense(txs, ME, 4)

    expect(bars.map((b) => b.label)).toEqual(["S1", "S2", "S3", "S4"])
    expect(bars[3]).toEqual({ label: "S4", income: 100, expense: 0 })
    expect(bars[2]).toEqual({ label: "S3", income: 0, expense: 40 })
    // 30 days back is outside a 4-week window, so it lands nowhere.
    expect(bars.reduce((s, b) => s + b.income, 0)).toBe(100)
  })
})

describe("periodDelta", () => {
  afterEach(() => vi.useRealTimers())

  it("compares the current window against the one immediately before it", () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    const txs = [inc(150, { date: daysAgo(2) }), inc(100, { date: daysAgo(10) })]
    expect(periodDelta(txs, ME, 7, income)).toBe(50)
  })

  it("returns null rather than Infinity when the previous window has no history", () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    expect(periodDelta([inc(150, { date: daysAgo(2) })], ME, 7, income)).toBeNull()
  })

  it("returns null rather than dividing by a zero baseline", () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    // The previous window has rows, but none of them are income — the baseline is 0.
    const txs = [inc(150, { date: daysAgo(2) }), out(100, { date: daysAgo(10) })]
    expect(periodDelta(txs, ME, 7, income)).toBeNull()
  })
})
