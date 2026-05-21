/**
 * Shared Pokémon type color map — single source of truth.
 * Used in TypeChip, FullTypeChart, movimientos, localizacion, and any
 * other component that needs a hex color for a Pokémon type.
 *
 * Values intentionally match the CSS custom properties defined in
 * smartrotom.css (--type-fire, --type-water, etc.).
 */
export const TYPE_COLORS: Record<string, string> = {
  normal: "#9fa19f",
  fire: "#e62829",
  water: "#2980ef",
  grass: "#3fa129",
  electric: "#fac000",
  ice: "#3fd8ff",
  fighting: "#ff8000",
  poison: "#9141cb",
  ground: "#d6985c",
  flying: "#81b9ef",
  psychic: "#ef4179",
  bug: "#91a119",
  rock: "#afa981",
  ghost: "#704170",
  dragon: "#5061e1",
  dark: "#50413f",
  steel: "#60a1b8",
  fairy: "#ef71ef",
}
