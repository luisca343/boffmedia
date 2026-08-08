import type { RandomizerSettings } from "@boffmedia/pack-schema"
import type { RzWarning } from "./RandomizerUiContext"

type T = (key: string, values?: Record<string, string | number>) => string
type Values = Partial<RandomizerSettings> & Record<string, unknown>

/**
 * UI-level validation + advisories layered on top of the zod schema.
 *
 * The canonical, game-agnostic rules come from FVX v1.6.1 (see
 * `docs/handoffs/.../FVX_CANONICAL_GATING_VALIDATION.md` findings): BST min/max
 * bounds, the race-mode requirement (`GUI.raceModeRequirements`), and Metronome-
 * only silencing the move options. ROM-capability gates are intentionally
 * excluded — the web editor configures without a loaded ROM. The remaining
 * entries are advisories (info/warn) that mirror the prototype's guidance.
 */
export function computeWarnings(values: Values, t: T): RzWarning[] {
  const w: RzWarning[] = []
  const add = (level: RzWarning["level"], field: string, key: string) =>
    w.push({ level, field, text: t(key) })

  const bstMin = Number(values.startersBSTMinimum ?? 0)
  const bstMax = Number(values.startersBSTMaximum ?? 0)
  if (bstMin > 0 && bstMax > 0 && bstMin > bstMax) {
    add("bad", "startersBSTMinimum", "warnings.bstMinMax")
  }

  if (values.raceMode && values.trainersMod === "UNCHANGED" && !values.randomizeWildPokemon) {
    add("bad", "raceMode", "warnings.raceMode")
  }

  if (values.movesetsMod === "METRONOME_ONLY") {
    add("info", "movesetsMod", "warnings.metronome")
  }

  if (
    values.typeEffectivenessMod === "RANDOM" ||
    values.typeEffectivenessMod === "RANDOM_BALANCED" ||
    values.typeEffectivenessMod === "INVERSE"
  ) {
    add("info", "typeEffectivenessMod", "warnings.typeChart")
  }

  if (values.fullHMCompat && values.tmsHmsCompatibilityMod === "FULL") {
    add("info", "fullHMCompat", "warnings.fullHmRedundant")
  }

  if (values.allowWonderGuard && values.trainersMod !== "UNCHANGED") {
    add("warn", "allowWonderGuard", "warnings.wonderGuard")
  }

  return w
}
