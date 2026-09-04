import { PRIMARY_NAV } from "@/components/boffmedia/ui/navigation/nav-data"
import { buildHubGames } from "@/components/boffmedia/ui/tools/tools-data"
import { USER_ROLES } from "@boffmedia/shared/roles"
import type { IconName } from "@boffmedia/ui"
import { assembleEntries } from "./command-palette-logic"
import type { CommandPaletteEntry as LogicEntry } from "./command-palette-logic"

/** One nominal type for the whole feature. The logic module types `icon` as a
 *  plain string so it can stay free of UI imports; narrowing it here to
 *  `IconName` would make the two modules' entries mutually unassignable, which
 *  is exactly the error that appeared when they were split. Renderers cast at
 *  the point of use instead. */
export type CommandPaletteEntry = LogicEntry
export type { IconName }

export { matchesQuery, sortEntries } from "./command-palette-logic"

type T = (key: string) => string

/**
 * Build command palette entries from routes, the tools registry, and admin
 * sections. The tools come from `buildHubGames` rather than a hand-written
 * list, so a tool added to the registry appears in the palette the same day.
 * Admin entries are filtered to BOFF_ADMIN.
 *
 * The assembly itself lives in `command-palette-logic.ts` (no env-reaching
 * imports) so it can actually be unit-tested.
 */
export function buildCommandPaletteEntries(
  t: T,
  roles?: readonly string[],
): CommandPaletteEntry[] {
  const tools = buildHubGames(t, roles).flatMap((game) =>
    game.tools.map((tool) => ({
      key: tool.key,
      title: tool.title,
      desc: tool.desc,
      href: tool.href,
    })),
  )

  return assembleEntries({
    routes: PRIMARY_NAV,
    tools,
    isAdmin: roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false,
    t,
  })
}
