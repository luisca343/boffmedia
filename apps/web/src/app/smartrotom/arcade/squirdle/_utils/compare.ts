import type { WordlePokemon } from "../_hooks/useGetWordlePokemon"

/** How a guessed attribute compares to the hidden creature's. */
export type FeedState = "hit" | "near" | "miss"

export interface Feedback {
  state: FeedState
  /** Only on the ordered attributes — where the target's value lies. */
  dir?: "up" | "down"
}

export type TypeSlot = 1 | 2

/** The status a type carries across the whole board, not just one guess. */
export type TypeStatus = "possible" | "incorrect" | "correct" | "present"

export const MAX_GUESSES = 7

/** The attributes the wordle endpoint actually returns. Nothing else is comparable. */
export const ATTRIBUTES = ["gen", "type1", "type2", "height", "weight"] as const

/**
 * A type is a hit in its own slot and "near" in the other one — the game's only
 * two-sided attribute. Numbers are never "near": the endpoint gives an exact
 * height and weight, and a proximity band would leak a hint the game never had.
 */
export function checkType(
  type: string | undefined,
  slot: TypeSlot,
  target: WordlePokemon | null,
): TypeStatus {
  if ((!type && slot === 1) || !target) return "incorrect"
  const currentSlot = `type${slot}` as "type1" | "type2"
  const oppositeSlot = `type${slot === 1 ? 2 : 1}` as "type1" | "type2"

  if (type === target[currentSlot]) return "correct"
  if (type === target[oppositeSlot]) return "present"
  return "incorrect"
}

const TYPE_FEEDBACK: Record<TypeStatus, FeedState> = {
  correct: "hit",
  present: "near",
  incorrect: "miss",
  possible: "miss",
}

export function typeFeedback(
  type: string | undefined,
  slot: TypeSlot,
  target: WordlePokemon | null,
): Feedback {
  return { state: TYPE_FEEDBACK[checkType(type, slot, target)] }
}

export function numberFeedback(value: number, targetValue: number): Feedback {
  if (value === targetValue) return { state: "hit" }
  return { state: "miss", dir: targetValue > value ? "up" : "down" }
}

/** Whether the guess is the hidden creature — the win condition. */
export function isWinner(guess: WordlePokemon, target: WordlePokemon | null) {
  return Boolean(target) && guess.name === target?.name
}
