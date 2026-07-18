import { describe, expect, it, vi, afterEach } from "vitest"
import { fmtDate, fmtInt, fmtSigned, fmtTime, parseAmount } from "./format"

describe("parseAmount", () => {
  it("reads es-ES thousands separators as grouping, not decimals", () => {
    expect(parseAmount("1.234")).toBe(1234)
    expect(parseAmount("1.234.567")).toBe(1234567)
  })

  it("reads a comma as the decimal separator and rounds to whole ¥", () => {
    expect(parseAmount("1234,56")).toBe(1235)
    expect(parseAmount("1.234,56")).toBe(1235)
    expect(parseAmount("1,5")).toBe(2)
    expect(parseAmount("1,4")).toBe(1)
  })

  it("collapses empty and junk input to zero so the form blocks it downstream", () => {
    expect(parseAmount("")).toBe(0)
    expect(parseAmount("   ")).toBe(0)
    expect(parseAmount("abc")).toBe(0)
    expect(parseAmount("1,2,3")).toBe(0)
  })

  it("does not silently absolute a typed minus — the guard must reject it", () => {
    expect(parseAmount("-500")).toBe(-500)
  })

  it("tolerates surrounding whitespace", () => {
    expect(parseAmount("  12  ")).toBe(12)
  })

  it("keeps precision up to the safe-integer ceiling", () => {
    expect(parseAmount("9007199254740991")).toBe(9007199254740991)
  })
})

describe("fmtInt", () => {
  it("rounds and groups per es-ES", () => {
    expect(fmtInt(12345.6)).toBe("12.346")
    expect(fmtInt(1234)).toBe("1234")
  })

  it("treats NaN as zero rather than rendering NaN", () => {
    expect(fmtInt(NaN)).toBe("0")
    expect(fmtInt(0)).toBe("0")
  })
})

describe("fmtSigned", () => {
  it("prefixes with a real minus glyph for outgoing money", () => {
    expect(fmtSigned(-1500)).toBe("− 1500 ¥")
    expect(fmtSigned(-12345)).toBe("− 12.345 ¥")
  })

  it("prefixes with a plus for incoming money", () => {
    expect(fmtSigned(12345)).toBe("+ 12.345 ¥")
  })

  // Amounts in the API are unsigned; the sign comes from the caller's perspective,
  // so a zero-amount row must not render as a debit.
  it("treats zero as incoming", () => {
    expect(fmtSigned(0)).toBe("+ 0 ¥")
    expect(fmtSigned(-0)).toBe("+ 0 ¥")
  })

  it("never emits a double sign — the magnitude is always absolute", () => {
    expect(fmtSigned(-1500)).not.toContain("-")
  })
})

describe("fmtDate", () => {
  afterEach(() => vi.useRealTimers())

  it("returns empty for an unparseable date instead of 'Invalid Date'", () => {
    expect(fmtDate("not a date")).toBe("")
    expect(fmtTime("not a date")).toBe("")
  })

  it("names today and yesterday in relative mode", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-12T12:00:00Z"))
    expect(fmtDate("2026-07-12T09:00:00Z", "rel")).toBe("Hoy")
    expect(fmtDate("2026-07-11T09:00:00Z", "rel")).toBe("Ayer")
    expect(fmtDate("2026-07-09T09:00:00Z", "rel")).toBe("Hace 3 d")
  })

  it("falls back to a calendar date past a week", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-12T12:00:00Z"))
    expect(fmtDate("2026-06-12T09:00:00Z", "rel")).toBe("12 jun")
  })

  it("adds the year only in long mode", () => {
    expect(fmtDate("2026-06-12T09:00:00Z", "long")).toContain("2026")
    expect(fmtDate("2026-06-12T09:00:00Z", "short")).not.toContain("2026")
  })
})
