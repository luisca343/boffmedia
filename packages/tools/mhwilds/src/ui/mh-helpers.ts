import type { Weapon } from "../types"

// Emerald game hue + rarity ramp — set as CSS custom properties on the MhApp
// root so the whole subtree (and arbitrary-value utilities) can read them.
// Brand orange (`--accent`) stays reserved for primary actions.
export const MH_VARS: React.CSSProperties = {
  ["--mh" as string]: "hsl(152 52% 46%)",
  ["--mh-bright" as string]: "hsl(152 58% 56%)",
  ["--mh-soft" as string]: "hsl(152 52% 46% / 0.13)",
  ["--mh-line" as string]: "hsl(152 52% 46% / 0.4)",
  ["--rar1" as string]: "#9aa3b2",
  ["--rar2" as string]: "#cfd6e0",
  ["--rar3" as string]: "#7fd6a8",
  ["--rar4" as string]: "#6cc4e8",
  ["--rar5" as string]: "#7d9bff",
  ["--rar6" as string]: "#b98bff",
  ["--rar7" as string]: "#ff9a6b",
  ["--rar8" as string]: "#ffcf5c",
}

export const rarClamp = (n?: number) => Math.max(1, Math.min(8, n || 1))
export const rarVar = (n?: number) => `var(--rar${rarClamp(n)})`
// rarity 5+ ramps use a white glyph for contrast
export const rarInk = (n?: number) => (rarClamp(n) >= 5 && rarClamp(n) <= 6 ? "#fff" : "var(--naranja-ink)")

export const RES_ORDER = ["fire", "water", "thunder", "ice", "dragon"] as const

export const ELEMENT_COLOR: Record<string, string> = {
  fire: "#ff7a5c",
  water: "var(--info)",
  thunder: "#ffcf5c",
  ice: "#6cc4e8",
  dragon: "#b98bff",
  poison: "#b98bff",
  sleep: "#7d9bff",
  paralysis: "#ffcf5c",
  blast: "#ff9a6b",
  stun: "#ffcf5c",
  exhaust: "#9aa3b2",
}
export const elementColor = (type?: string) => (type ? ELEMENT_COLOR[type.toLowerCase()] || "var(--muted)" : "var(--muted)")

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
    const kind = s.kind || (["poison", "sleep", "paralysis", "blast", "stun", "exhaust"].includes(String(type).toLowerCase()) ? "status" : "element")
    return { type: String(type), value, hidden: !!s.hidden, kind }
  }
  return null
}

export type MhWeapon = Weapon & { children?: MhWeapon[] }
