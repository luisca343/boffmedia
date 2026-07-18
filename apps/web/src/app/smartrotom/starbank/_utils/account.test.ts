import { describe, expect, it } from "vitest"
import type { SBTransaction } from "../_types"
import {
  accountColor,
  accountImageUrl,
  balanceAfter,
  displayName,
  initials,
  isMain,
  isOutgoing,
  transferBlocker,
} from "./account"

const ME = 1
const THEM = 2

function tx(over: Partial<SBTransaction> = {}): SBTransaction {
  return {
    from: THEM,
    to: ME,
    amount: 100,
    reason: "Pago",
    date: "2026-07-12T12:00:00.000Z",
    fromBalance: 500,
    toBalance: 900,
    ...over,
  }
}

describe("transferBlocker", () => {
  const solvent = { fromId: ME, toId: THEM, balance: 1000 }

  it("lets a funded transfer through", () => {
    expect(transferBlocker({ amount: 250, ...solvent })).toBeNull()
  })

  it("allows spending the balance down to exactly zero", () => {
    expect(transferBlocker({ amount: 1000, ...solvent })).toBeNull()
  })

  it("blocks one ¥ over the balance", () => {
    expect(transferBlocker({ amount: 1001, ...solvent })).toBe("funds")
  })

  it("blocks zero and negative amounts", () => {
    expect(transferBlocker({ amount: 0, ...solvent })).toBe("amount")
    expect(transferBlocker({ amount: -500, ...solvent })).toBe("amount")
  })

  it("blocks NaN, which is what an unparseable amount collapses to", () => {
    expect(transferBlocker({ amount: NaN, ...solvent })).toBe("amount")
    expect(transferBlocker({ amount: Infinity, ...solvent })).toBe("amount")
  })

  it("blocks sending an account to itself", () => {
    expect(transferBlocker({ amount: 10, fromId: ME, toId: ME, balance: 1000 })).toBe("same-account")
  })

  it("blocks before the accounts have loaded rather than assuming zero balance", () => {
    expect(transferBlocker({ amount: 10, fromId: undefined, toId: THEM, balance: undefined })).toBe("no-source")
    expect(transferBlocker({ amount: 10, fromId: ME, toId: THEM, balance: undefined })).toBe("no-source")
  })

  it("does not block on a missing recipient — the recipient step guards that", () => {
    expect(transferBlocker({ amount: 10, fromId: ME, toId: undefined, balance: 1000 })).toBeNull()
  })

  it("rejects an overdraft from a zero balance", () => {
    expect(transferBlocker({ amount: 1, fromId: ME, toId: THEM, balance: 0 })).toBe("funds")
  })

  it("checks the amount before the funds, so a negative never reads as affordable", () => {
    expect(transferBlocker({ amount: -50, fromId: ME, toId: THEM, balance: 0 })).toBe("amount")
  })
})

describe("balanceAfter", () => {
  it("reads the payer's balance when the account sent the money", () => {
    expect(balanceAfter(tx({ from: ME, to: THEM }), ME)).toBe(500)
  })
  it("reads the payee's balance when the account received it", () => {
    expect(balanceAfter(tx({ from: THEM, to: ME }), ME)).toBe(900)
  })
})

describe("isOutgoing", () => {
  it("prefers the explicit account id over the API's isPayer flag", () => {
    // The API only populates `isPayer` on some listings; an explicit id must win.
    expect(isOutgoing(tx({ from: ME, isPayer: false }), ME)).toBe(true)
    expect(isOutgoing(tx({ from: THEM, isPayer: true }), ME)).toBe(false)
  })

  it("falls back to isPayer when no account id is given", () => {
    expect(isOutgoing(tx({ isPayer: true }))).toBe(true)
    expect(isOutgoing(tx({ isPayer: undefined }))).toBe(false)
  })
})

describe("initials", () => {
  it("takes one letter from each of the first two words", () => {
    expect(initials("Profesor Ficus")).toBe("PF")
    expect(initials("Profesor_Ficus")).toBe("PF")
    expect(initials("Profesor-Ficus")).toBe("PF")
  })
  it("takes the first two letters of a single word", () => {
    expect(initials("Ficus")).toBe("FI")
  })
  it("strips punctuation and digits are kept", () => {
    expect(initials("x_1")).toBe("X1")
  })
  it("returns a question mark rather than an empty badge", () => {
    expect(initials("")).toBe("?")
    expect(initials(undefined)).toBe("?")
    expect(initials("!!!")).toBe("?")
  })
})

describe("accountImageUrl", () => {
  it("sends MAIN accounts to the Minecraft head service", () => {
    expect(accountImageUrl("MAIN", "Ficus")).toBe("https://minotar.net/avatar/Ficus/80.png")
  })
  it("prefers an uploaded image for SECONDARY accounts", () => {
    expect(accountImageUrl("SECONDARY", "Ahorros", "/custom.png")).toBe("/custom.png")
  })
  it("preserves account-name casing — the prod filesystem is case-sensitive", () => {
    expect(accountImageUrl("SECONDARY", "MiHucha")).toContain("/MiHucha.png")
  })
})

describe("accountColor", () => {
  it("is stable for the same seed", () => {
    expect(accountColor("Ficus")).toBe(accountColor("Ficus"))
    expect(accountColor(7)).toBe(accountColor("7"))
  })
  it("always returns a colour from the palette", () => {
    for (const seed of ["", "a", "Ficus", 0, 999999]) {
      expect(accountColor(seed)).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe("isMain / displayName", () => {
  it("only MAIN is main", () => {
    expect(isMain({ type: "MAIN" })).toBe(true)
    expect(isMain({ type: "SECONDARY" })).toBe(false)
    expect(isMain(undefined)).toBe(false)
  })
  it("renders Minecraft underscores as spaces", () => {
    expect(displayName("Profesor_Ficus")).toBe("Profesor Ficus")
    expect(displayName(undefined)).toBe("")
  })
})
