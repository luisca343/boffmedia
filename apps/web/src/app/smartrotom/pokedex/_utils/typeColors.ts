/**
 * Single source of truth for Pokémon type colours (hex) and their es-ES labels.
 *
 * Colours are DATA-DRIVEN — consumed via inline `style`, never a dynamic
 * `bg-pk-type-${t}` class (that can't be seen by the Tailwind JIT). Values match
 * the `--type-*` custom properties baked into the Pokédex `pk-*` design tokens.
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

// es-ES type names. The Pokédex chrome is hardcoded Spanish to match the app —
// there is no `pokedex` next-intl namespace on this branch.
export const TYPE_LABELS: Record<string, string> = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  grass: "Planta",
  electric: "Eléctrico",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
}

export const ALL_TYPES = Object.keys(TYPE_COLORS)
