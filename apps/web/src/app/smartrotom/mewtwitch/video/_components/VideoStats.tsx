"use client";

import { Eye, Clock, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber, formatDate, formatDuration } from "../../types";

interface VideoStatsProps {
  viewCount: number;
  duration: string;
  publishedAt: string;
  language: string;
}

export const VideoStats = ({
  viewCount,
  duration,
  publishedAt,
  language
}: VideoStatsProps) => {
  const t = useTranslations("twitch");
  
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 text-ink">
      <div className="flex items-center">
        <Eye className="h-4 w-4 mr-1" />
        <span>{formatNumber(viewCount)} {t("video.views")}</span>
      </div>
      
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-1" />
        <span>{t("video.duration")}: {formatDuration(duration)}</span>
      </div>
      
      <div className="flex items-center">
        <Calendar className="h-4 w-4 mr-1" />
        <span>{t("video.publishedAt")}: {formatDate(publishedAt)}</span>
      </div>
      
      <div className="flex items-center">
        <span className="text-ink-muted">Language:</span>
        <span className="ml-1">{language.toUpperCase()}</span>
      </div>
    </div>
  );
};
