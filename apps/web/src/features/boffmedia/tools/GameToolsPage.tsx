"use client";

import {
  Shield,
  Sword,
  Axe,
  Diamond,
  Zap,
  Database,
  Gift,
  Key,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getGameEntry, getLandingItems } from "@/data/games";
import { ToolsPageLayout } from "./ToolsPageLayout";

const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  Sword,
  Axe,
  Diamond,
  Zap,
  Database,
  Gift,
  Key,
};

interface GameToolsPageProps {
  slug: string;
}

export function GameToolsPage({ slug }: GameToolsPageProps) {
  const t = useTranslations(slug);
  const game = getGameEntry(slug)!;
  const landingItems = getLandingItems(slug);

  const tools = landingItems.map((item) => {
    const IconComponent = ICON_MAP[item.fallbackIcon];
    return {
      title: t(`tools.${item.key}.title`),
      description: t(`tools.${item.key}.description`),
      icon: item.icon,
      iconFallback: IconComponent
        ? <IconComponent className={`h-8 w-8 ${item.fallbackIconColor}`} />
        : null,
      href: item.href,
      color: item.color,
      tools: item.features.map((f) => t(`tools.${item.key}.features.${f}`)),
      featured: item.featured,
      isNew: item.isNew,
      popularity: item.popularity,
      heroImage: item.heroImage,
    };
  });

  const externalLinks = game.externalLinks.map((link) => ({
    href: link.href,
    title: t(`externalLinks.${link.key}`),
    description: "",
  }));

  return (
    <ToolsPageLayout
      title={{
        prefix: t("header.title.prefix"),
        highlight: t("header.title.highlight"),
      }}
      subtitle={t("header.subtitle")}
      logoSrc={game.logo}
      logoAlt={game.nameKey}
      tools={tools}
      externalLinks={externalLinks}
      t={t}
    />
  );
}
