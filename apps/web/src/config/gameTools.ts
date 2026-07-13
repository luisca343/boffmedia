import type { LucideIcon } from "lucide-react";
import {
  Gem,
  Wrench,
  Sword,
  Gamepad2,
  Network,
  Trophy,
  Gauge,
  Scale,
  NotebookPen,
  BrickWall,
  Star,
} from "lucide-react";
import { getGameEntry } from "@/data/games";

// ─── Public types (used by sidebar components) ────────────────────────────────

export interface ToolConfig {
  name: string;
  href: string;
  icon: LucideIcon;
  iconProps?: React.SVGProps<SVGSVGElement>;
}

export interface CategoryConfig {
  name: string;
  href?: string;
  tools: ToolConfig[];
}

export interface GameConfig {
  slug: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  categories: CategoryConfig[];
}

export interface GameToolsConfigType {
  [key: string]: GameConfig;
}

// ─── Sidebar icon mapping (lucide-react, sidebar-only concern) ────────────────

export const sidebarIconMap: Record<string, LucideIcon> = {
  Diamond:     Gem,
  Zap:         Wrench,
  SwordIcon:   Sword,
  Gamepad:     Gamepad2,
  Star:        Star,
  FamilyTree:  Network,
  Podium:      Trophy,
  Speedometer: Gauge,
  Scales:      Scale,
  Notebook:    NotebookPen,
  Blocks:      BrickWall,
};

// ─── Adapter: builds GameConfig from the unified game registry ────────────────

function buildGameConfig(slug: string): GameConfig {
  const game = getGameEntry(slug);
  if (!game) throw new Error(`No game entry found for slug: "${slug}"`);

  return {
    slug,
    name: game.nameKey,
    icon: game.icon,
    color: game.color,
    bg: game.bg,
    categories: game.categories.map((cat) => ({
      name: cat.nameKey,
      href: cat.href,
      tools: cat.tools
        .filter((tool) => tool.showInSidebar !== false)
        .map((tool) => ({
          name: tool.nameKey,
          href: tool.href,
          icon: sidebarIconMap[tool.sidebarIcon] ?? Gamepad2,
        })),
    })),
  };
}

export const gameToolsConfig: GameToolsConfigType = {
  pokemon: buildGameConfig("pokemon"),
  mhwilds: buildGameConfig("mhwilds"),
  otros: buildGameConfig("otros"),
  minecraft: buildGameConfig("minecraft"),
};
