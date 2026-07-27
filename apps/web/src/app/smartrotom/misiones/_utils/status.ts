import type { QuestData, SealStatus } from "../_types"

/**
 * The API can also return `NOT_STARTED`, which the board has no seal for: a
 * quest nobody has touched is *Disponible* if the game says its requirements
 * are met, and *Sellada* if they aren't.
 */
export function normalizeStatus(quest: Pick<QuestData, "status" | "requirements">): SealStatus {
  const status = quest.status as string
  if (status === "ACTIVE" || status === "AVAILABLE" || status === "COMPLETED" || status === "FAILED" || status === "LOCKED") {
    return status
  }
  return quest.requirements?.available ? "AVAILABLE" : "LOCKED"
}

/**
 * The seal's label, as a key into the `misiones` namespace — never the copy
 * itself, so a module-scope map cannot pin the board to one language.
 */
export const STATUS_LABEL_KEY: Record<SealStatus, string> = {
  ACTIVE: "status.active",
  AVAILABLE: "status.available",
  COMPLETED: "status.completed",
  FAILED: "status.failed",
  LOCKED: "status.locked",
}

/** The letter struck into the wax. */
export const STATUS_GLYPH: Record<SealStatus, string> = {
  ACTIVE: "V",
  AVAILABLE: "D",
  COMPLETED: "C",
  FAILED: "F",
  LOCKED: "L",
}

/**
 * Wax colour as a CSS value — these go into SVG `fill`, which Tailwind cannot
 * reach, so they are read from the token vars and applied as attributes. Legal
 * per SMARTROTOM_V3.md §4 (data-driven value), unlike a `bg-ms-seal-${s}` class.
 */
export const SEAL_FILL: Record<SealStatus, string> = {
  ACTIVE: "rgb(var(--ms-seal-active))",
  AVAILABLE: "rgb(var(--ms-seal-available))",
  COMPLETED: "rgb(var(--ms-seal-completed))",
  FAILED: "rgb(var(--ms-seal-failed))",
  LOCKED: "rgb(var(--ms-seal-locked))",
}

/** Literal classes, so the JIT can see every one of them. */
export const SEAL_TEXT: Record<SealStatus, string> = {
  ACTIVE: "text-ms-seal-active",
  AVAILABLE: "text-ms-seal-available",
  COMPLETED: "text-ms-seal-completed",
  FAILED: "text-ms-seal-failed",
  LOCKED: "text-ms-seal-locked",
}

/** Papers weather with their status: sealed ones grey out, failed ones fade. */
export const STATUS_PAPER_FILTER: Record<SealStatus, string> = {
  ACTIVE: "",
  AVAILABLE: "",
  COMPLETED: "brightness-95",
  FAILED: "grayscale-[.3] brightness-[.85]",
  LOCKED: "grayscale-[.5] brightness-[.78]",
}

/** Board order: what you can do now, then what you could do, then history. */
export const STATUS_ORDER: Record<SealStatus, number> = {
  ACTIVE: 1,
  AVAILABLE: 2,
  COMPLETED: 3,
  FAILED: 4,
  LOCKED: 5,
}

export const SEAL_STATUSES: SealStatus[] = ["ACTIVE", "AVAILABLE", "COMPLETED", "FAILED", "LOCKED"]
