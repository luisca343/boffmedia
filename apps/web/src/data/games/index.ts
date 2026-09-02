import { pokemon } from "./pokemon";
import { mhwilds } from "./mhwilds";
import { otros } from "./otros";
import { minecraft } from "./minecraft";
import type { GameEntry, LandingCardConfig, ToolEntry } from "./types";

export type { GameEntry, ToolEntry, CategoryEntry, LandingCardConfig, ExternalLinkEntry } from "./types";

const registry: Record<string, GameEntry> = { pokemon, mhwilds, otros, minecraft };

export function getGameEntry(slug: string): GameEntry | undefined {
  return registry[slug];
}

/**
 * The tools a viewer holding `roles` should be SHOWN — see
 * `ToolEntry.requiredRoles`.
 *
 * Note the default: with no roles (signed out, or a session still loading) a
 * role-gated tool is hidden. Every listing in this app resolves roles from a
 * hook that starts undefined, so the alternative would flash an admin card at
 * everyone for a frame — and "I do not know who this is" reads as "not them".
 */
export function toolsVisibleTo(
  tools: ToolEntry[],
  roles: readonly string[] | undefined,
): ToolEntry[] {
  return tools.filter(
    (tool) =>
      !tool.requiredRoles?.length ||
      tool.requiredRoles.some((role) => roles?.includes(role)),
  );
}

/**
 * Resolve a tool/category `href` from the registry by (hub slug, key) so callers
 * never hand-write tool routes. Returns "" if the slug/key is unknown —
 * prefer a compile-time-known key so a bad reference surfaces as a dead link.
 */
export function getToolHref(slug: string, key: string): string {
  const game = registry[slug];
  if (!game) return "";
  for (const category of game.categories) {
    if (category.key === key) return category.href ?? "";
    for (const tool of category.tools) {
      if (tool.key === key) return tool.href;
    }
  }
  return "";
}

/** The landing cards for a hub. `roles` filters role-gated tools out — see
 *  {@link toolsVisibleTo}; omitting it hides them, which is the safe default. */
export function getLandingItems(
  slug: string,
  roles?: readonly string[],
): Array<LandingCardConfig & { key: string; href: string }> {
  const game = registry[slug];
  if (!game) return [];

  const items: Array<LandingCardConfig & { key: string; href: string }> = [];

  for (const category of game.categories) {
    if (category.landing) {
      items.push({ key: category.key, href: category.href ?? "", ...category.landing });
    }
    for (const tool of toolsVisibleTo(category.tools, roles)) {
      if (tool.landing) {
        items.push({ key: tool.key, href: tool.href, ...tool.landing });
      }
    }
  }

  return items;
}
