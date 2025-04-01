import { IconType } from "react-icons";
import { 
  GiDiamondHard, 
  GiLightningSpanner,
  GiSwordWound,
  GiGamepad,
  GiFamilyTree
} from "react-icons/gi";
import { FaStar } from "react-icons/fa";

export interface ToolConfig {
  name: string;
  href: string;
  icon: IconType;
  iconProps?: React.SVGProps<SVGSVGElement>;
}

export interface CategoryConfig {
  name: string;
  tools: ToolConfig[];
}

export interface GameConfig {
  name: string;
  icon: string;
  color: string;
  bg: string;
  categories: CategoryConfig[];
}

export interface GameToolsConfigType {
  [key: string]: GameConfig;
}

const iconMap: Record<string, IconType> = {
  "Diamond": GiDiamondHard,
  "Zap": GiLightningSpanner,
  "SwordIcon": GiSwordWound,
  "Gamepad": GiGamepad,
  "Star": FaStar,
  "FamilyTree": GiFamilyTree
};

const baseConfig: Record<string, Omit<GameConfig, 'categories'> & {
  categories: Array<{
    name: string;
    tools: Array<{
      name: string;
      href: string;
      icon: string;
      iconProps?: React.SVGProps<SVGSVGElement>;
    }>;
  }>;
}> = {
  "pokemon": {
    name: "Pokémon",
    icon: "/img/games/pokemon/icon.webp",
    color: "from-yellow-400 to-red-500",
    bg: "bg-red-900",
    categories: [
      {
        name: "TCG Pocket",
        tools: [
          { name: "Gallery", href: "/pokemon/tcgpocket/galeria", icon: "Diamond" },
          { name: "Card List", href: "/pokemon/tcgpocket/cartas", icon: "Zap" },
          { name: "Battles", href: "/pokemon/tcgpocket/combates", icon: "SwordIcon" }
        ]
      },
      {
        name: "Others",
        tools: [
          { name: "Sky Generator", href: "/pokemon/pmdsky", icon: "Star" }
        ]
      }
    ]
  },
  "mhwilds": {
    name: "Monster Hunter Wilds",
    icon: "/img/games/mhwilds-icon.webp",
    color: "from-green-400 to-green-600",
    bg: "bg-green-900",
    categories: [
      {
        name: "Build Planner",
        tools: [
          { name: "Planner", href: "/mhwilds/builds/planner", icon: "SwordIcon" },
          { 
            name: "Weapon Tree", 
            href: "/mhwilds/tree", 
            icon: "FamilyTree",
            iconProps: { 
              style: { transform: 'rotate(90deg)' } 
            }
          }
        ]
      }
    ]
  }
};

export const gameToolsConfig: GameToolsConfigType = Object.entries(baseConfig).reduce(
  (acc, [key, game]) => {
    acc[key] = {
      ...game,
      categories: game.categories.map(category => ({
        ...category,
        tools: category.tools.map(tool => ({
          ...tool,
          icon: iconMap[tool.icon as keyof typeof iconMap] || GiGamepad,
          iconProps: tool.iconProps
        }))
      }))
    };
    return acc;
  },
  {} as GameToolsConfigType
);