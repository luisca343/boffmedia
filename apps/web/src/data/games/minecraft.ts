import { ASSET, staticAsset } from '@/lib/assets';
import type { GameEntry } from "./types";

export const minecraft: GameEntry = {
  slug: "minecraft",
  nameKey: "games.minecraft.name",

  icon: staticAsset(ASSET.boffmedia.img, "games/minecraft/icon.webp"),
  color: "from-green-700 to-emerald-500",
  bg: "bg-green-950",

  logo: staticAsset(ASSET.boffmedia.img, "games/minecraft/logo.webp"),
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
            icon: staticAsset(ASSET.boffmedia.img, "games/minecraft/schematic-icon.webp"),
            fallbackIcon: "grid",
            fallbackIconColor: "text-green-500",
            color: "from-green-700 to-emerald-500",
            features: ["converter", "preview3d", "modSupport"],
            featured: true,
            isNew: true,
            popularity: "high",
          },
        },
        {
          key: "seedFinder",
          nameKey: "games.minecraft.tools.seedFinder",
          href: "/minecraft/seeds",
          sidebarIcon: "grid",
          // `bleed` removes the shell's content padding. This tool declares
          // `layout: "viewport"` and sizes itself to `100dvh - --nav-h`; with the
          // shell's 30px top and 90px bottom padding on top of that, the page
          // scrolled by exactly the padding and the map never fit the screen.
          bleed: true,
          landing: {
            icon: staticAsset(ASSET.boffmedia.img, "games/minecraft/schematic-icon.webp"),
            fallbackIcon: "grid",
            fallbackIconColor: "text-sky-400",
            color: "from-sky-700 to-cyan-500",
            features: ["biomeMap", "datapacks", "spawn"],
            isNew: true,
            popularity: "medium",
          },
        },
        {
          key: "schematicViewer",
          nameKey: "games.minecraft.tools.schematicViewer",
          href: "/minecraft/schematic-viewer",
          sidebarIcon: "cube",
          bleed: true,
          landing: {
            icon: staticAsset(ASSET.boffmedia.img, "games/minecraft/schematic-icon.webp"),
            fallbackIcon: "cube",
            fallbackIconColor: "text-emerald-400",
            color: "from-emerald-700 to-teal-500",
            features: ["viewer3d", "layers", "versions"],
            isNew: true,
            popularity: "medium",
          },
        },
      ],
    },
  ],
};
