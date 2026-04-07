import { BOFF_VARIANTS, BoffVariant } from "./boffVariants";

export interface BoffStyle {
  /** Interactive hover box-shadow glow (rgba ~0.3) */
  glow: string;
  /** Scan lines and bullet dots (rgba ~0.7) */
  scan: string;
  /** Border color (rgba ~0.35–0.4) */
  border: string;
  /** Full-opacity text / icon accent color */
  text: string;
}

const COLOR_KEYS: Array<[string, BoffVariant]> = [
  ["yellow", "yellow"],
  ["highlight", "highlight"],
  ["secondary", "secondary"],
  ["red", "red"],
  ["accent", "accent"],
];

/**
 * Maps a Tailwind color class string (e.g. "from-secondary-400 via-cyan-400")
 * to boff style tokens derived from the single-source BOFF_VARIANTS map.
 */
export function getBoffStyle(colorClass: string): BoffStyle {
  const match = COLOR_KEYS.find(([key]) => colorClass.includes(key));
  const tokens = BOFF_VARIANTS[match ? match[1] : "primary"];
  return {
    glow: tokens.glowStrong,
    scan: tokens.scan,
    border: tokens.border,
    text: tokens.text,
  };
}
