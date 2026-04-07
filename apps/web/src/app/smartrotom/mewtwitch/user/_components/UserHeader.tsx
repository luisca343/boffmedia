"use client";

import { BaseProfileHeader } from "@/components/smartrotom/shared/BaseProfileHeader";
import { BaseStats } from "@/components/smartrotom/shared/BaseStats";
import { Users, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber } from "../../types";

interface UserHeaderProps {
  displayName: string;
  login: string;
  profileImageUrl: string;
  offlineImageUrl?: string;
  viewCount: number;
  followerCount?: number;
  description: string;
  createdAt: string;
  broadcasterType: string;
}

export const UserHeader = ({
  displayName,
  login,
  profileImageUrl,
  offlineImageUrl,
  viewCount,
  followerCount,
  description,
  createdAt,
  broadcasterType
}: UserHeaderProps) => {
  const t = useTranslations("common");
  
  const stats = [
    ...(followerCount !== undefined ? [{
      icon: Users,
      label: t("content.followers"),
      value: formatNumber(followerCount)
    }] : []),
    {
      icon: Eye,
      label: t("content.views"),
      value: formatNumber(viewCount)
    }
  ];

  const additionalInfo = broadcasterType && broadcasterType !== '' ? (
    <div className="mb-2">
      <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
        {broadcasterType === 'partner' ? 'Twitch Partner' : 
         broadcasterType === 'affiliate' ? 'Twitch Affiliate' : broadcasterType}
      </span>
    </div>
  ) : null;

  return (
    <BaseProfileHeader
      title={displayName}
      username={login}
      avatarUrl={profileImageUrl}
      bannerUrl={offlineImageUrl}
      description={description || t("content.noDescription")}
      platform="twitch"
      statsComponent={<BaseStats stats={stats} platform="twitch" />}
      additionalInfo={additionalInfo}
    />
  );
};
