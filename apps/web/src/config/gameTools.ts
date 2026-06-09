import type { IconType } from "react-icons";
import {
  GiDiamondHard,
  GiLightningSpanner,
  GiSwordWound,
  GiGamepad,
  GiFamilyTree,
  GiPodiumWinner,
  GiSpeedometer,
  GiScales,
  GiNotebook,
} from "react-icons/gi";
import { FaStar } from "react-icons/fa";
import { getGameEntry } from "@/data/games";

// ─── Public types (used by sidebar components) ────────────────────────────────

export interface ToolConfig {
  name: string;
  href: string;
  icon: IconType;
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

// ─── Sidebar icon mapping (react-icons, sidebar-only concern) ─────────────────

export const sidebarIconMap: Record<string, IconType> = {
  Diamond:     GiDiamondHard,
  Zap:         GiLightningSpanner,
  SwordIcon:   GiSwordWound,
  Gamepad:     GiGamepad,
  Star:        FaStar,
  FamilyTree:  GiFamilyTree,
  Podium:      GiPodiumWinner,
  Speedometer: GiSpeedometer,
  Scales:      GiScales,
  Notebook:    GiNotebook,
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
          icon: sidebarIconMap[tool.sidebarIcon] ?? GiGamepad,
          iconProps: tool.sidebarIconProps,
        })),
    })),
  };
}

export const gameToolsConfig: GameToolsConfigType = {
  pokemon: buildGameConfig("pokemon"),
  mhwilds: buildGameConfig("mhwilds"),
  otros: buildGameConfig("otros"),
};
