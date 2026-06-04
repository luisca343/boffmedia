import { BOFF_VARIANTS } from "@/components/boffmedia-old/tools/utils/boffVariants"

// ─── Rarity token map ────────────────────────────────────────────────────────
// Semantically aligned with BOFF_VARIANTS where possible:
//   diamond  → secondary (cyan)   — prestige / unique
//   platinum → accent   (purple)  — elite
//   gold     → yellow             — valuable
//   silver   → custom muted slate — common tier-up
//   bronze   → primary (orange)   — entry-level
//   default  → surface muted      — unset / generic

export type Rarity = "diamond" | "platinum" | "gold" | "silver" | "bronze" | string

export interface RarityTokens {
  /** CSS background for the icon tile */
  bg: string
  /** CSS border color */
  border: string
  /** CSS text / icon color */
  color: string
  /** Tailwind classes for a gradient fill (icon tile unlocked state) */
  gradient: string
  /** Human-readable label */
  label: string
}

export const RARITY_TOKENS: Record<string, RarityTokens> = {
  diamond: {
    bg: BOFF_VARIANTS.secondary.tint,
    border: BOFF_VARIANTS.secondary.border,
    color: BOFF_VARIANTS.secondary.text,
    gradient: "from-cyan-400 to-cyan-600",
    label: "Diamante",
  },
  platinum: {
    bg: BOFF_VARIANTS.accent.tint,
    border: BOFF_VARIANTS.accent.border,
    color: BOFF_VARIANTS.accent.text,
    gradient: "from-purple-400 to-purple-600",
    label: "Platino",
  },
  gold: {
    bg: BOFF_VARIANTS.yellow.tint,
    border: BOFF_VARIANTS.yellow.border,
    color: BOFF_VARIANTS.yellow.text,
    gradient: "from-yellow-400 to-yellow-600",
    label: "Oro",
  },
  silver: {
    bg: "rgba(71,85,105,0.12)",
    border: "rgba(148,163,184,0.3)",
    color: "rgb(203,213,225)",
    gradient: "from-slate-300 to-slate-500",
    label: "Plata",
  },
  bronze: {
    bg: BOFF_VARIANTS.primary.tint,
    border: BOFF_VARIANTS.primary.border,
    color: BOFF_VARIANTS.primary.text,
    gradient: "from-orange-400 to-orange-700",
    label: "Bronce",
  },
}

const RARITY_FALLBACK: RarityTokens = {
  bg: "rgba(71,85,105,0.07)",
  border: "rgba(71,85,105,0.3)",
  color: "rgba(148,163,184,0.7)",
  gradient: "from-slate-500 to-slate-700",
  label: "Normal",
}

export function getRarityTokens(rarity?: string | null): RarityTokens {
  return RARITY_TOKENS[rarity?.toLowerCase() ?? ""] ?? RARITY_FALLBACK
}
