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
  name: string; // This will be a translation key
  href: string;
  icon: IconType;
  iconProps?: React.SVGProps<SVGSVGElement>;
}

export interface CategoryConfig {
  name: string; // This will be a translation key
  href?: string;
  tools: ToolConfig[];
}

export interface GameConfig {
  name: string; // This will be a translation key
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

// The base config now uses translation keys instead of hard-coded strings
const baseConfig: Record<string, Omit<GameConfig, 'categories'> & {
  categories: Array<{
    name: string;
    href?: string;
    tools: Array<{
      name: string;
      href: string;
      icon: string;
      iconProps?: React.SVGProps<SVGSVGElement>;
    }>;
  }>;
}> = {
  "pokemon": {
    name: "games.pokemon.name",
    icon: "/img/games/pokemon/icon.webp",
    color: "from-yellow-400 to-red-500",
    bg: "bg-red-900",
    categories: [
      {
        name: "games.pokemon.categories.tcgpocket",
        href: "/pokemon/tcgpocket",
        tools: [
          { name: "games.pokemon.tools.gallery", href: "/pokemon/tcgpocket/galeria", icon: "Diamond" },
          { name: "games.pokemon.tools.cardList", href: "/pokemon/tcgpocket/cartas", icon: "Zap" },
          { name: "games.pokemon.tools.battles", href: "/pokemon/tcgpocket/combates", icon: "SwordIcon" }
        ]
      },
      {
        name: "games.pokemon.categories.others",
        href: "/pokemon/pmdsky",
        tools: [
          { name: "games.pokemon.tools.skyGenerator", href: "/pokemon/pmdsky", icon: "Star" }
        ]
      }
    ]
  },
  "mhwilds": {
    name: "games.mhwilds.name",
    icon: "/img/games/mhwilds-icon.webp",
    color: "from-highlight-400 to-highlight-600",
    bg: "bg-highlight-900",
    categories: [
      {
        name: "games.mhwilds.name",
        href: "/mhwilds",
        tools: [
          { name: "games.mhwilds.tools.planner", href: "/mhwilds/builds/planner", icon: "SwordIcon" },
          { 
            name: "games.mhwilds.tools.weaponTree", 
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