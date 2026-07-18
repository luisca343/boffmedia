import { describe, expect, it } from "vitest"
import type { WordlePokemon } from "../_hooks/useGetWordlePokemon"
import { ATTRIBUTES, MAX_GUESSES, checkType, isWinner, numberFeedback, typeFeedback } from "./compare"

const target: WordlePokemon = {
  name: "venusaur",
  gen: 1,
  type1: "grass",
  type2: "poison",
  height: 2.0,
  weight: 100,
}

const monoType: WordlePokemon = { name: "pikachu", gen: 1, type1: "electric", type2: "", height: 0.4, weight: 6 }

describe("checkType", () => {
  it("is correct when the type sits in the same slot as the target's", () => {
    expect(checkType("grass", 1, target)).toBe("correct")
    expect(checkType("poison", 2, target)).toBe("correct")
  })

  it("is present when the target has the type in the other slot", () => {
    expect(checkType("poison", 1, target)).toBe("present")
    expect(checkType("grass", 2, target)).toBe("present")
  })

  it("is incorrect for a type the target does not have at all", () => {
    expect(checkType("fire", 1, target)).toBe("incorrect")
    expect(checkType("fire", 2, target)).toBe("incorrect")
  })

  it("is incorrect for every slot before a target has been drawn", () => {
    expect(checkType("grass", 1, null)).toBe("incorrect")
    expect(checkType("grass", 2, null)).toBe("incorrect")
  })

  it("treats an empty second slot as a real answer, matching mono-type on mono-type", () => {
    expect(checkType(undefined, 2, monoType)).toBe("incorrect")
    expect(checkType("", 2, monoType)).toBe("correct")
  })

  it("marks a missing primary type incorrect rather than matching an empty target slot", () => {
    expect(checkType(undefined, 1, target)).toBe("incorrect")
    expect(checkType(undefined, 1, monoType)).toBe("incorrect")
  })
})

describe("typeFeedback", () => {
  it("maps the board status onto the tile state", () => {
    expect(typeFeedback("grass", 1, target)).toEqual({ state: "hit" })
    expect(typeFeedback("poison", 1, target)).toEqual({ state: "near" })
    expect(typeFeedback("fire", 1, target)).toEqual({ state: "miss" })
  })

  it("never returns a direction — types are unordered", () => {
    expect(typeFeedback("poison", 1, target).dir).toBeUndefined()
  })
})

describe("numberFeedback", () => {
  it("hits on an exact value", () => {
    expect(numberFeedback(100, 100)).toEqual({ state: "hit" })
  })

  // A proximity band would leak information the game never had; only the
  // direction is revealed.
  it("is never 'near' — only hit or miss with a direction", () => {
    expect(numberFeedback(99, 100)).toEqual({ state: "miss", dir: "up" })
    expect(numberFeedback(101, 100)).toEqual({ state: "miss", dir: "down" })
  })

  it("points up when the target is larger and down when it is smaller", () => {
    expect(numberFeedback(1, 9).dir).toBe("up")
    expect(numberFeedback(9, 1).dir).toBe("down")
  })

  it("handles fractional heights, not just integer weights", () => {
    expect(numberFeedback(0.4, 2.0)).toEqual({ state: "miss", dir: "up" })
    expect(numberFeedback(2.0, 2.0)).toEqual({ state: "hit" })
  })

  it("compares against zero without treating it as 'no target'", () => {
    expect(numberFeedback(0, 0)).toEqual({ state: "hit" })
    expect(numberFeedback(5, 0)).toEqual({ state: "miss", dir: "down" })
  })
})

describe("isWinner", () => {
  it("wins only on the exact hidden creature", () => {
    expect(isWinner(target, target)).toBe(true)
    expect(isWinner(monoType, target)).toBe(false)
  })

  it("cannot win before a target has been drawn", () => {
    expect(isWinner(target, null)).toBe(false)
  })

  it("matches on name, so a same-stats different-species guess does not win", () => {
    const twin: WordlePokemon = { ...target, name: "ivysaur" }
    expect(isWinner(twin, target)).toBe(false)
  })
})

describe("game constants", () => {
  it("allows seven guesses", () => {
    expect(MAX_GUESSES).toBe(7)
  })

  it("compares exactly the attributes the endpoint returns", () => {
    expect([...ATTRIBUTES]).toEqual(["gen", "type1", "type2", "height", "weight"])
  })
})
