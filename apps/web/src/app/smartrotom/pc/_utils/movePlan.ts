import type { Mon, SlotLoc } from "../_types/pc.types"
import { POKEMON_PER_BOX } from "./constants"

export interface QueuedMove {
  from: SlotLoc
  to: SlotLoc
}

/**
 * The swap sequence that sorts a box into `desired` order.
 *
 * Selection sort, because the only primitive the server gives us is a swap: walk the
 * slots, and whenever the wrong Pokémon is sitting in slot `i`, swap in the one that
 * belongs there from wherever it currently is. That is at most n−1 moves for n
 * Pokémon — a full 30-slot box costs 29 round-trips, not 900.
 */
export function planOrganize(box: number, current: (Mon | null)[], desired: (Mon | null)[]): QueuedMove[] {
  const slots = current.slice(0, POKEMON_PER_BOX)
  const moves: QueuedMove[] = []

  for (let i = 0; i < POKEMON_PER_BOX; i++) {
    const want = desired[i] ?? null
    const have = slots[i] ?? null
    if (want === have) continue
    if (!want) continue // nothing should be here; the packing loop empties it anyway

    const j = slots.findIndex((m, idx) => idx > i && m === want)
    if (j < 0) continue // already placed, or not in this box

    moves.push({ from: { kind: "box", box, index: j }, to: { kind: "box", box, index: i } })
    // Mirror the swap the server is about to perform, so the next iteration plans
    // against the box as it will actually be.
    const tmp = slots[i]
    slots[i] = slots[j]
    slots[j] = tmp ?? null
  }

  return moves
}

/**
 * The move sequence that relocates `mons` into `box`, filling its free slots in order.
 * Pokémon already in the target box are left alone; if the box runs out of room the
 * plan stops early and the caller reports how many actually fit.
 */
export function planBulkMove(
  mons: Mon[],
  box: number,
  boxContents: (Mon | null)[],
): { moves: QueuedMove[]; placed: number; overflow: number } {
  const free: number[] = []
  for (let i = 0; i < POKEMON_PER_BOX; i++) if (!boxContents[i]) free.push(i)

  const moving = mons.filter((m) => !(m.loc.kind === "box" && m.loc.box === box))
  const moves: QueuedMove[] = []

  let f = 0
  for (const m of moving) {
    if (f >= free.length) break
    moves.push({ from: m.loc, to: { kind: "box", box, index: free[f] } })
    f++
  }

  return { moves, placed: moves.length, overflow: moving.length - moves.length }
}
