import type { Weapon } from "../types"
import type { IconName } from "@boffmedia/ui"

// Emerald game hue + rarity ramp — set as CSS custom properties on the MhApp
// root so the whole subtree (and arbitrary-value utilities) can read them.
// Brand orange (`--accent`) stays reserved for primary actions.
export const MH_VARS: React.CSSProperties = {
  // Exact opaque sRGB samples from the extracted in-game talisman-1..8
  // assets, which share the game's rarity glyph palette.
  ["--mh" as string]: "hsl(152 52% 46%)",
  ["--mh-bright" as string]: "hsl(152 58% 56%)",
  ["--mh-soft" as string]: "hsl(152 52% 46% / 0.13)",
  ["--mh-line" as string]: "hsl(152 52% 46% / 0.4)",
  ["--rar1" as string]: "#969696",
  ["--rar2" as string]: "#dedede",
  ["--rar3" as string]: "#a4c43b",
  ["--rar4" as string]: "#47a33f",
  ["--rar5" as string]: "#5caebb",
  ["--rar6" as string]: "#575fd9",
  ["--rar7" as string]: "#9272e3",
  ["--rar8" as string]: "#c76d46",
}

export const rarClamp = (n?: number) => Math.max(1, Math.min(8, n || 1))
export const rarVar = (n?: number) => `var(--rar${rarClamp(n)})`
// rarity 5+ ramps use a white glyph for contrast
export const rarInk = (n?: number) => (rarClamp(n) >= 5 && rarClamp(n) <= 6 ? "#fff" : "var(--naranja-ink)")

export type MhAttributeKind = "element" | "ailment"
export type MhAttributeDefinition = {
  key: string
  kind: MhAttributeKind
  color: string
  icon: IconName
}

/**
 * The single semantic source for every MH Wilds element and ailment glyph.
 *
 * The game stores these as attribute/status ids and its UI renders them from a
 * shared coloured atlas. The web/desktop tools load those cropped atlas cells
 * through MhAttributeIcon and use this table as the semantic/color bridge.
 * Keep aliases and presentation components out of individual pages; add them
 * here instead.
 */
export const MH_ATTRIBUTE_DEFINITIONS: readonly MhAttributeDefinition[] = [
  { key: "fire", kind: "element", color: "#d09070", icon: "flame" },
  { key: "water", kind: "element", color: "#7090b0", icon: "drop" },
  { key: "thunder", kind: "element", color: "#d0c080", icon: "bolt" },
  { key: "ice", kind: "element", color: "#a0c0f0", icon: "sparkles" },
  { key: "dragon", kind: "element", color: "#a06060", icon: "skull" },
  { key: "poison", kind: "ailment", color: "#70e070", icon: "skull" },
  { key: "sleep", kind: "ailment", color: "#6080b0", icon: "moon" },
  { key: "paralysis", kind: "ailment", color: "#f0b030", icon: "bolt" },
  { key: "blast", kind: "ailment", color: "#ff8050", icon: "flame" },
  { key: "blastblight", kind: "ailment", color: "#ff8050", icon: "flame" },
  { key: "stun", kind: "ailment", color: "#f0b030", icon: "alert" },
  { key: "exhaust", kind: "ailment", color: "#9aa3b2", icon: "target" },
  { key: "fireblight", kind: "ailment", color: "#d09070", icon: "flame" },
  { key: "waterblight", kind: "ailment", color: "#7090b0", icon: "drop" },
  { key: "thunderblight", kind: "ailment", color: "#d0c080", icon: "bolt" },
  { key: "iceblight", kind: "ailment", color: "#a0c0f0", icon: "sparkles" },
  { key: "dragonblight", kind: "ailment", color: "#a06060", icon: "skull" },
]

export const MH_ATTRIBUTE_BY_KEY: Readonly<Record<string, MhAttributeDefinition>> =
  Object.freeze(Object.fromEntries(MH_ATTRIBUTE_DEFINITIONS.map((definition) => [definition.key, definition])))

export const MH_ELEMENT_KEYS = MH_ATTRIBUTE_DEFINITIONS
  .filter((definition) => definition.kind === "element")
  .map((definition) => definition.key) as unknown as readonly ["fire", "water", "thunder", "ice", "dragon"]
