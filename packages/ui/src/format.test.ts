import { describe, expect, it, vi, afterEach } from "vitest"
import { formatCompact, formatMoney, formatNumber, timeAgo, timeAgoLong, toMs } from "./format"

describe("formatMoney", () => {
  it("renders zero as a real amount, not a dash", () => {
    expect(formatMoney(0)).toBe("0 ¥")
  })

  it("keeps the sign on a negative balance", () => {
    expect(formatMoney(-1500)).toBe("-1500 ¥")
    expect(formatMoney(-12345)).toBe("-12.345 ¥")
  })

  // es-ES does not group four-digit numbers: 1234 stays "1234" but 12345 becomes "12.345".
  it("groups from five digits up, per es-ES", () => {
    expect(formatMoney(1234)).toBe("1234 ¥")
    expect(formatMoney(12345)).toBe("12.345 ¥")
    expect(formatMoney(1234567)).toBe("1.234.567 ¥")
  })

  it("rounds half up rather than truncating fractional ¥", () => {
    expect(formatMoney(1234.5)).toBe("1235 ¥")
    expect(formatMoney(1234.4)).toBe("1234 ¥")
    expect(formatMoney(0.5)).toBe("1 ¥")
  })

  it("survives a balance at the top of the safe-integer range", () => {
    expect(formatMoney(Number.MAX_SAFE_INTEGER)).toBe("9.007.199.254.740.991 ¥")
  })

  it("degrades to a dash instead of printing NaN or ∞ at a player", () => {
    expect(formatMoney(NaN)).toBe("— ¥")
    expect(formatMoney(Infinity)).toBe("— ¥")
    expect(formatMoney(-Infinity)).toBe("— ¥")
  })

  it("does not leak a minus sign when a tiny negative rounds to zero", () => {
    expect(formatMoney(-0.4)).toBe("0 ¥")
  })
})

describe("formatNumber", () => {
  it("rounds before grouping", () => {
    expect(formatNumber(12345.6)).toBe("12.346")
  })
  it("returns a dash for non-finite input", () => {
    expect(formatNumber(NaN)).toBe("—")
    expect(formatNumber(Infinity)).toBe("—")
  })
})

describe("formatCompact", () => {
  it("switches to K and M at the thresholds, not before", () => {
    expect(formatCompact(999)).toBe("999")
    expect(formatCompact(1_000)).toBe("1,0 K")
    expect(formatCompact(999_999)).toBe("1000,0 K")
    expect(formatCompact(1_000_000)).toBe("1,0 M")
  })

  // The thresholds are `>=`, so negatives fall through to the plain branch. Fine for
  // the counts this formats (views, followers); it is not a money formatter.
  it("leaves negative values uncompacted", () => {
    expect(formatCompact(-5_000)).toBe("-5000")
  })

  it("returns empty for non-finite input", () => {
    expect(formatCompact(NaN)).toBe("")
  })
})

describe("toMs", () => {
  it("passes numbers through untouched", () => {
    expect(toMs(1_700_000_000_000)).toBe(1_700_000_000_000)
  })
  it("collapses null, undefined and unparseable strings to 0", () => {
    expect(toMs(null)).toBe(0)
    expect(toMs(undefined)).toBe(0)
    expect(toMs("not a date")).toBe(0)
  })
  it("parses ISO strings and Dates alike", () => {
    const iso = "2026-07-12T14:36:00.000Z"
    expect(toMs(iso)).toBe(new Date(iso).getTime())
    expect(toMs(new Date(iso))).toBe(new Date(iso).getTime())
  })
})

describe("timeAgo", () => {
  afterEach(() => vi.useRealTimers())

  it("walks the units up to a week, then falls back to a date", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-12T12:00:00Z"))
    expect(timeAgo("2026-07-12T11:59:30Z")).toBe("ahora")
    expect(timeAgo("2026-07-12T11:56:00Z")).toBe("hace 4 min")
    expect(timeAgo("2026-07-12T09:00:00Z")).toBe("hace 3 h")
    expect(timeAgo("2026-07-10T12:00:00Z")).toBe("hace 2 d")
    expect(timeAgo("2026-06-12T12:00:00Z")).toBe("12 jun")
  })

  it("shows a dash rather than a bogus date when the value is missing", () => {
    expect(timeAgo(null)).toBe("—")
    expect(timeAgo("garbage")).toBe("—")
  })
})

describe("timeAgoLong", () => {
  afterEach(() => vi.useRealTimers())

  it("singularises the unit at exactly one", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-12T12:00:00Z"))
    expect(timeAgoLong("2026-07-11T12:00:00Z")).toBe("hace 1 día")
    expect(timeAgoLong("2026-07-09T12:00:00Z")).toBe("hace 3 días")
    expect(timeAgoLong("2026-06-28T12:00:00Z")).toBe("hace 2 semanas")
  })

  it("never reports zero — a just-now value floors to one second", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-12T12:00:00Z"))
    expect(timeAgoLong("2026-07-12T12:00:00Z")).toBe("hace 1 segundo")
  })

  it("returns empty for missing input", () => {
    expect(timeAgoLong(undefined)).toBe("")
  })
})
