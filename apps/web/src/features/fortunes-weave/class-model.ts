import classData from "./classes.json"
import { FORTUNES_WEAVE_ROUTES } from "./characters"

export const CLASS_SOURCE_URL = "https://fortunesweave.co.uk/classes"
export const CLASS_SOURCE_CHECKED = "2026-10-05"
export const CLASS_TIERS = ["preClass", "beginner", "specialty", "advanced", "master", "divine"] as const
export const WEAPON_TYPES = ["sword", "spear", "axe", "bow", "gauntlet", "whiteMagic", "blackMagic"] as const
export const MOVEMENT_TYPES = ["foot", "mounted", "flying"] as const
export type ClassTier = typeof CLASS_TIERS[number]
export type WeaponType = typeof WEAPON_TYPES[number]
export type TrainingType = WeaponType | "rider" | "riding" | "heavy" | "flier"
export type ClassRoute = typeof FORTUNES_WEAVE_ROUTES[number]
export interface ClassRank { type: TrainingType; rank: string | null }
export interface WeaveClass {
  id: string
  tier: ClassTier
  weapons: ClassRank[]
  movement: { type: typeof MOVEMENT_TYPES[number]; spaces: number | null } | null
  skills: string[]
  masterSkill: string | null
  requirements: {
    ranks: ClassRank[]
    level: number | null
    renown: number | null
    license: "beginner" | "specialty" | "advanced" | "master" | null
    item: string | null
    documented: boolean
    routeUnlocks: { route: ClassRoute; textKey: string }[]
  }
  unverified: boolean
}

// This is a checked-in reference snapshot, never fetched by rendering components.
export const WEAVE_CLASSES = classData as WeaveClass[]
export type ClassPlan = Record<ClassRoute, Record<string, string>>
export const emptyClassPlan = (): ClassPlan => ({ cai: {}, dietrich: {}, theodora: {}, leda: {} })

/** Ignore unknown identities and removed classes when restoring browser data. */
export function restoreClassPlan(value: unknown, characterIds: readonly string[]): ClassPlan {
  const plan = emptyClassPlan()
  if (!value || typeof value !== "object" || Array.isArray(value)) return plan
  const saved = value as Record<string, unknown>
  for (const route of FORTUNES_WEAVE_ROUTES) {
    const entries = saved[route]
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue
    for (const [characterId, classId] of Object.entries(entries)) {
      if (characterIds.includes(characterId) && typeof classId === "string" && WEAVE_CLASSES.some((entry) => entry.id === classId)) {
        plan[route][characterId] = classId
      }
    }
  }
  return plan
}

export interface ClassFilters { query: string; tier: string; weapon: string; movement: string }
export function filterClasses(
  classes: readonly WeaveClass[],
  filters: ClassFilters,
  searchableText: (entry: WeaveClass) => string,
): WeaveClass[] {
  const term = filters.query.trim().toLocaleLowerCase()
  return classes.filter((entry) =>
    (filters.tier === "all" || entry.tier === filters.tier) &&
    (filters.weapon === "all" || entry.weapons.some((weapon) => weapon.type === filters.weapon)) &&
    (filters.movement === "all" || entry.movement?.type === filters.movement) &&
    (!term || searchableText(entry).toLocaleLowerCase().includes(term)),
  ).sort((a, b) => CLASS_TIERS.indexOf(a.tier) - CLASS_TIERS.indexOf(b.tier))
}
