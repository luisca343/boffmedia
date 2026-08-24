import type * as React from "react"

/** Tone for KPI cards, split rates and deltas. */
export type DkTone = "pos" | "neg" | "accent" | "neutral"

/**
 * Inline CSS custom properties (e.g. `--dk-pad`) alongside standard style props.
 * @types/react in this repo rejects `--x` keys on object literals, so route them
 * through one localized cast.
 */
export function cssVars(vars: Record<string, string | number | undefined>): React.CSSProperties {
  return vars as unknown as React.CSSProperties
}
