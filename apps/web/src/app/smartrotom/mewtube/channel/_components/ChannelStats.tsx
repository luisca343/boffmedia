"use client";

import { useTranslations } from "next-intl";

interface ChannelStatsProps {
  joinDate: string;
  viewCount: string;
  videoCount: string;
  subscriberCount: string;
  formatDate: (date: string) => string;
}

export const ChannelStats = ({
  joinDate,
  viewCount,
  videoCount,
  subscriberCount,
  formatDate
}: ChannelStatsProps) => {
  const t = useTranslations("youtube");
  
  return (
    <div className="bg-surface-700 p-5 rounded-lg">
      <h3 className="text-xl font-medium mb-4">{t("channel.stats")}</h3>
      <div className="space-y-4">
        <div>
          <p className="text-surface-400 text-sm">{t("channel.joined")}</p>
          <p className="font-medium">{formatDate(joinDate)}</p>
        </div>
        <div>
          <p className="text-surface-400 text-sm">{t("channel.totalViews")}</p>
          <p className="font-medium">{parseInt(viewCount).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-surface-400 text-sm">{t("channel.totalVideos")}</p>
          <p className="font-medium">{parseInt(videoCount).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-surface-400 text-sm">{t("channel.subscribers_stats")}</p>
          <p className="font-medium">{parseInt(subscriberCount).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};