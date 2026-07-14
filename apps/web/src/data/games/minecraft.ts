import type { GameEntry } from "./types";

export const minecraft: GameEntry = {
  slug: "minecraft",
  nameKey: "games.minecraft.name",

  icon: "/assets/img/games/minecraft/icon.webp",
  color: "from-green-700 to-emerald-500",
  bg: "bg-green-950",

  logo: "/assets/img/games/minecraft/logo.webp",
  navHref: "/minecraft",

  externalLinks: [],

  categories: [
    {
      key: "tools",
      nameKey: "games.minecraft.categories.tools",
      tools: [
        {
          key: "schematicCompat",
          nameKey: "games.minecraft.tools.schematicCompat",
          href: "/minecraft/schematic-compat",
          sidebarIcon: "grid",
          bleed: true,
          landing: {
            icon: "/assets/img/games/minecraft/schematic-icon.webp",
            fallbackIcon: "grid",
            fallbackIconColor: "text-green-500",
            color: "from-green-700 to-emerald-500",
            features: ["converter", "preview3d", "modSupport"],
            featured: true,
            isNew: true,
            popularity: "high",
          },
        },
      ],
    },
  ],
};
