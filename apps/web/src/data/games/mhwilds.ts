import { ASSET, staticAsset } from '@/lib/assets';
import type { GameEntry } from "./types";

export const mhwilds: GameEntry = {
  slug: "mhwilds",
  nameKey: "games.mhwilds.name",

  // Sidebar
  icon: staticAsset(ASSET.boffmedia.img, "games/mhwilds/icon.webp"),
  color: "from-warning-hover to-warning",
  bg: "bg-warning-soft",

  // Landing page
  logo: staticAsset(ASSET.boffmedia.img, "games/mhwilds/icon.webp"),
  bannerImage: staticAsset(ASSET.boffmedia.img, "games/mhwilds/banner.webp"),
  navHref: "/mhwilds",

  externalLinks: [
    { key: "officialWebsite", href: "https://www.monsterhunter.com/", desc: "monsterhunter.com" },
    { key: "redditCommunity", href: "https://www.reddit.com/r/MonsterHunter/", desc: "Comunidad de Reddit" },
    { key: "wiki", href: "https://monsterhunter.fandom.com/wiki/Monster_Hunter_Wilds", desc: "Wiki de MH Wilds" },
    { key: "videos", href: "https://www.youtube.com/results?search_query=monster+hunter+wilds", desc: "Guías y gameplay" },
  ],

  categories: [
    {
      key: "tools",
      nameKey: "games.mhwilds.name",
      href: "/mhwilds",
      tools: [
        {
          key: "buildPlanner",
          nameKey: "games.mhwilds.tools.planner",
          href: "/mhwilds/builds/planner",
          sidebarIcon: "sword",
          bleed: true,
          landing: {
            icon: staticAsset(ASSET.boffmedia.img, "games/mhwilds/long-sword.webp"),
            iconSrc: staticAsset(
              ASSET.boffmedia.img,
              "games/mhwilds/long-sword.webp",
            ),
            fallbackIcon: "shield",
            fallbackIconColor: "text-warning-hover",
            color: "from-warning-hover to-emerald-600",
            features: ["optimizer", "calculator", "comparison"],
            featured: true,
            isNew: true,
            popularity: "high",
            heroImage: staticAsset(ASSET.boffmedia.img, "games/mhwilds/gemma.webp"),
          },
        },
        {
          key: "weaponTrees",
          nameKey: "games.mhwilds.tools.weaponTree",
          href: "/mhwilds/tree",
          sidebarIcon: "tree",
          bleed: true,
          landing: {
            icon: staticAsset(ASSET.boffmedia.img, "games/mhwilds/charge-blade.webp"),
            iconSrc: staticAsset(
              ASSET.boffmedia.img,
              "games/mhwilds/charge-blade.webp",
            ),
            fallbackIcon: "sword",
            fallbackIconColor: "text-secondary-hover",
            color: "from-secondary-hover to-indigo-600",
            features: ["trees", "comparison", "stats"],
            featured: false,
            isNew: false,
            popularity: "high",
          },
        },
        {
          key: "armor",
          nameKey: "games.mhwilds.tools.armor",
          href: "/mhwilds/armor",
          sidebarIcon: "shield",
          bleed: true,
          landing: {
            icon: staticAsset(ASSET.boffmedia.img, "games/mhwilds/chest.webp"),
            iconSrc: staticAsset(
              ASSET.boffmedia.img,
              "games/mhwilds/chest.webp",
            ),
            fallbackIcon: "shield",
            fallbackIconColor: "text-warning-hover",
            color: "from-warning-hover to-amber-700",
            features: ["sets", "skills", "defense"],
            featured: false,
            isNew: true,
            popularity: "high",
          },
        },
        {
          key: "materials",
          nameKey: "games.mhwilds.tools.materials",
          href: "/mhwilds/wishlist",
          sidebarIcon: "list",
          bleed: true,
          landing: {
            icon: staticAsset(ASSET.boffmedia.img, "games/mhwilds/icon.webp"),
            fallbackIcon: "list",
            fallbackIconColor: "text-warning-hover",
            color: "from-warning-hover to-emerald-700",
            features: ["tracker", "calculator", "locations"],
            featured: false,
            isNew: true,
            popularity: "medium",
          },
        },
        {
          key: "bestiary",
          nameKey: "games.mhwilds.tools.bestiary",
          href: "/mhwilds/monsters",
          sidebarIcon: "paw",
          bleed: true,
          landing: {
            icon: staticAsset(ASSET.boffmedia.img, "games/mhwilds/icon.webp"),
            fallbackIcon: "paw",
            fallbackIconColor: "text-warning-hover",
            color: "from-warning-hover to-rose-600",
            features: ["weaknesses", "materials", "locations"],
            featured: false,
            isNew: true,
            popularity: "medium",
          },
        },
      ],
    },
  ],
};
