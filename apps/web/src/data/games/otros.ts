import type { GameEntry } from "./types";

export const otros: GameEntry = {
  slug: "otros",
  nameKey: "games.otros.name",

  icon: "",
  color: "from-accent-400 to-indigo-600",
  bg: "bg-indigo-900",

  logo: "",
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
          sidebarIcon: "Star",
          landing: {
            icon: "",
            fallbackIcon: "Gift",
            fallbackIconColor: "text-accent-400",
            color: "from-accent-400 to-indigo-600",
            features: ["raffles", "tickets", "results"],
            featured: true,
            popularity: "high",
          },
        },
        {
          key: "keys",
          nameKey: "games.otros.tools.keys",
          href: "/otros/keys",
          sidebarIcon: "Gamepad",
          landing: {
            icon: "",
            fallbackIcon: "Key",
            fallbackIconColor: "text-secondary-400",
            color: "from-secondary-400 to-cyan-600",
            features: ["library", "validator", "history"],
            featured: false,
            popularity: "medium",
          },
        },
      ],
    },
  ],
};
