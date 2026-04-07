"use client";

import { BaseDetails } from "@/components/smartrotom/shared/BaseDetails";
import { BaseStats } from "@/components/smartrotom/shared/BaseStats";
import { Eye, Clock, Calendar, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber, formatDate } from "../../types";

interface VideoDetailsProps {
  title: string;
  description: string;
  streamerName: string;
  streamerId: string;
  viewCount: number;
  duration: string;
  publishedAt: string;
  language: string;
}

export const VideoDetails = ({
  title,
  description,
  streamerName,
  streamerId,
  viewCount,
  duration,
  publishedAt,
  language
}: VideoDetailsProps) => {
  const t = useTranslations("common");
  
  const stats = [
    {
      icon: Eye,
      label: t("content.views"),
      value: formatNumber(viewCount)
    },
    {
      icon: Clock,
      label: t("content.duration"),
      value: duration
    },
    {
      icon: Calendar,
      label: t("content.publishedAt"),
      value: formatDate(publishedAt)
    },
    {
      icon: Globe,
      label: "Language",
      value: language.toUpperCase()
    }
  ];

  return (
    <BaseDetails
      title={title}
      creatorName={streamerName}
      creatorId={streamerId}
      platform="twitch"
      description={description}
      statsComponent={<BaseStats stats={stats} platform="twitch" />}
    />
  );
};
