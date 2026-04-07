"use client";

import { User } from "lucide-react";
import { InternalLink } from "@/components/ui/navigation/Link";
import { StreamStats } from "./StreamStats";
import { useTranslations } from "next-intl";

interface StreamDetailsProps {
  title: string;
  streamerName: string;
  streamerId: string;
  gameName?: string;
  viewerCount: number;
  startedAt: string;
  language: string;
  tags?: string[];
}

export const StreamDetails = ({
  title,
  streamerName,
  streamerId,
  gameName,
  viewerCount,
  startedAt,
  language,
  tags = []
}: StreamDetailsProps) => {
  const t = useTranslations("twitch");
  
  return (
    <div className="bg-surface-800 rounded-lg p-6 shadow-lg">
      <h1 className="text-2xl font-bold mb-3">{title}</h1>
      
      <StreamStats
        viewerCount={viewerCount}
        startedAt={startedAt}
        language={language}
        gameName={gameName}
      />
      
      <div className="mb-6">
        <InternalLink 
          href={`mewtwitch/user/${streamerName}`}
          className="flex items-center text-lg font-medium hover:text-purple-500 transition-colors"
        >
          <User className="h-5 w-5 mr-2 text-purple-500" />
          {streamerName}
        </InternalLink>
      </div>
      
      {tags.length > 0 && (
        <div className="bg-surface-700 rounded p-4">
          <h3 className="text-lg font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="bg-purple-600 text-white px-2 py-1 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
