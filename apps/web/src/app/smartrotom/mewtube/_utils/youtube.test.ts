import { describe, expect, it } from "vitest"
import { formatCount, formatDuration } from "./youtube"
import { parseChapters } from "./chapters"

describe("formatCount", () => {
  it("formats millions with a comma decimal", () => {
    expect(formatCount(1_200_000)).toBe("1,2 M")
  })
  it("formats thousands as rounded K", () => {
    expect(formatCount(248_000)).toBe("248 K")
    expect(formatCount("542000")).toBe("542 K")
  })
  it("passes small numbers through es-ES", () => {
    expect(formatCount(812)).toBe("812")
  })
  it("returns empty for junk", () => {
    expect(formatCount(undefined)).toBe("")
    expect(formatCount("abc")).toBe("")
  })
})

describe("formatDuration (ISO8601)", () => {
  it("formats hours", () => {
    expect(formatDuration("PT1H2M30S")).toBe("1:02:30")
  })
  it("formats minutes:seconds", () => {
    expect(formatDuration("PT27M14S")).toBe("27:14")
    expect(formatDuration("PT8M21S")).toBe("8:21")
  })
  it("pads seconds", () => {
    expect(formatDuration("PT5M3S")).toBe("5:03")
  })
  it("returns undefined for missing", () => {
    expect(formatDuration(undefined)).toBeUndefined()
  })
})

describe("parseChapters", () => {
  it("extracts timestamped lines", () => {
    const out = parseChapters("Intro\n0:00 Inicio\n2:14 Segunda parte\n1:02:03 Final")
    expect(out).toHaveLength(3)
    expect(out[0]).toMatchObject({ seconds: 0, label: "Inicio" })
    expect(out[1].seconds).toBe(134)
    expect(out[2].seconds).toBe(3723)
  })
  it("hides (returns []) with fewer than two markers", () => {
    expect(parseChapters("0:00 Solo una")).toEqual([])
    expect(parseChapters("sin marcas de tiempo")).toEqual([])
    expect(parseChapters(undefined)).toEqual([])
  })
})
