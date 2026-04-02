export interface NeonStyle {
  glow: string;
  scan: string;
  border: string;
}

/**
 * Maps a Tailwind color class string to neon RGBA values used for
 * glow effects, scan lines, and borders across tool cards.
 */
export function getNeonStyle(colorClass: string): NeonStyle {
  if (colorClass.includes("yellow"))
    return { glow: "rgba(250,204,21,0.3)", scan: "rgba(250,204,21,0.7)", border: "rgba(250,204,21,0.4)" };
  if (colorClass.includes("highlight"))
    return { glow: "rgba(132,204,22,0.3)", scan: "rgba(163,230,53,0.7)", border: "rgba(132,204,22,0.4)" };
  if (colorClass.includes("secondary"))
    return { glow: "rgba(6,182,212,0.3)", scan: "rgba(34,211,238,0.7)", border: "rgba(6,182,212,0.4)" };
  if (colorClass.includes("red"))
    return { glow: "rgba(239,68,68,0.3)", scan: "rgba(248,113,113,0.7)", border: "rgba(239,68,68,0.4)" };
  if (colorClass.includes("accent"))
    return { glow: "rgba(168,85,247,0.3)", scan: "rgba(192,132,252,0.7)", border: "rgba(168,85,247,0.4)" };
  // Default: primary orange
  return { glow: "rgba(249,115,22,0.3)", scan: "rgba(251,146,60,0.7)", border: "rgba(249,115,22,0.4)" };
}
