"use client";

import { ToolsPageLayout } from "@/components/boffmedia/tools/ToolsPageLayout";
import { Sword, Shield, Hammer, Axe } from "lucide-react";
import { useTranslations } from "next-intl";

export default function MHWildsPage() {
  const t = useTranslations(""); // global translations (ui, games)
  const tg = useTranslations("mhwilds"); // game-specific translations

  const mhWildsTools = [
    {
      title: tg("tools.buildPlanner.title"),
      description: tg("tools.buildPlanner.description"),
      icon: "/img/games/mhwilds/long-sword.webp",
      iconFallback: <Shield className="h-8 w-8 text-highlight-400" />,
      href: "/mhwilds/builds/planner",
      color: "from-highlight-400 to-emerald-600",
      tools: [tg("tools.buildPlanner.features.optimizer"), tg("tools.buildPlanner.features.calculator"), tg("tools.buildPlanner.features.comparison")],
      featured: true,
      isNew: true,
      popularity: "high",
      heroImage: "/img/games/mhwilds/gemma.webp"
    },
    {
      title: tg("tools.weaponTrees.title"),
      description: tg("tools.weaponTrees.description"),
      icon: "/img/games/mhwilds/charge-blade.webp",
      iconFallback: <Sword className="h-8 w-8 text-secondary-400" />,
      href: "/mhwilds/tree",
      color: "from-secondary-400 to-indigo-600",
      tools: [tg("tools.weaponTrees.features.trees"), tg("tools.weaponTrees.features.comparison"), tg("tools.weaponTrees.features.stats")],
      featured: false,
      isNew: false,
      popularity: "high"
    },
    {
      title: tg("tools.bestiary.title"),
      description: tg("tools.bestiary.description"),
      icon: "/img/games/mhwilds/hammer.webp",
      iconFallback: <Axe className="h-8 w-8 text-red-500" />,
      href: "/mhwilds/monsters",
      color: "from-red-500 to-rose-600",
      tools: [tg("tools.bestiary.features.weaknesses"), tg("tools.bestiary.features.materials"), tg("tools.bestiary.features.locations")],
      featured: false,
      isNew: false,
      popularity: "medium"
    }
  ];

  const externalLinks = [
    { 
      href: "https://www.monsterhunter.com/", 
      title: tg("externalLinks.officialWebsite"),
      description: "Web oficial de Monster Hunter"
    },
    { 
      href: "https://www.reddit.com/r/MonsterHunter/", 
      title: tg("externalLinks.redditCommunity"),
      description: "Comunidad de Reddit"
    },
    { 
      href: "https://monsterhunter.fandom.com/wiki/Monster_Hunter_Wilds", 
      title: tg("externalLinks.wiki"),
      description: "Wiki de Monster Hunter"
    },
    { 
      href: "https://www.youtube.com/results?search_query=monster+hunter+wilds", 
      title: tg("externalLinks.videos"),
      description: "Guías y gameplay"
    }
  ];

  return (
    <ToolsPageLayout
      title={{
        prefix: tg("header.title.prefix"),
        highlight: tg("header.title.highlight")
      }}
      subtitle={tg("header.subtitle")}
      logoSrc="/img/games/mhwilds/icon.webp"
      logoAlt="Monster Hunter Wilds"
      tools={mhWildsTools}
      externalLinks={externalLinks}
      t={t}
    />
  );
}