/**
 * The HP bar reads the ledger; it does not remember anything itself.
 *
 * Every case here is one the OLD bar got wrong, and got wrong invisibly: it
 * inferred "what this turn took" from its own previous percentage, so a
 * two-hit move looked like one big hit, a heal after a hit cancelled the whole
 * record, and a switch made the incoming Pokémon appear to have just lost the
 * outgoing one's health. None of that is observable from a type-check, and all
 * of it is observable from the DOM.
 */
import * as React from "react"
import { describe, it, expect, beforeAll, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"
import { configureUi } from "@boffmedia/ui"

import { messages } from "../../catalog/messages"
import { hpSegments } from "../../lib/bx-helpers"
import { hpPercent } from "../../engine/toBSXMon"
import type { LedgerEntry, LedgerEvent } from "../../engine/TurnLedger"
import { BxHp, BxHpDeltas, BxStatus } from "../bx-kit"

/* ── Host wiring ─────────────────────────────────────────────────────────── */
/**
 * The real catalog, in the source locale. A stub translator that echoed keys
 * would let a wrong key pass the status assertion — the point of that test is
 * that `tox` reaches the three letters a player actually reads.
 */
function lookup(key: string): string | undefined {
  let node: any = (messages as any).es
  for (const part of key.split(".")) {
    if (node == null || typeof node !== "object") return undefined
    node = node[part]
  }
  return typeof node === "string" ? node : undefined
}

beforeAll(() => {
  configureUi({
    useTranslateRoot: () => (key: string, values?: Record<string, string | number | Date>) => {
      const raw = lookup(key)
      if (raw == null) return key
      return values
        ? raw.replace(/\{(\w+)\}/g, (m, name) => (values[name] != null ? String(values[name]) : m))
        : raw
    },
  })
})

afterEach(cleanup)

/* ── Fixtures ────────────────────────────────────────────────────────────── */
const dmg = (from: number, to: number, maxhp: number): LedgerEvent =>
  ({ kind: "damage", from, to, maxhp, turn: 1 })
const heal = (from: number, to: number, maxhp: number): LedgerEvent =>
  ({ kind: "heal", from, to, maxhp, turn: 1 })

function entry(o: { startHp: number; hp: number; maxhp: number; events?: LedgerEvent[] }): LedgerEntry {
  return {
    key: "p1|p1: Test",
    turn: 1,
    startHp: o.startHp,
    startMaxhp: o.maxhp,
    hp: o.hp,
    maxhp: o.maxhp,
    events: o.events ?? [],
  }
}

const widthOf = (el: Element | null) => (el ? parseFloat((el as HTMLElement).style.width) : null)
const lostBand = (root: HTMLElement) => root.querySelector("[data-bx-hp-lost]")
const gainedBand = (root: HTMLElement) => root.querySelector("[data-bx-hp-gained]")

/* ── The maths, with no DOM in the way ───────────────────────────────────── */
describe("hpSegments", () => {
  it("nets a damage-then-heal turn to a single band", () => {
    const seg = hpSegments(70, entry({ startHp: 100, hp: 70, maxhp: 100, events: [dmg(100, 40, 100), heal(40, 70, 100)] }))
    expect(seg.lostPct).toBe(30)
    expect(seg.gainedPct).toBe(0)
    // …while still reporting BOTH events, which is what the labels print.
    expect(seg.deltas.map((d) => `${d.kind}:${d.pct}`)).toEqual(["damage:60", "heal:30"])
    expect(seg.hits).toBe(1)
  })

  it("nets a turn that ended UP into the gained band", () => {
    const seg = hpSegments(90, entry({ startHp: 50, hp: 90, maxhp: 100, events: [heal(50, 90, 100)] }))
    expect(seg.gainedPct).toBe(40)
    expect(seg.lostPct).toBe(0)
    expect(seg.startPct).toBe(50)
  })

  it("draws nothing without a ledger — it never guesses", () => {
    const seg = hpSegments(42, null)
    expect(seg).toMatchObject({ pct: 42, startPct: 42, lostPct: 0, gainedPct: 0, hits: 0, deltas: [] })
  })
})

/* ── The bar ─────────────────────────────────────────────────────────────── */
describe("BxHp", () => {
  it("draws one cumulative lost band and two labels for a two-hit turn", () => {
    const e = entry({ startHp: 155, hp: 19, maxhp: 155, events: [dmg(155, 60, 155), dmg(60, 19, 155)] })
    const { container } = render(
      <div>
        <BxHp pct={hpPercent(19, 155)} ledger={e} monKey="p1: Chomp|Garchomp, L50, M" />
        <BxHpDeltas ledger={e} />
      </div>,
    )

    // 19/155 is 13% (ceiled), so the band spans the other ~87 — ONE band, not
    // two stacked ones, and not the 26% of the last hit alone.
    const lost = widthOf(lostBand(container))!
    expect(lost).toBeGreaterThan(85)
    expect(lost).toBeLessThan(90)
    expect(gainedBand(container)).toBeNull()

    // One label per event, in event order, each a share of MAX HP.
    expect(container.textContent).toContain("−62%")
    expect(container.textContent).toContain("−27%")
    // …and the multi-hit chip, which is the only thing that distinguishes this
    // from a single 88% hit.
    expect(container.textContent).toContain("×2")
  })

  it("shows no ×N chip for a single hit", () => {
    const e = entry({ startHp: 100, hp: 40, maxhp: 100, events: [dmg(100, 40, 100)] })
    const { container } = render(<BxHpDeltas ledger={e} />)
    expect(container.textContent).toContain("−60%")
    expect(container.textContent).not.toContain("×")
  })

  it("nets damage-then-heal to a lost band and labels both events", () => {
    const e = entry({ startHp: 100, hp: 70, maxhp: 100, events: [dmg(100, 40, 100), heal(40, 70, 100)] })
    const { container } = render(
      <div>
        <BxHp pct={70} ledger={e} monKey="a" />
        <BxHpDeltas ledger={e} />
      </div>,
    )
    expect(widthOf(lostBand(container))).toBeCloseTo(30, 5)
    expect(gainedBand(container)).toBeNull()
    expect(container.textContent).toContain("−60%")
    expect(container.textContent).toContain("+30%")
  })

  it("draws the gained band when the turn ended up", () => {
    const e = entry({ startHp: 50, hp: 90, maxhp: 100, events: [heal(50, 90, 100)] })
    const { container } = render(<BxHp pct={90} ledger={e} monKey="a" />)
    expect(lostBand(container)).toBeNull()
    expect(widthOf(gainedBand(container))).toBeCloseTo(40, 5)
    expect((gainedBand(container) as HTMLElement).style.left).toBe("50%")
  })

  it("takes the fainted treatment at 0", () => {
    const e = entry({ startHp: 100, hp: 0, maxhp: 100, events: [dmg(100, 0, 100)] })
    const { container } = render(<BxHp pct={0} ledger={e} monKey="a" ko />)
    const track = container.querySelector("[data-bx-hp]") as HTMLElement
    expect(track.className).toContain("saturate-[0.25]")
    expect(track.className).not.toContain("bg-line-2")
    // The whole bar is the loss, so the band still reads back the full turn.
    expect(widthOf(lostBand(container))).toBeCloseTo(100, 5)
  })

  it("resets on an identity change instead of animating the previous mon's HP", () => {
    const hurt = entry({ startHp: 155, hp: 19, maxhp: 155, events: [dmg(155, 19, 155)] })
    const { container, rerender } = render(<BxHp pct={13} ledger={hurt} monKey="p1: Chomp|Garchomp, L50, M" />)
    const before = container.querySelector("[data-bx-hp]")
    expect(lostBand(container)).not.toBeNull()

    // A different Pokémon walks into the same slot, untouched this turn.
    const fresh = entry({ startHp: 120, hp: 120, maxhp: 120, events: [] })
    rerender(<BxHp pct={100} ledger={fresh} monKey="p1: Toed|Politoed, L50, F" />)

    expect(lostBand(container)).toBeNull()
    expect(gainedBand(container)).toBeNull()
    // A NEW node: the old one would have carried its width transition across
    // two different Pokémon, which is the false catch-up this replaces.
    expect(container.querySelector("[data-bx-hp]")).not.toBe(before)
  })
})

/* ── Status pill ─────────────────────────────────────────────────────────── */
describe("BxStatus", () => {
  it("prints the three-letter code from the catalog", () => {
    const { container } = render(<BxStatus status="tox" />)
    expect(container.textContent).toBe("TOX")
  })

  it("carries the long name for assistive technology", () => {
    const { container } = render(<BxStatus status="brn" />)
    const pill = container.querySelector("[aria-label]") as HTMLElement
    expect(pill.getAttribute("aria-label")).toBe("Quemado")
  })

  it("renders nothing when there is no status", () => {
    const { container } = render(<BxStatus status={null} />)
    expect(container.innerHTML).toBe("")
  })
})
