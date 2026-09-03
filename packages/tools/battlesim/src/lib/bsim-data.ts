import type { IconName } from "@boffmedia/ui"
import { BSIM_FORMATS as CORE_FORMATS, formatsFor } from "@boffmedia/battle-core"

export type BsimView = "lobby" | "equipos" | "repeticiones"
export type BsimMode = "ia" | "pvp" | "showdown"

/** In-app nav tabs shown in the tool bar. */
export const BSIM_TABS: { key: BsimView; icon: IconName }[] = [
  { key: "lobby", icon: "sword" },
  { key: "equipos", icon: "layers" },
  { key: "repeticiones", icon: "play" },
]

/** Play modes → the screen each one launches into. */
export const BSIM_MODES: { id: BsimMode; icon: IconName; href: string }[] = [
  { id: "ia", icon: "target", href: "/pokemon/battlesim/play" },
  { id: "pvp", icon: "sword", href: "/pokemon/battlesim/pvp" },
  { id: "showdown", icon: "globe", href: "/pokemon/battlesim/showdown" },
]

/**
 * The format list, derived from `@boffmedia/battle-core` (D11).
 *
 * There used to be a second, hand-maintained list here, and the two disagreed:
 * this one offered "National Dex" for a battle against the AI, which is a TEAM
 * format with no random generator, so choosing it handed the simulator a format
 * it could not build a side for. One table now, with `kind` carried through so
 * a caller can tell the two apart instead of guessing from the name.
 *
 * `value`/`label` rather than `id`/`label` because that is the shape the
 * `DkSelect` call sites already pass.
 */
export interface BsimFormatOption {
  value: string
  label: string
  kind: "random" | "team"
  doubles: boolean
}

const toOption = (f: (typeof CORE_FORMATS)[number]): BsimFormatOption => ({
  value: f.id,
  label: f.label,
  kind: f.kind,
  doubles: Boolean(f.doubles),
})

export const BSIM_FORMATS: BsimFormatOption[] = CORE_FORMATS.map(toOption)

/** Playable against the AI with no team at all. */
export const BSIM_RANDOM_FORMATS: BsimFormatOption[] = formatsFor("random").map(toOption)

/** Need a built or sample team on both sides. */
export const BSIM_TEAM_FORMATS: BsimFormatOption[] = formatsFor("team").map(toOption)

export function isTeamFormat(id: string): boolean {
  return BSIM_TEAM_FORMATS.some((f) => f.value === id)
}

export const BSIM_FORMAT_KEY = "bsim_format"
