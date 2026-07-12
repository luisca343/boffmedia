/**
 * What the `.ca-app` root renders. The *choice* between the two is no longer ChatApp's:
 * it is derived from the platform theme (`useRotomMode`), so the pref/auto resolution
 * that used to live here now lives once, in `components/smartrotom/theme`.
 */
export type ResolvedTheme = "light" | "dark";

/** Accent choices offered by the appearance picker (hex; `--ca-accent` is derived). */
export const ACCENTS = [
  "#00a884", "#0e9bb0", "#2f7fed", "#5b5bd6",
  "#8b5cf6", "#e3567a", "#d9650a", "#5a6b78",
] as const;

export const DEFAULT_ACCENT = ACCENTS[0];

/** `#00a884` → `"0 168 132"` (the space-separated triplet `--ca-accent` expects). */
export function hexToTriplet(hex: string): string {
  const h = String(hex).replace("#", "");
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = parseInt(x, 16);
  if (Number.isNaN(n)) return "0 168 132";
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

