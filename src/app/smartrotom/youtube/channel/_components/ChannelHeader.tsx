"use client";

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
  const t = useTranslations("youtube");
  
  // Get banner image or fallback to a color gradient
  const bannerStyle = bannerUrl 
    ? { backgroundImage: `url(${bannerUrl})` } 
    : { background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)' };

  return (
    <>
      <div className="w-full h-40 md:h-56 bg-cover bg-center" style={bannerStyle}></div>
      
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-surface-800 rounded-xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-800 mb-4 md:mb-0 md:mr-6 bg-surface-700 flex-shrink-0">
              <img
                src={thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-3xl font-bold mb-2">
                {title}
              </h1>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mb-4 text-surface-400">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-red-500" />
                  <span>{formatNumber(subscriberCount)} {t("channel.subscribers")}</span>
                </div>
                <div className="flex items-center">
                  <PlaySquare className="h-4 w-4 mr-1 text-red-500" />
                  <span>{formatNumber(videoCount)} {t("channel.videos")}</span>
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1 text-red-500" />
                  <span>{formatNumber(viewCount)} {t("channel.views")}</span>
                </div>
              </div>
              
              {customUrl && (
                <p className="text-sm text-surface-300 mb-2">
                  @{customUrl}
                </p>
              )}
              
              <p className="text-surface-300 line-clamp-2 md:max-w-2xl">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};