export const MH_AILMENT_KEYS = MH_ATTRIBUTE_DEFINITIONS
  .filter((definition) => definition.kind === "ailment")
  .map((definition) => definition.key)
export const MH_WEAPON_AILMENT_KEYS = ["poison", "sleep", "paralysis", "blast"] as const
export const MH_STATUS_KEYS = ["poison", "sleep", "paralysis", "blast", "stun", "exhaust"] as const
export const RES_ORDER = MH_ELEMENT_KEYS

/** Normalize the game's kebab/space-separated labels to our stable keys. */
export function normalizeAttributeKey(type?: string): string {
  return String(type ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "")
}

export function attributeDefinition(type?: string): MhAttributeDefinition | undefined {
  return MH_ATTRIBUTE_BY_KEY[normalizeAttributeKey(type)]
}

export function attributeKind(type?: string): MhAttributeKind | undefined {
  return attributeDefinition(type)?.kind
}

export function attributeColor(type?: string): string {
  return attributeDefinition(type)?.color || "var(--muted)"
}

export function attributeIcon(type?: string): IconName {
  return attributeDefinition(type)?.icon || "sparkles"
}

// Compatibility names retained for callers outside the package. Both now
// derive from the same definitions rather than maintaining parallel maps.
export const ELEMENT_COLOR: Record<string, string> = Object.fromEntries(
  MH_ATTRIBUTE_DEFINITIONS.map((definition) => [definition.key, definition.color]),
)
export const ELEMENT_ICON: Record<string, IconName> = Object.fromEntries(
  MH_ATTRIBUTE_DEFINITIONS.map((definition) => [definition.key, definition.icon]),
)
export const elementColor = attributeColor
export const elementIcon = attributeIcon

// skill category → left-accent colour (the sk-* ramp)
export const SK_COLOR: Record<string, string> = {
  attack: "#ff7a5c",
  element: "var(--info)",
  defense: "var(--mh)",
  utility: "var(--warn)",
}
export function skillCategory(kind?: string): keyof typeof SK_COLOR {
  const k = (kind || "").toLowerCase()
  if (k === "attack") return "attack"
  if (k === "element") return "element"
  if (k === "defense") return "defense"
  return "utility"
}

// sharpness segments in ascending order, with fixed colours
export const SHARP_ORDER: { key: string; color: string }[] = [
  { key: "red", color: "#e5484d" },
  { key: "orange", color: "#ff9a6b" },
  { key: "yellow", color: "#ffcf5c" },
  { key: "green", color: "#7fd6a8" },
  { key: "blue", color: "#6cc4e8" },
  { key: "white", color: "#e6ebf2" },
  { key: "purple", color: "#b98bff" },
]

// attack value regardless of the weapon shape variant served by the API
export const weaponAttack = (w?: { attack?: number; damage?: { display?: number; raw?: number } } | null): number => {
  if (!w) return 0
  if (typeof w.attack === "number") return w.attack
  if (w.damage && typeof w.damage.display === "number") return w.damage.display
  if (w.damage && typeof w.damage.raw === "number") return w.damage.raw
  return 0
}

// weapon-type slugs the app models, in canonical order (i18n key = slug)
export const WEAPON_TYPES = [
  "great-sword", "long-sword", "sword-shield", "dual-blades",
  "hammer", "hunting-horn", "lance", "gunlance",
  "switch-axe", "charge-blade", "insect-glaive",
  "light-bowgun", "heavy-bowgun", "bow",
] as const

// first special that carries an element or status, in the API's shape
export function firstSpecial(specials?: any[]): { type: string; value: number; hidden: boolean; kind: string } | null {
  if (!Array.isArray(specials)) return null
  for (const s of specials) {
    if (!s) continue
    const type = s.element || s.status || s.type
    if (!type) continue
    let value = 0
    if (s.damage && typeof s.damage === "object" && "display" in s.damage) value = s.damage.display
    else if (typeof s.damage === "number") value = s.damage
    else if (typeof s.value === "number") value = s.value
    if (value <= 0) continue
    const kind = s.kind || (attributeKind(String(type)) === "ailment" || s.status ? "status" : "element")
    return { type: String(type), value, hidden: !!s.hidden, kind }
  }
  return null
}

export type MhWeapon = Weapon & { children?: MhWeapon[] }
