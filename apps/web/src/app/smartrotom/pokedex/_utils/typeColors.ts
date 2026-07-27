/**
 * Single source of truth for Pokémon type colours (hex) and their label keys.
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

// Type name → `pokedex` message key. Resolve with `t(TYPE_LABEL_KEYS[type])`;
// the keys live in the CORE half (smartrotom/pokedex/common.json) so they are
// reachable from every route, not just /smartrotom/pokedex.
export const TYPE_LABEL_KEYS: Record<string, string> = {
  normal: "type_normal",
  fire: "type_fire",
  water: "type_water",
  grass: "type_grass",
  electric: "type_electric",
  ice: "type_ice",
  fighting: "type_fighting",
  poison: "type_poison",
  ground: "type_ground",
  flying: "type_flying",
  psychic: "type_psychic",
  bug: "type_bug",
  rock: "type_rock",
  ghost: "type_ghost",
  dragon: "type_dragon",
  dark: "type_dark",
  steel: "type_steel",
  fairy: "type_fairy",
}

/**
 * @deprecated Untranslated es-only labels, kept alive only for the two pasaporte
 * consumers (`chapters/Equipo.tsx`, `chapters/BadgePage.tsx`) that still import it.
 * Those are owned by the pasaporte batch; once they move to `TYPE_LABEL_KEYS` +
 * `t(...)` this map must be deleted. Do not add new call sites.
 */
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
