import type { GameEntry } from "./types";

export const mhwilds: GameEntry = {
  slug: "mhwilds",
  nameKey: "games.mhwilds.name",

  // Sidebar
  icon: "/img/games/mhwilds/icon.webp",
  color: "from-highlight-400 to-highlight-600",
  bg: "bg-highlight-900",

  // Landing page
  logo: "/img/games/mhwilds/icon.webp",
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
          sidebarIcon: "SwordIcon",
          landing: {
            icon: "/img/games/mhwilds/long-sword.webp",
            fallbackIcon: "Shield",
            fallbackIconColor: "text-highlight-400",
            color: "from-highlight-400 to-emerald-600",
            features: ["optimizer", "calculator", "comparison"],
            featured: true,
            isNew: true,
            popularity: "high",
            heroImage: "/img/games/mhwilds/gemma.webp",
          },
        },
        {
          key: "weaponTrees",
          nameKey: "games.mhwilds.tools.weaponTree",
          href: "/mhwilds/tree",
          sidebarIcon: "FamilyTree",
          sidebarIconProps: { style: { transform: "rotate(90deg)" } },
          landing: {
            icon: "/img/games/mhwilds/charge-blade.webp",
            fallbackIcon: "Sword",
            fallbackIconColor: "text-secondary-400",
            color: "from-secondary-400 to-indigo-600",
            features: ["trees", "comparison", "stats"],
            featured: false,
            isNew: false,
            popularity: "high",
          },
        },
        {
          key: "bestiary",
          nameKey: "games.mhwilds.tools.bestiary",
          href: "/mhwilds/monsters",
          sidebarIcon: "SwordIcon",
          showInSidebar: false,
          landing: {
            icon: "/img/games/mhwilds/hammer.webp",
            fallbackIcon: "Axe",
            fallbackIconColor: "text-red-500",
            color: "from-red-500 to-rose-600",
            features: ["weaknesses", "materials", "locations"],
            featured: false,
            isNew: false,
            popularity: "medium",
          },
        },
      ],
    },
  ],
};
