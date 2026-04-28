/**
 * Human-readable labels for Smogon format IDs used across the VGC meta UI.
 * Keyed by formatId (e.g. "gen9vgc2026regi"); falls back to the raw ID in
 * components when a label is not present (new formats auto-surface without
 * a code change).
 *
 * Only add an entry when the auto-generated ID is unreadable. For Champions
 * regulations the label comes from the API's `ChampionsRegulation.name` field.
 */
export const FORMAT_LABELS: Readonly<Record<string, string>> = {
  gen9vgc2026regi: "VGC 2026 Reg I",
  gen9vgc2026regh: "VGC 2026 Reg H",
  gen9vgc2025regg: "VGC 2025 Reg G",
  gen9vgc2025regf: "VGC 2025 Reg F",
};
