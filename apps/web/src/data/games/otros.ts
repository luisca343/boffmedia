import type { GameEntry } from "./types";

export const otros: GameEntry = {
  slug: "otros",
  nameKey: "games.otros.name",

  icon: "",
  color: "from-secondary-hover to-indigo-600",
  bg: "bg-indigo-900",

  logo: "",
  bannerImage: "/img/games/otros/banner.webp",
  navHref: "/otros",

  externalLinks: [
    { key: "steamCommunity", href: "https://steamcommunity.com/", desc: "steamcommunity.com" },
    { key: "humbleBundle", href: "https://www.humblebundle.com/", desc: "humblebundle.com" },
    { key: "boffmediaGuides", href: "https://boffmedia.com/guias", desc: "Guías y tutoriales" },
  ],

  categories: [
    {
      key: "all",
      nameKey: "games.otros.categories.all",
      href: "/otros",
      tools: [
        {
          key: "sorteos",
          nameKey: "games.otros.tools.sorteos",
          href: "/otros/sorteos",
          sidebarIcon: "star",
          landing: {
            icon: "",
            fallbackIcon: "gift",
            fallbackIconColor: "text-secondary-hover",
            color: "from-secondary-hover to-indigo-600",
            features: ["raffles", "tickets", "results"],
            featured: true,
            popularity: "high",
          },
        },
        {
          key: "keys",
          nameKey: "games.otros.tools.keys",
          href: "/otros/keys",
          sidebarIcon: "gamepad",
          landing: {
            icon: "",
            fallbackIcon: "key",
            fallbackIconColor: "text-secondary-hover",
            color: "from-secondary-hover to-cyan-600",
            features: ["library", "validator", "history"],
            featured: false,
            popularity: "medium",
          },
        },
      ],
    },
  ],
};
