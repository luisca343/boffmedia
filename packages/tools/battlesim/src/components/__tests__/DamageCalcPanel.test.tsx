/**
 * The panel, end to end over a real `Battle`.
 *
 * The two unit suites under `calc/` prove the numbers. This proves the wiring
 * that would make correct numbers invisible: a catalog key that resolves to
 * itself, a damage row that never renders, an Escape that does not close, or —
 * the one that matters most — an edit in the panel reaching the live battle.
 */
import * as React from "react"
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest"
import { render, cleanup, screen, fireEvent } from "@testing-library/react"
import { configureUi } from "@boffmedia/ui"
import { Battle } from "@pkmn/client"
import { Generations } from "@pkmn/data"
import { Dex } from "@pkmn/sim"

import { messages } from "../../catalog/messages"
import { snapshotBattle } from "../../calc/fromBattle"
import type { BattleRequest } from "../../engine/types"
import { DamageCalcPanel } from "../DamageCalcPanel"

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
      // Returning the KEY on a miss is what makes the assertions below able to
      // tell "the catalog answered" from "the component rendered a key".
      if (raw == null) return key
      return values ? raw.replace(/\{(\w+)\}/g, (m, name) => (values[name] != null ? String(values[name]) : m)) : raw
    },
  })
})

afterEach(cleanup)

const OPENING = [
  "|player|p1|Alice|1|", "|player|p2|Bob|2|",
  "|teamsize|p1|2", "|teamsize|p2|2",
  "|gametype|doubles", "|gen|9", "|start",
  "|switch|p1a: Incineroar|Incineroar, L50, M|202/202",
  "|switch|p2a: Rillaboom|Rillaboom, L50, M|100/100",
  "|turn|1",
]

const REQUEST: BattleRequest = {
  requestType: "move",
  rqid: 1,
  side: {
    name: "Alice", id: "p1",
    pokemon: [{
      ident: "p1: Incineroar", details: "Incineroar, L50, M", condition: "202/202", active: true,
      stats: { atk: 183, def: 110, spa: 90, spd: 110, spe: 80 },
      moves: ["knockoff", "flareblitz", "fakeout", "partingshot"],
      baseAbility: "intimidate", ability: "intimidate", item: "assaultvest",
    }] as never,
  } as never,
}

function makeBattle(): Battle {
  const battle = new Battle(new Generations(Dex as any) as any)
  for (const line of OPENING) battle.add(line)
  return battle
}

function mount(battle = makeBattle(), onClose = () => {}) {
  const snapshot = snapshotBattle(battle, 0, { request: REQUEST })
  return { ...render(<DamageCalcPanel snapshot={snapshot} onClose={onClose} />), battle, snapshot }
}

describe("DamageCalcPanel", () => {
  it("opens pre-filled with the board and a damage figure, from the catalog", () => {
    mount()
    // Spanish text, not a key: the whole `calc.*` namespace is reachable.
    expect(screen.getByRole("dialog", { name: /Calculadora de daño/i })).toBeTruthy()
    expect(screen.getByText(/Nada de lo que toques aquí/)).toBeTruthy()
    // Knock Off came from the REQUEST's moveset, and it produced a percentage.
    expect(screen.getAllByText(/%$/).length).toBeGreaterThan(0)
  })

  it("says out loud that the opponent's spread is a guess", () => {
    mount()
    expect(screen.getByText(/Reparto desconocido/)).toBeTruthy()
  })

  it("closes on Escape as well as on the button", () => {
    const onClose = vi.fn()
    const { container } = mount(makeBattle(), onClose)
    fireEvent.keyDown(container.querySelector('[role="dialog"]')!, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole("button", { name: /Cerrar la calculadora/i }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it("keeps the battle's own hotkeys out of the panel", () => {
    // The dock listens for `1`-`9` on `window` and only skips `<input>`, so a
    // digit typed over a `<select>` here would have fired a move at the
    // opponent. The panel swallows every key it sees.
    const onWindow = vi.fn()
    window.addEventListener("keydown", onWindow)
    const { container } = mount()
    fireEvent.keyDown(container.querySelector('[role="dialog"]')!, { key: "1", bubbles: true })
    window.removeEventListener("keydown", onWindow)
    expect(onWindow).not.toHaveBeenCalled()
  })

  it("edits the calculation, never the battle", () => {
    const { battle } = mount()
    const before = {
      turn: battle.turn,
      hp: battle.p1.active[0]!.hp,
      boosts: { ...(battle.p1.active[0]!.boosts as Record<string, number>) },
      item: battle.p1.active[0]!.item,
    }

    // Open the attacker's settings and raise its Attack two stages.
    fireEvent.click(screen.getByRole("button", { name: /^Atacante$/ }))
    const plus = screen.getByRole("button", { name: /Atq \+1/ })
    fireEvent.click(plus)
    fireEvent.click(plus)

    expect(battle.turn).toBe(before.turn)
    expect(battle.p1.active[0]!.hp).toBe(before.hp)
    expect(battle.p1.active[0]!.item).toBe(before.item)
    expect(battle.p1.active[0]!.boosts).toEqual(before.boosts)
  })
})
