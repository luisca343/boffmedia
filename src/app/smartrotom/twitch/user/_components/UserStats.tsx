"use client";

import { useTranslations } from "next-intl";
import { formatDate } from "../../types";

interface UserStatsProps {
  createdAt: string;
  viewCount: number;
  followerCount?: number;
}

export const UserStats = ({
  createdAt,
  viewCount,
  followerCount
}: UserStatsProps) => {
  const t = useTranslations("twitch");
  
  return (
    <div className="bg-surface-700 p-5 rounded-lg">
      <h3 className="text-xl font-medium mb-4">{t("user.stats")}</h3>
      <div className="space-y-4">
        <div>
          <p className="text-surface-400 text-sm">{t("user.joined")}</p>
          <p className="font-medium">{formatDate(createdAt)}</p>
        </div>
        <div>
          <p className="text-surface-400 text-sm">{t("user.totalViews")}</p>
          <p className="font-medium">{viewCount.toLocaleString()}</p>
        </div>
        {followerCount !== undefined && (
          <div>
            <p className="text-surface-400 text-sm">{t("user.followers")}</p>
            <p className="font-medium">{followerCount.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};
