import { describe, expect, it } from "vitest"
import type { ExtendedPokemonW, Mon, SlotLoc } from "../_types/pc.types"
import { POKEMON_PER_BOX } from "./constants"
import { planBulkMove, planOrganize, type QueuedMove } from "./movePlan"

/**
 * The game server exposes exactly one write, `POST /pc/move`, and it is a SWAP: the
 * two slots exchange occupants. There is no insert, no release and no undo. Every
 * plan below is checked by replaying it as swaps and comparing the resulting box.
 */
function applySwaps(box: (Mon | null)[], moves: QueuedMove[]): (Mon | null)[] {
  const slots = [...box]
  for (const { from, to } of moves) {
    const a = from.index
    const b = to.index
    const tmp = slots[a] ?? null
    slots[a] = slots[b] ?? null
    slots[b] = tmp
  }
  return slots
}

let seq = 0
function mon(name: string, loc: SlotLoc): Mon {
  seq += 1
  return {
    key: `${name}-${seq}`,
    loc,
    pokemon: {
      dex: 1,
      species: name,
      name,
      nature: "Jolly",
      ability: "Static",
      item: "item.minecraft.air",
      level: 5,
      moves: [],
      ivs: [0, 0, 0, 0, 0, 0],
      evs: [0, 0, 0, 0, 0, 0],
      stats: [0, 0, 0, 0, 0, 0],
    } as ExtendedPokemonW,
  }
}

const inBox = (box: number, index: number): SlotLoc => ({ kind: "box", box, index })

/** A box of `n` occupied slots followed by empties, padded to a full box. */
function boxOf(mons: (Mon | null)[]): (Mon | null)[] {
  const out = [...mons]
  while (out.length < POKEMON_PER_BOX) out.push(null)
  return out
}

describe("planOrganize", () => {
  it("emits nothing when the box is already in the desired order", () => {
    const a = mon("A", inBox(0, 0))
    const b = mon("B", inBox(0, 1))
    const box = boxOf([a, b])
    expect(planOrganize(0, box, box)).toEqual([])
  })

  it("reverses two adjacent Pokémon with a single swap", () => {
    const a = mon("A", inBox(0, 0))
    const b = mon("B", inBox(0, 1))
    const current = boxOf([a, b])
    const desired = boxOf([b, a])

    const moves = planOrganize(0, current, desired)
    expect(moves).toHaveLength(1)
    expect(moves[0]).toEqual({ from: inBox(0, 1), to: inBox(0, 0) })
    expect(applySwaps(current, moves)).toEqual(desired)
  })

  it("plans against the box as the swaps will leave it, not the original", () => {
    // A rotation is the case a naive "move each to its place" planner gets wrong:
    // the second move must account for the first swap having displaced something.
    const a = mon("A", inBox(0, 0))
    const b = mon("B", inBox(0, 1))
    const c = mon("C", inBox(0, 2))
    const current = boxOf([a, b, c])
    const desired = boxOf([c, a, b])

    const moves = planOrganize(0, current, desired)
    expect(applySwaps(current, moves)).toEqual(desired)
  })

  it("sorts a full box in at most n−1 swaps, not n²", () => {
    const mons = Array.from({ length: POKEMON_PER_BOX }, (_, i) => mon(`P${i}`, inBox(0, i)))
    const current = boxOf(mons)
    const desired = boxOf([...mons].reverse())

    const moves = planOrganize(0, current, desired)
    expect(applySwaps(current, moves)).toEqual(desired)
    expect(moves.length).toBeLessThanOrEqual(POKEMON_PER_BOX - 1)
  })

  it("never moves a Pokémon out of the box it is organising", () => {
    const mons = Array.from({ length: 6 }, (_, i) => mon(`P${i}`, inBox(3, i)))
    const current = boxOf(mons)
    const desired = boxOf([...mons].reverse())

    for (const m of planOrganize(3, current, desired)) {
      expect(m.from).toMatchObject({ kind: "box", box: 3 })
      expect(m.to).toMatchObject({ kind: "box", box: 3 })
    }
  })

  it("skips a desired occupant that is not in this box rather than inventing a move", () => {
    const a = mon("A", inBox(0, 0))
    const stranger = mon("Z", inBox(7, 0))
    const current = boxOf([a])
    const desired = boxOf([stranger, a])

    // Slot 0 wants a Pokémon from another box; only what is reachable gets planned.
    expect(planOrganize(0, current, desired)).toEqual([])
  })

  it("leaves a slot alone when the desired layout has it empty", () => {
    const a = mon("A", inBox(0, 0))
    const current = boxOf([a])
    const desired = boxOf([])
    expect(planOrganize(0, current, desired)).toEqual([])
  })

  it("does not mutate the box it was given", () => {
    const a = mon("A", inBox(0, 0))
    const b = mon("B", inBox(0, 1))
    const current = boxOf([a, b])
    const snapshot = [...current]
    planOrganize(0, current, boxOf([b, a]))
    expect(current).toEqual(snapshot)
  })
})

