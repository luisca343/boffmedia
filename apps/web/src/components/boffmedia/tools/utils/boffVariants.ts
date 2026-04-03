export type BoffVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "yellow"
  | "highlight"
  | "red";

export interface BoffVariantTokens {
  /** Tailwind gradient classes for the top neon bar */
  bar: string;
  /** CSS rgba — outer border */
  border: string;
  /** CSS rgba — box-shadow glow (low opacity) */
  glow: string;
  /** CSS rgba — ambient radial tint */
  tint: string;
  /** CSS rgba — corner bracket borders */
  bracket: string;
  /** CSS rgba — bottom accent line (slightly stronger than border) */
  bottomAccent: string;
}

export const BOFF_VARIANTS: Record<BoffVariant, BoffVariantTokens> = {
  primary: {
    bar: "from-primary-400 via-orange-400 to-primary-600",
    border: "rgba(249,115,22,0.35)",
    glow: "rgba(249,115,22,0.08)",
    tint: "rgba(249,115,22,0.07)",
    bracket: "rgba(249,115,22,0.25)",
    bottomAccent: "rgba(249,115,22,0.4)",
  },
  secondary: {
    bar: "from-secondary-400 via-cyan-400 to-secondary-600",
    border: "rgba(6,182,212,0.35)",
    glow: "rgba(6,182,212,0.08)",
    tint: "rgba(6,182,212,0.07)",
    bracket: "rgba(6,182,212,0.25)",
    bottomAccent: "rgba(6,182,212,0.4)",
  },
  accent: {
    bar: "from-accent-400 via-purple-400 to-accent-600",
    border: "rgba(168,85,247,0.35)",
    glow: "rgba(168,85,247,0.08)",
    tint: "rgba(168,85,247,0.07)",
    bracket: "rgba(168,85,247,0.25)",
    bottomAccent: "rgba(168,85,247,0.4)",
  },
  yellow: {
    bar: "from-yellow-400 via-yellow-300 to-yellow-600",
    border: "rgba(250,204,21,0.35)",
    glow: "rgba(250,204,21,0.08)",
    tint: "rgba(250,204,21,0.07)",
    bracket: "rgba(250,204,21,0.25)",
    bottomAccent: "rgba(250,204,21,0.4)",
  },
  highlight: {
    bar: "from-lime-400 via-green-400 to-lime-600",
    border: "rgba(132,204,22,0.35)",
    glow: "rgba(132,204,22,0.08)",
    tint: "rgba(132,204,22,0.07)",
    bracket: "rgba(132,204,22,0.25)",
    bottomAccent: "rgba(132,204,22,0.4)",
  },
  red: {
    bar: "from-red-400 via-red-300 to-red-600",
    border: "rgba(239,68,68,0.35)",
    glow: "rgba(239,68,68,0.08)",
    tint: "rgba(239,68,68,0.07)",
    bracket: "rgba(239,68,68,0.25)",
    bottomAccent: "rgba(239,68,68,0.4)",
  },
};
