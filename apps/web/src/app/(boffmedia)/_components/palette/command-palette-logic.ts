/** The palette's pure logic, deliberately free of every import that reaches the
 *  environment. `command-palette-utils.ts` owns the data sources (nav table,
 *  tools registry) and hands them here; this file can therefore be unit-tested
 *  without booting Next's validated env, which is what made the first version
 *  of this test file fail to load at all rather than fail an assertion. */

export interface CommandPaletteEntry {
  id: string
  title: string
  description?: string
  href: string
  category: "route" | "tool" | "admin"
  icon?: string
}

/** The admin sections the palette can jump to. Kept here so the "is this
 *  filtered for a non-admin?" test does not need the tools registry. */
export const ADMIN_SECTIONS = [
  { id: "admin-games", labelKey: "games", href: "/admin?section=games", icon: "gamepad" },
  { id: "admin-events", labelKey: "events", href: "/admin?section=events", icon: "calendar" },
  { id: "admin-teams", labelKey: "teams", href: "/admin?section=teams", icon: "users" },
  { id: "admin-achievements", labelKey: "achievements", href: "/admin?section=achievements", icon: "trophy" },
  { id: "admin-tournaments", labelKey: "tournaments", href: "/admin?section=tournaments", icon: "sword" },
  { id: "admin-packs", labelKey: "packs", href: "/admin?section=packs", icon: "cube" },
  { id: "admin-releases", labelKey: "releases", href: "/admin?section=releases", icon: "upload" },
  { id: "admin-security", labelKey: "security", href: "/admin?section=security", icon: "shield" },
  { id: "admin-moderation", labelKey: "moderation", href: "/admin?section=moderation", icon: "shield" },
] as const

export type PaletteRoute = { route: string; labelKey: string }
export type PaletteTool = { key: string; title: string; desc?: string; href: string }

/** Assemble the entry list from data the caller supplies. `isAdmin` gates the
 *  admin section entries: an ordinary user must not even learn those surfaces
 *  exist from the palette. */
export function assembleEntries(input: {
  routes: readonly PaletteRoute[]
  tools: readonly PaletteTool[]
  isAdmin: boolean
  t: (key: string) => string
}): CommandPaletteEntry[] {
  const { routes, tools, isAdmin, t } = input
  const entries: CommandPaletteEntry[] = []

  for (const nav of routes) {
    entries.push({
      id: nav.route,
      title: t(`nav.v3.${nav.labelKey}`),
      href: nav.route,
      category: "route",
    })
  }

  for (const tool of tools) {
    entries.push({
      id: `tool-${tool.key}`,
      title: tool.title,
      description: tool.desc,
      href: tool.href,
      category: "tool",
    })
  }

  if (isAdmin) {
    for (const section of ADMIN_SECTIONS) {
      entries.push({
        id: section.id,
        title: t(`admin.nav.${section.labelKey}`),
        href: section.href,
        category: "admin",
        icon: section.icon,
      })
    }
  }

  return entries
}

/**
 * Fuzzy search: check if query matches title or description.
 * Returns true if all words in query appear in text (case-insensitive).
 */
export function matchesQuery(query: string, entry: CommandPaletteEntry): boolean {
  const q = query.toLowerCase()
  const text = `${entry.title} ${entry.description || ""}`.toLowerCase()
  const words = q.trim().split(/\s+/)
  return words.every((word) => text.includes(word))
}

/**
 * Sort entries by relevance: exact match first, then title prefix match, then all matches.
 */
export function sortEntries(
  query: string,
  entries: CommandPaletteEntry[],
): CommandPaletteEntry[] {
  if (!query.trim()) {
    // No query: sort by category order and then by title
    const categoryOrder = { route: 0, tool: 1, admin: 2 }
    return [...entries].sort((a, b) => {
      const catDiff = categoryOrder[a.category] - categoryOrder[b.category]
      if (catDiff !== 0) return catDiff
      return a.title.localeCompare(b.title)
    })
  }

  const q = query.toLowerCase()
  return [...entries].sort((a, b) => {
    const aTitle = a.title.toLowerCase()
    const bTitle = b.title.toLowerCase()

    // Exact match
    if (aTitle === q && bTitle !== q) return -1
    if (bTitle === q && aTitle !== q) return 1

    // Starts with query
    const aStarts = aTitle.startsWith(q)
    const bStarts = bTitle.startsWith(q)
    if (aStarts && !bStarts) return -1
    if (bStarts && !aStarts) return 1

    // Default: sort by title
    return aTitle.localeCompare(bTitle)
  })
}
