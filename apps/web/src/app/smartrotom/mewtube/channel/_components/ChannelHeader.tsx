"use client";

import { BaseProfileHeader } from "@/components/smartrotom/shared/BaseProfileHeader";
import { BaseStats } from "@/components/smartrotom/shared/BaseStats";
import { Users, PlaySquare, Eye } from "lucide-react";
import { useTranslations } from "next-intl";

interface ChannelHeaderProps {
  title: string;
  thumbnailUrl: string;
  bannerUrl?: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  customUrl?: string;
  description: string;
  formatNumber: (num: string) => string;
}

export const ChannelHeader = ({
  title,
  thumbnailUrl,
  bannerUrl,
  subscriberCount,
  videoCount,
  viewCount,
  customUrl,
  description,
  formatNumber
}: ChannelHeaderProps) => {
  const t = useTranslations("common");
  
  const stats = [
    {
      icon: Users,
      label: t("content.subscribers"),
      value: formatNumber(subscriberCount)
    },
    {
      icon: PlaySquare,
      label: t("content.videos"),
      value: formatNumber(videoCount)
    },
    {
      icon: Eye,
      label: t("content.views"),
      value: formatNumber(viewCount)
    }
  ];

  return (
    <BaseProfileHeader
      title={title}
      username={customUrl}
      avatarUrl={thumbnailUrl}
      bannerUrl={bannerUrl}
      description={description}
      platform="youtube"
      statsComponent={<BaseStats stats={stats} platform="youtube" />}
    />
  );
};