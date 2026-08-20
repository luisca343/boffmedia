/**
 * The six spot colours of the magazine.
 *
 * An article's accent is DERIVED from its category (the API has no colour
 * field), so the value is data-driven — which means it can never be
 * interpolated into a class name (`bg-ft-${accent}` silently never compiles).
 * Every accent is therefore applied through one of the literal maps below.
 */
export type FtAccent =
  | "pink"
  | "cyan"
  | "yellow"
  | "purple"
  | "orange"
  | "lime";

export const FT_ACCENTS: readonly FtAccent[] = [
  "pink",
  "cyan",
  "yellow",
  "purple",
  "orange",
  "lime",
] as const;

/** Tones a pill can take, including the two non-accent ones. */
export type FtTone = FtAccent | "ink" | "paper";

export const ACCENT_BG: Record<FtAccent, string> = {
  pink: "bg-ft-pink",
  cyan: "bg-ft-cyan",
  yellow: "bg-ft-yellow",
  purple: "bg-ft-purple",
  orange: "bg-ft-orange",
  lime: "bg-ft-lime",
};

export const ACCENT_BG_SOFT: Record<FtAccent, string> = {
  pink: "bg-ft-pink-soft",
  cyan: "bg-ft-cyan-soft",
  yellow: "bg-ft-yellow-soft",
  purple: "bg-ft-purple-soft",
  // No -soft token for these two; a low-alpha wash reads the same on paper.
  orange: "bg-ft-orange-soft",
  lime: "bg-ft-lime/25",
};

export const ACCENT_TEXT: Record<FtAccent, string> = {
  pink: "text-ft-pink",
  cyan: "text-ft-cyan",
  yellow: "text-ft-yellow",
  purple: "text-ft-purple",
  orange: "text-ft-orange",
  lime: "text-ft-lime",
};

export const ACCENT_BORDER: Record<FtAccent, string> = {
  pink: "border-ft-pink",
  cyan: "border-ft-cyan",
  yellow: "border-ft-yellow",
  purple: "border-ft-purple",
  orange: "border-ft-orange",
  lime: "border-ft-lime",
};

/**
 * Ink or white on top of each accent. Pink and purple are dark enough to carry
 * white; the other four would fail contrast with it, so they take ink.
 */
export const ACCENT_ON: Record<FtAccent, string> = {
  pink: "text-white",
  purple: "text-white",
  cyan: "text-ft-ink",
  yellow: "text-ft-ink",
  orange: "text-ft-ink",
  lime: "text-ft-ink",
};

/** Raw hex, for SVG fills and inline gradients where Tailwind cannot reach. */
export const ACCENT_HEX: Record<FtAccent, string> = {
  pink: "#ff2d87",
  cyan: "#00c4d4",
  yellow: "#ffd60a",
  purple: "#8b5cf6",
  orange: "#ff7a1a",
  lime: "#b3e63b",
};

export const FT_INK = "#0b0b0f";

/**
 * The comic-burst / hero-art palette: a base, the wash that pools in the
 * corner, and the halftone dot colour that reads on top of it.
 */
export const ACCENT_ART: Record<
  FtAccent,
  { bg: string; wash: string; dot: string }
> = {
  pink: { bg: "#ff2d87", wash: "#ffd60a", dot: FT_INK },
  cyan: { bg: "#00c4d4", wash: "#ff2d87", dot: FT_INK },
  yellow: { bg: "#ffd60a", wash: "#ff2d87", dot: FT_INK },
  purple: { bg: "#8b5cf6", wash: "#ffd60a", dot: FT_INK },
  orange: { bg: "#ff7a1a", wash: FT_INK, dot: "#ffffff" },
  lime: { bg: "#b3e63b", wash: FT_INK, dot: FT_INK },
};

/**
 * Stable accent for a category. The same category must always print in the
 * same colour across the whole issue, so this hashes rather than cycling by
 * index — an article's colour must not change when a new one is published
 * above it.
 */
export function accentFor(seed: string | null | undefined): FtAccent {
  const key = (seed ?? "").trim().toLowerCase();
  if (!key) return "pink";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return FT_ACCENTS[hash % FT_ACCENTS.length];
}
