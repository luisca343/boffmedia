"use client";

import { ThumbsUp, Eye, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

interface VideoStatsProps {
  viewCount: string;
  likeCount: string;
  publishedAt: string;
  formatNumber: (num: string) => string;
  formatDate: (date: string) => string;
}

export const VideoStats = ({
  viewCount,
  likeCount,
  publishedAt,
  formatNumber,
  formatDate
}: VideoStatsProps) => {
  const t = useTranslations("youtube");
  
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 text-ink">
      <div className="flex items-center">
        <Eye className="h-4 w-4 mr-1" />
        <span>{formatNumber(viewCount)} {t("video.views")}</span>
      </div>
      <div className="flex items-center">
        <ThumbsUp className="h-4 w-4 mr-1" />
        <span>{formatNumber(likeCount)} {t("video.likes")}</span>
      </div>
      <div className="flex items-center">
        <Calendar className="h-4 w-4 mr-1" />
        <span>{formatDate(publishedAt)}</span>
      </div>
    </div>
  );
};