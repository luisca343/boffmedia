"use client";

import { ToolsPageLayout } from "@/components/boffmedia/tools-page/ToolsPageLayout";
import { Sword, Shield, Hammer, Axe } from "lucide-react";
import { useTranslations } from "next-intl";

export default function MHWildsPage() {
  const t = useTranslations("mhwilds");

  const mhWildsTools = [
    {
      title: t("tools.buildPlanner.title"),
      description: t("tools.buildPlanner.description"),
      icon: "/img/games/mhwilds/long-sword.webp",
      iconFallback: <Shield className="h-8 w-8 text-green-400" />,
      href: "/mhwilds/builds/planner",
      color: "from-green-400 to-emerald-600",
      tools: [t("tools.buildPlanner.features.optimizer"), t("tools.buildPlanner.features.calculator"), t("tools.buildPlanner.features.comparison")],
      featured: true,
      isNew: true,
      popularity: "high",
      heroImage: "/img/games/mhwilds/gemma.webp"
    },
    {
      title: t("tools.weaponTrees.title"),
      description: t("tools.weaponTrees.description"),
      icon: "/img/games/mhwilds/charge-blade.webp",
      iconFallback: <Sword className="h-8 w-8 text-blue-400" />,
      href: "/mhwilds/tree",
      color: "from-blue-400 to-indigo-600",
      tools: [t("tools.weaponTrees.features.trees"), t("tools.weaponTrees.features.comparison"), t("tools.weaponTrees.features.stats")],
      featured: false,
      isNew: false,
      popularity: "high"
    },
    {
      title: t("tools.bestiary.title"),
      description: t("tools.bestiary.description"),
      icon: "/img/games/mhwilds/hammer.webp",
      iconFallback: <Axe className="h-8 w-8 text-red-500" />,
      href: "/mhwilds/monsters",
      color: "from-red-500 to-rose-600",
      tools: [t("tools.bestiary.features.weaknesses"), t("tools.bestiary.features.materials"), t("tools.bestiary.features.locations")],
      featured: false,
      isNew: false,
      popularity: "medium"
    }
  ];

  const externalLinks = [
    { 
      href: "https://www.monsterhunter.com/", 
      title: t("externalLinks.officialWebsite"),
      description: "Web oficial de Monster Hunter"
    },
    { 
      href: "https://www.reddit.com/r/MonsterHunter/", 
      title: t("externalLinks.redditCommunity"),
      description: "Comunidad de Reddit"
    },
    { 
      href: "https://monsterhunter.fandom.com/wiki/Monster_Hunter_Wilds", 
      title: t("externalLinks.wiki"),
      description: "Wiki de Monster Hunter"
    },
    { 
      href: "https://www.youtube.com/results?search_query=monster+hunter+wilds", 
      title: t("externalLinks.videos"),
      description: "Guías y gameplay"
    }
  ];

  return (
    <ToolsPageLayout
      title={{
        prefix: t("header.title.prefix"),
        highlight: t("header.title.highlight")
      }}
      subtitle={t("header.subtitle")}
      logoSrc="/img/games/mhwilds/icon.webp"
      logoAlt="Monster Hunter Wilds"
      tools={mhWildsTools}
      externalLinks={externalLinks}
      t={t}
    />
  );
}