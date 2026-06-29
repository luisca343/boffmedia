import { pokemon } from "./pokemon";
import { mhwilds } from "./mhwilds";
import { otros } from "./otros";
import { minecraft } from "./minecraft";
import type { GameEntry, LandingCardConfig } from "./types";

export type { GameEntry, ToolEntry, CategoryEntry, LandingCardConfig, ExternalLinkEntry } from "./types";

const registry: Record<string, GameEntry> = { pokemon, mhwilds, otros, minecraft };

export function getGameEntry(slug: string): GameEntry | undefined {
  return registry[slug];
}

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
