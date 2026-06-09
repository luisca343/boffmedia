import { pokemon } from "./pokemon";
import { mhwilds } from "./mhwilds";
import { otros } from "./otros";
import type { GameEntry, LandingCardConfig } from "./types";

export type { GameEntry, ToolEntry, CategoryEntry, LandingCardConfig, ExternalLinkEntry } from "./types";

const registry: Record<string, GameEntry> = { pokemon, mhwilds, otros };

export function getGameEntry(slug: string): GameEntry | undefined {
  return registry[slug];
}

/**
 * Returns all items that should appear as landing page cards, in config order.
 * - If a category has a `landing` config, it contributes a card (key = category.key).
 * - If an individual tool has a `landing` config, it contributes a card (key = tool.key).
 */
export function getLandingItems(slug: string): Array<LandingCardConfig & { key: string; href: string }> {
  const game = registry[slug];
  if (!game) return [];

  const items: Array<LandingCardConfig & { key: string; href: string }> = [];

  for (const category of game.categories) {
    if (category.landing) {
      items.push({ key: category.key, href: category.href ?? "", ...category.landing });
    }
    for (const tool of category.tools) {
      if (tool.landing) {
        items.push({ key: tool.key, href: tool.href, ...tool.landing });
      }
    }
  }

  return items;
}
