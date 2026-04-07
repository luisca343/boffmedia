"use client";

import { BaseDetails } from "@/components/smartrotom/shared/BaseDetails";
import { BaseStats } from "@/components/smartrotom/shared/BaseStats";
import { Eye, ThumbsUp, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

interface VideoDetailsProps {
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  formatNumber: (num: string) => string;
  formatDate: (date: string) => string;
}

export const VideoDetails = ({
  title,
  description,
  channelId,
  channelTitle,
  publishedAt,
  viewCount,
  likeCount,
  formatNumber,
  formatDate
}: VideoDetailsProps) => {
  const t = useTranslations("common");
  
  const stats = [
    {
      icon: Eye,
      label: t("content.views"),
      value: formatNumber(viewCount)
    },
    {
      icon: ThumbsUp,
      label: t("content.likes"),
      value: formatNumber(likeCount)
    },
    {
      icon: Calendar,
      label: t("content.publishedAt"),
      value: formatDate(publishedAt)
    }
  ];

  return (
    <BaseDetails
      title={title}
      creatorName={channelTitle}
      creatorId={channelId}
      platform="youtube"
      description={description}
      statsComponent={<BaseStats stats={stats} platform="youtube" />}
    />
  );
};