import { describe, expect, it } from "vitest"

import type { GameState, PackEntry } from "../services/types"
import { sessionBusyReason } from "./sessionGuard"

// The invariant these cover is the D1 defect: switching Boffmedia account (or
// signing out) replaces the process-global bearer token, so an install in
// flight loses the credential its remaining requests authenticate with and the
// instance is left half-written. Every account action in `state/app.tsx` funnels
// through `refuseWhileBusy`, which is this predicate plus a notice — so what has
// to hold is that the predicate never answers "free" while either job runs.

const pack = (kind: PackEntry["state"]["kind"]): PackEntry =>
  ({
    pack: { id: "p", slug: "p", name: "P" },
    latest: null,
    // Only `kind` is read; the rest of each variant is irrelevant here and the
    // cast keeps the fixture from carrying fields the assertion does not use.
    state: { kind } as PackEntry["state"],
    lastPlayed: null,
    origin: "local",
  }) as unknown as PackEntry

const idle: GameState = { kind: "idle" }

describe("sessionBusyReason", () => {
  it("is free when nothing is installing and no game is up", () => {
    expect(sessionBusyReason(idle, [])).toBeNull()
    expect(
      sessionBusyReason(idle, [pack("installed"), pack("not-installed")]),
    ).toBeNull()
  })

  it("blocks while any pack installs, not merely the selected one", () => {
    expect(
      sessionBusyReason(idle, [pack("installed"), pack("installing")]),
    ).toBe("installing")
  })

  // `preparing` matters as much as `running`: it is the window in which the
  // launch is minting a session from the very token a switch would replace.
  it("blocks while the game is preparing or running", () => {
    expect(sessionBusyReason({ kind: "preparing" }, [])).toBe("playing")
    expect(
      sessionBusyReason({ kind: "running", pid: 1, since: 0 }, []),
    ).toBe("playing")
  })

  // A crash is over. Holding the switcher shut after one would trap a player
  // whose session died in exactly the state they need to sign out of.
  it("is free again once the game has crashed or stopped", () => {
    expect(
      sessionBusyReason({ kind: "crashed", exitCode: 1, diagnosis: null }, []),
    ).toBeNull()
  })

  // Both at once resolves to the install: it is the one that leaves damage on
  // disk, so it is the one the notice should name.
  it("names the install when an install and a game overlap", () => {
    expect(
      sessionBusyReason({ kind: "running", pid: 1, since: 0 }, [
        pack("installing"),
      ]),
    ).toBe("installing")
  })

  // Defensive: a pack row rebuilt from a stale cache has reached the provider
  // without a `state`, and a crash in the guard would take the whole shell down.
  it("survives a pack row with no install state", () => {
    const stale = { ...pack("installed"), state: undefined } as unknown as PackEntry
    expect(sessionBusyReason(idle, [stale])).toBeNull()
  })
})
