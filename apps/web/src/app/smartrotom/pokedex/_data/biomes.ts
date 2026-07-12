// Presentation metadata for biomes. Real biomes arrive from getBiomes() as
// { name, count } only — colour / glyph / dominant-type are derived here from
// the biome name (keyword rules), like the type-colour map. Not fabricated data:
// it's deterministic presentation, with a neutral fallback for unknown names.
export type BiomeMeta = { color: string; glyph: string; type: string; textLight: boolean }

const RULES: { match: RegExp; meta: BiomeMeta }[] = [
  { match: /nether|basalt|soul|crimson|warped|volcan|lava|scorched/, meta: { color: "#c0392b", glyph: "🌋", type: "fire", textLight: true } },
  { match: /ocean|sea|reef|beach|shore|coast/, meta: { color: "#2980ef", glyph: "🌊", type: "water", textLight: true } },
  { match: /river|swamp|marsh|mangrove/, meta: { color: "#1976d2", glyph: "🪸", type: "water", textLight: true } },
  { match: /jungle|bamboo|rainforest/, meta: { color: "#2e7d32", glyph: "🍃", type: "grass", textLight: true } },
  { match: /forest|grove|taiga|birch|wood|pine/, meta: { color: "#388e3c", glyph: "🌲", type: "grass", textLight: true } },
  { match: /plain|meadow|field|savanna|prairie/, meta: { color: "#7cb342", glyph: "🌾", type: "grass", textLight: false } },
  { match: /desert|dune|badlands|mesa|arid/, meta: { color: "#d4a35a", glyph: "🏜", type: "ground", textLight: false } },
  { match: /mountain|hill|peak|slope|windswept|highland/, meta: { color: "#7d6b53", glyph: "⛰", type: "rock", textLight: true } },
  { match: /cave|cavern|deep|dripstone|underground|stony/, meta: { color: "#5d4037", glyph: "🕳", type: "rock", textLight: true } },
  { match: /snow|ice|frozen|glacial|tundra|cold|snowy/, meta: { color: "#5dade2", glyph: "❄", type: "ice", textLight: true } },
  { match: /mushroom|fungus|fungi/, meta: { color: "#5a6b3a", glyph: "🍄", type: "poison", textLight: true } },
  { match: /end|void|dark|obsidian|nightmare/, meta: { color: "#3a2c4a", glyph: "🌑", type: "dark", textLight: true } },
  { match: /flower|cherry|enchant|magic|sakura/, meta: { color: "#b97fcf", glyph: "🌸", type: "fairy", textLight: true } },
  { match: /thunder|storm|electric/, meta: { color: "#c79c2e", glyph: "⚡", type: "electric", textLight: false } },
  { match: /ruin|ancient|temple/, meta: { color: "#5e548e", glyph: "🗿", type: "psychic", textLight: true } },
]

const FALLBACK: BiomeMeta = { color: "#4a576e", glyph: "🗺", type: "normal", textLight: true }

export function resolveBiome(name: string): BiomeMeta {
  const n = name.toLowerCase()
  for (const r of RULES) if (r.match.test(n)) return r.meta
  return FALLBACK
}
