"use client";

import { Users, Clock, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatNumber, getTimeSince } from "../../types";

interface StreamStatsProps {
  viewerCount: number;
  startedAt: string;
  language: string;
  gameName?: string;
}

export const StreamStats = ({
  viewerCount,
  startedAt,
  language,
  gameName
}: StreamStatsProps) => {
  const t = useTranslations("twitch");
  
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 text-surface-300">
      <div className="flex items-center">
        <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
        <span className="text-red-500 font-bold text-sm">{t("stream.live")}</span>
      </div>
      
      <div className="flex items-center">
        <Users className="h-4 w-4 mr-1" />
        <span>{formatNumber(viewerCount)} {t("stream.viewers")}</span>
      </div>
      
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-1" />
        <span>{getTimeSince(startedAt)}</span>
      </div>
      
      {gameName && (
        <div className="flex items-center">
          <span className="text-surface-400">Playing:</span>
          <span className="ml-1 text-purple-400">{gameName}</span>
        </div>
      )}
      
      <div className="flex items-center">
        <span className="text-surface-400">Language:</span>
        <span className="ml-1">{language.toUpperCase()}</span>
      </div>
    </div>
  );
};