describe("planBulkMove", () => {
  it("fills the target box's free slots in order", () => {
    const x = mon("X", inBox(1, 0))
    const y = mon("Y", inBox(1, 1))
    const occupied = mon("O", inBox(0, 0))
    const target = boxOf([occupied])

    const { moves, placed, overflow } = planBulkMove([x, y], 0, target)
    expect(placed).toBe(2)
    expect(overflow).toBe(0)
    expect(moves).toEqual([
      { from: inBox(1, 0), to: inBox(0, 1) },
      { from: inBox(1, 1), to: inBox(0, 2) },
    ])
  })

  // A swap into an occupied slot would evict its occupant, so only empty slots
  // are ever targeted — that is what makes this behave like a move.
  it("never targets an occupied slot", () => {
    const occupants = Array.from({ length: 4 }, (_, i) => mon(`O${i}`, inBox(0, i)))
    const target = boxOf(occupants)
    const incoming = mon("X", inBox(1, 0))

    const { moves } = planBulkMove([incoming], 0, target)
    for (const m of moves) expect(target[m.to.index]).toBeNull()
  })

  it("leaves Pokémon already in the target box untouched", () => {
    const resident = mon("R", inBox(0, 0))
    const outsider = mon("X", inBox(1, 0))
    const target = boxOf([resident])

    const { moves, placed } = planBulkMove([resident, outsider], 0, target)
    expect(placed).toBe(1)
    expect(moves[0].from).toEqual(inBox(1, 0))
  })

  it("stops at the box's capacity and reports the overflow instead of losing mons", () => {
    const occupants = Array.from({ length: POKEMON_PER_BOX - 2 }, (_, i) => mon(`O${i}`, inBox(0, i)))
    const target = boxOf(occupants)
    const incoming = Array.from({ length: 5 }, (_, i) => mon(`X${i}`, inBox(1, i)))

    const { moves, placed, overflow } = planBulkMove(incoming, 0, target)
    expect(placed).toBe(2)
    expect(overflow).toBe(3)
    expect(moves).toHaveLength(2)
  })

  it("reports pure overflow when the target box is full", () => {
    const occupants = Array.from({ length: POKEMON_PER_BOX }, (_, i) => mon(`O${i}`, inBox(0, i)))
    const incoming = [mon("X", inBox(1, 0))]

    const { moves, placed, overflow } = planBulkMove(incoming, 0, boxOf(occupants))
    expect(moves).toEqual([])
    expect(placed).toBe(0)
    expect(overflow).toBe(1)
  })

  it("moves Pokémon out of the party, which the server addresses as box −1", () => {
    const partyMon = mon("P", { kind: "party", index: 2 })
    const { moves } = planBulkMove([partyMon], 0, boxOf([]))
    expect(moves[0].from).toEqual({ kind: "party", index: 2 })
    expect(moves[0].to).toEqual(inBox(0, 0))
  })

  it("treats a short box array as trailing empty slots", () => {
    const incoming = [mon("X", inBox(1, 0))]
    const { placed } = planBulkMove(incoming, 0, [])
    expect(placed).toBe(1)
  })

  it("issues one move per Pokémon — there is no batch endpoint", () => {
    const incoming = Array.from({ length: 4 }, (_, i) => mon(`X${i}`, inBox(1, i)))
    const { moves } = planBulkMove(incoming, 0, boxOf([]))
    expect(moves).toHaveLength(4)
  })
})
