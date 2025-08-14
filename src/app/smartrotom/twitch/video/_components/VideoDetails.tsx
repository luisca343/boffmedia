"use client";

import { User } from "lucide-react";
import { InternalLink } from "@/components/nav/Link";
import { VideoStats } from "./VideoStats";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("twitch");
  
  return (
    <div className="bg-surface-800 rounded-lg p-6 shadow-lg">
      <h1 className="text-2xl font-bold mb-3">{title}</h1>
      
      <VideoStats
        viewCount={viewCount}
        duration={duration}
        publishedAt={publishedAt}
        language={language}
      />
      
      <div className="mb-6">
        <InternalLink 
          href={`twitch/user/${streamerName}`}
          className="flex items-center text-lg font-medium hover:text-purple-500 transition-colors"
        >
          <User className="h-5 w-5 mr-2 text-purple-500" />
          {streamerName}
        </InternalLink>
      </div>
      
      {description && (
        <div className="bg-surface-700 rounded p-4">
          <h3 className="text-lg font-medium mb-2">Description</h3>
          <p className="text-surface-300 whitespace-pre-line">{description}</p>
        </div>
      )}
    </div>
  );
};
