// Category / palette keys shared by folders and tags. Classes are LITERAL
// strings (never `nt-c-${key}`) so the Tailwind JIT can see them.

export type ColorKey =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info";

export const COLOR_KEYS: ColorKey[] = [
  "primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "error",
  "info",
];

// RGB triplets — for inline styles (avatars, graph, chip tints) and SVG.
export const COLOR_RGB: Record<ColorKey, string> = {
  primary: "249 115 22",
  secondary: "59 130 246",
  accent: "217 70 239",
  success: "16 185 129",
  warning: "245 158 11",
  error: "239 68 68",
  info: "139 92 246",
};

export const COLOR_TEXT: Record<ColorKey, string> = {
  primary: "text-nt-c-primary",
  secondary: "text-nt-c-secondary",
  accent: "text-nt-c-accent",
  success: "text-nt-c-success",
  warning: "text-nt-c-warning",
  error: "text-nt-c-error",
  info: "text-nt-c-info",
};

export function colorKey(value: string | null | undefined): ColorKey {
  return (COLOR_KEYS as string[]).includes(value ?? "")
    ? (value as ColorKey)
    : "primary";
}

export function rgbOf(value: string | null | undefined): string {
  return COLOR_RGB[colorKey(value)];
}

/** Deterministic hue from an arbitrary string (secondary-account / user tint). */
export function hashColor(seed: string): ColorKey {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return COLOR_KEYS[Math.abs(h) % COLOR_KEYS.length];
}
