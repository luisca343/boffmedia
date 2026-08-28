// Presentation metadata for biomes. Real biomes arrive from getBiomes() as
// { name, count } only — colour / glyph are derived here from the biome name
// (keyword rules), like the type-colour map. Not fabricated data: it's
// deterministic presentation, with a neutral fallback for unknown names.
//
// There is deliberately NO Pokémon type here. These rules match English biome
// vocabulary, so anything outside that vocabulary either fell through to a
// "normal" type it never earned or matched by accident — `teras:pueblo_lavanda`
// resolved to FIRE because "la-va-nda" contains "lava". Colour and glyph degrade
// gracefully when a rule misses; a type does not, it just states something false.
export type BiomeMeta = { color: string; glyph: string; textLight: boolean }

const RULES: { match: RegExp; meta: BiomeMeta }[] = [
  { match: /nether|basalt|soul|crimson|warped|volcan|lava|scorched/, meta: { color: "#c0392b", glyph: "🌋", textLight: true } },
  { match: /ocean|sea|reef|beach|shore|coast/, meta: { color: "#2980ef", glyph: "🌊", textLight: true } },
  { match: /river|swamp|marsh|mangrove/, meta: { color: "#1976d2", glyph: "🪸", textLight: true } },
  { match: /jungle|bamboo|rainforest/, meta: { color: "#2e7d32", glyph: "🍃", textLight: true } },
  { match: /forest|grove|taiga|birch|wood|pine/, meta: { color: "#388e3c", glyph: "🌲", textLight: true } },
  { match: /plain|meadow|field|savanna|prairie/, meta: { color: "#7cb342", glyph: "🌾", textLight: false } },
  { match: /desert|dune|badlands|mesa|arid/, meta: { color: "#d4a35a", glyph: "🏜", textLight: false } },
  { match: /mountain|hill|peak|slope|windswept|highland/, meta: { color: "#7d6b53", glyph: "⛰", textLight: true } },
  { match: /cave|cavern|deep|dripstone|underground|stony/, meta: { color: "#5d4037", glyph: "🕳", textLight: true } },
  { match: /snow|ice|frozen|glacial|tundra|cold|snowy/, meta: { color: "#5dade2", glyph: "❄", textLight: true } },
  { match: /mushroom|fungus|fungi/, meta: { color: "#5a6b3a", glyph: "🍄", textLight: true } },
  { match: /end|void|dark|obsidian|nightmare/, meta: { color: "#3a2c4a", glyph: "🌑", textLight: true } },
  { match: /flower|cherry|enchant|magic|sakura/, meta: { color: "#b97fcf", glyph: "🌸", textLight: true } },
  { match: /thunder|storm|electric/, meta: { color: "#c79c2e", glyph: "⚡", textLight: false } },
  { match: /ruin|ancient|temple/, meta: { color: "#5e548e", glyph: "🗿", textLight: true } },
]

const FALLBACK: BiomeMeta = { color: "#4a576e", glyph: "🗺", textLight: true }

/**
 * Our own villages get one look of their own, ahead of the keyword rules.
 *
 * They are settlements, not terrain, so the rules have nothing real to match on:
 * 16 of the 18 fell through to the grey fallback and the other two matched by
 * accident (`pueblo_lavanda` -> volcanic, on "la-VA-nda"). A single shared
 * identity is both more accurate and easier to scan than 18 near-identical greys.
 *
 * Teal is deliberate: no natural-biome rule uses it, so villages never read as a
 * forest or an ocean at a glance.
 */
const VILLAGE: BiomeMeta = { color: "#12796f", glyph: "🏘", textLight: true }

/** `teras:pueblo_*` only — a future non-village teras biome should still use the rules. */
const VILLAGE_PREFIX = "teras:pueblo_"

export function resolveBiome(name: string): BiomeMeta {
  const n = name.toLowerCase()
  if (n.startsWith(VILLAGE_PREFIX)) return VILLAGE
  for (const r of RULES) if (r.match.test(n)) return r.meta
  return FALLBACK
}
