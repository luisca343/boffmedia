import type { useTranslations } from "next-intl"
import type { PasaporteLogroEntity, PasaporteProfileEntity, UserAchievement } from "@boffmedia/shared"
import type { ChapterAccent, Milestone, MilestoneIcon } from "../_types"
import { TIER_RANK } from "./tiers"

export type { Milestone } from "../_types"

function iso(value: string | null | undefined): string | null {
  if (!value) return null
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? new Date(ts).toISOString() : null
}

function fold(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

interface Look {
  icon: MilestoneIcon
  accent: ChapterAccent
  big: boolean
}

/** A crown moment is a league title or the Frente de Batalla — the two things you can only win once. */
function lookOf(category: string): Look {
  const folded = fold(category)
  if (folded === "gimnasios") return { icon: "medal", accent: "olive", big: false }
  if (folded === "ligas") return { icon: "crown", accent: "gild", big: true }
  if (folded === "frente batalla") return { icon: "trophy", accent: "oxblood", big: true }
  return { icon: "swords", accent: "oxblood", big: false }
}

/**
 * The Crónica: the trainer's life on the server, in order.
 *
 * Every entry is a real dated fact — the day they arrived, the day they took a badge. Nothing
 * here is invented, and an undated event is simply not a milestone: there is nowhere to put it
 * on a timeline.
 *
 * `achievements` and `logros` are THE SAME ROWS. `/pasaporte/logros` returns the whole
 * achievement list with `points`/`tier`/`rarity` bolted on — it is not a second, separate
 * trophy system. Walking both lists stamps every badge onto the timeline twice, so
 * merge them on `id` and emit one milestone per achievement, taking the tier from
 * the logro side when it is there.
 */
export function milestonesFromHistory(
  achievements: UserAchievement[] = [],
  logros: PasaporteLogroEntity[] = [],
  profile: PasaporteProfileEntity | null | undefined,
  t: ReturnType<typeof useTranslations>,
): Milestone[] {
  const milestones: Milestone[] = []

  const arrival = iso(profile?.memberSince ?? profile?.createdAt)
  if (arrival && profile) {
    milestones.push({
      id: "llegada",
      date: arrival,
      title: t("cronica.arrival.title"),
      desc: t("cronica.arrival.desc", { region: profile.region }),
      icon: "pin",
      accent: "teal",
    })
  }

  const tierOf = new Map(logros.map((logro) => [logro.id, logro.tier]))

  const merged = new Map<string, UserAchievement | PasaporteLogroEntity>()
  for (const row of [...achievements, ...logros]) merged.set(row.id, row)

  for (const row of merged.values()) {
    // 0/1 from the API, never a boolean.
    if (!row.completed) continue
    const date = iso(row.completedAt)
    if (!date) continue

    const look = lookOf(row.category)
    const tier = tierOf.get(row.id)
    const platinum = tier ? TIER_RANK[tier] >= TIER_RANK.platino : false

    milestones.push({
      id: row.id,
      date,
      title: row.name,
      // The seeded rows set `description` to the badge's own name, and a card that says
      // "Medalla Sakura / Medalla Sakura" just looks broken. A description only earns its
      // line when it actually says something the title does not.
      desc: fold(row.description) === fold(row.name) ? "" : row.description,
      icon: platinum ? "star" : look.icon,
      accent: look.accent,
      ...(look.big || platinum ? { big: true } : {}),
    })
  }

  return milestones.sort((a, b) => a.date.localeCompare(b.date))
}
