"use client";

import { Users, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber, formatDate } from "../../types";

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
  const t = useTranslations("twitch");
  
  // Get banner image or fallback to a color gradient
  const bannerStyle = offlineImageUrl 
    ? { backgroundImage: `url(${offlineImageUrl})` } 
    : { background: 'linear-gradient(90deg, #9146ff 0%, #772ce8 100%)' };

  return (
    <>
      <div className="w-full h-40 md:h-56 bg-cover bg-center" style={bannerStyle}></div>
      
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-surface-800 rounded-xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-800 mb-4 md:mb-0 md:mr-6 bg-surface-700 flex-shrink-0">
              <img
                src={profileImageUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-3xl font-bold mb-2">
                {displayName}
              </h1>
              
              <p className="text-sm text-surface-300 mb-2">
                @{login}
              </p>
              
              {broadcasterType && broadcasterType !== '' && (
                <div className="mb-2">
                  <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {broadcasterType === 'partner' ? 'Twitch Partner' : 
                     broadcasterType === 'affiliate' ? 'Twitch Affiliate' : broadcasterType}
                  </span>
                </div>
              )}
              
              <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mb-4 text-surface-400">
                {followerCount !== undefined && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-purple-500" />
                    <span>{formatNumber(followerCount)} {t("user.followers")}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1 text-purple-500" />
                  <span>{formatNumber(viewCount)} {t("user.views")}</span>
                </div>
              </div>
              
              <p className="text-surface-300 line-clamp-2 md:max-w-2xl">
                {description || t("user.noDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
