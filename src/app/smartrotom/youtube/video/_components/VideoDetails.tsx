"use client";

import { User } from "lucide-react";
import { InternalLink } from "@/components/nav/Link";
import { VideoStats } from "./VideoStats";
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
  const t = useTranslations("youtube");
  
  return (
    <div className="bg-surface-800 rounded-lg p-6 shadow-lg">
      <h1 className="text-2xl font-bold mb-3">{title}</h1>
      
      <VideoStats
        viewCount={viewCount}
        likeCount={likeCount}
        publishedAt={publishedAt}
        formatNumber={formatNumber}
        formatDate={formatDate}
      />
      
      <div className="mb-6">
        <InternalLink 
          href={`/youtube/channel/${channelId}`}
          className="flex items-center text-lg font-medium hover:text-red-500 transition-colors"
        >
          <User className="h-5 w-5 mr-2 text-red-500" />
          {channelTitle}
        </InternalLink>
      </div>
      
      <div className="bg-surface-700 rounded p-4">
        <h3 className="text-lg font-medium mb-2">{t("video.description")}</h3>
        <p className="text-surface-300 whitespace-pre-line">{description}</p>
      </div>
    </div>
  );
};