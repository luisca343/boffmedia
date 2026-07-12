export type RotomThemeId = "dark" | "light" | "tulipan" | "mizu" | "oasis" | "auto"

/** What a themeable app actually renders: there is no third option. */
export type RotomMode = "light" | "dark"

export interface RotomTheme {
  id: RotomThemeId
  label: string
  /**
   * Class applied to the SmartRotom root. `""` is the default palette (no class).
   *
   * NOTE: only `""` is backed by CSS today — `theme-light`/`theme-tulipan`/`theme-mizu`/
   * `theme-oasis` are declared here and applied to the root, but no stylesheet defines
   * them yet, so picking one currently repaints nothing in the chrome. The palettes are
   * the next step; this table is the contract they must satisfy.
   */
  className: string
  /**
   * The light/dark a themeable app adopts under this theme.
   *
   * This is the whole point of the table: most SmartRotom apps ship only a light/dark
   * axis (`.ca-app[data-theme]`, `.nt-app[data-theme]`) and have no Tulipán or Oasis
   * variant. Rather than leaving them unstyled, each theme declares which mode an app
   * should fall back to. `"system"` follows the OS.
   */
  mode: RotomMode | "system"
  /** Three preview dots for the picker. Literal classes — never composed. */
  swatches: readonly [string, string, string]
}

export const ROTOM_THEMES: readonly RotomTheme[] = [
  { id: "dark", label: "Oscuro", className: "", mode: "dark", swatches: ["bg-layer-2", "bg-layer-3", "bg-primary"] },
  { id: "light", label: "Claro", className: "theme-light", mode: "light", swatches: ["bg-white", "bg-slate-100", "bg-primary"] },
  { id: "tulipan", label: "Tulipán", className: "theme-tulipan", mode: "light", swatches: ["bg-pink-50", "bg-pink-100", "bg-pink-500"] },
  { id: "mizu", label: "Mizu", className: "theme-mizu", mode: "light", swatches: ["bg-cyan-50", "bg-cyan-100", "bg-cyan-500"] },
  { id: "oasis", label: "Oasis", className: "theme-oasis", mode: "dark", swatches: ["bg-amber-950", "bg-amber-900", "bg-amber-500"] },
  { id: "auto", label: "Auto", className: "", mode: "system", swatches: ["bg-white", "bg-layer-3", "bg-primary"] },
] as const

export const DEFAULT_THEME: RotomThemeId = "dark"

/** Anything unrecognised (a stale persisted id, a theme an app can't render) → dark. */
export const FALLBACK_MODE: RotomMode = "dark"

export function themeById(id: string | null | undefined): RotomTheme {
  return ROTOM_THEMES.find((t) => t.id === id) ?? ROTOM_THEMES.find((t) => t.id === DEFAULT_THEME)!
}

/** The class the SmartRotom root wears for a theme. */
export function themeClass(id: string | null | undefined): string {
  return themeById(id).className
}

/**
 * Resolve a theme to the light/dark an app should render.
 * `systemDark` is the OS preference, only consulted by `auto`.
 */
export function resolveMode(id: string | null | undefined, systemDark: boolean): RotomMode {
  const t = themeById(id)
  if (t.mode === "system") return systemDark ? "dark" : "light"
  return t.mode ?? FALLBACK_MODE
}
