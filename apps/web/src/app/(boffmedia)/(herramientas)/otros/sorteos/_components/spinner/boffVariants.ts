// Legacy visual tokens kept verbatim for the retained v2 giveaway spinner.
// The spinner's v3 restyle is deferred; only the primary/yellow variants it
// consumes live here.
export type BoffVariant = "primary" | "yellow";

export interface BoffVariantTokens {
  bar: string;
  border: string;
  glow: string;
  glowStrong: string;
  tint: string;
  bracket: string;
  bottomAccent: string;
  scan: string;
  text: string;
}

export const BOFF_VARIANTS: Record<BoffVariant, BoffVariantTokens> = {
  primary: {
    bar: "from-primary-hover via-orange-400 to-primary-active",
    border: "rgba(249,115,22,0.35)",
    glow: "rgba(249,115,22,0.08)",
    glowStrong: "rgba(249,115,22,0.3)",
    tint: "rgba(249,115,22,0.07)",
    bracket: "rgba(249,115,22,0.25)",
    bottomAccent: "rgba(249,115,22,0.4)",
    scan: "rgba(251,146,60,0.7)",
    text: "rgb(251,146,60)",
  },
  yellow: {
    bar: "from-yellow-400 via-yellow-300 to-yellow-600",
    border: "rgba(250,204,21,0.35)",
    glow: "rgba(250,204,21,0.08)",
    glowStrong: "rgba(250,204,21,0.3)",
    tint: "rgba(250,204,21,0.07)",
    bracket: "rgba(250,204,21,0.25)",
    bottomAccent: "rgba(250,204,21,0.4)",
    scan: "rgba(250,204,21,0.7)",
    text: "rgb(250,204,21)",
  },
};
