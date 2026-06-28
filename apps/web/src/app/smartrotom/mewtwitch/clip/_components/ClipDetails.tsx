"use client";

import { Eye, Clock, Calendar, User } from "lucide-react";
import { InternalLink } from "@/components/ui/navigation/Link";
import { useTranslations } from "next-intl";
import { formatNumber, formatDate } from "../../types";

interface ClipDetailsProps {
  title: string;
  broadcasterName: string;
  creatorName: string;
  viewCount: number;
  duration: number;
  createdAt: string;
  language: string;
}

export const ClipDetails = ({
  title,
  broadcasterName,
  creatorName,
  viewCount,
  duration,
  createdAt,
  language
}: ClipDetailsProps) => {
  const t = useTranslations("twitch");
  
  return (
    <div className="bg-layer-2 rounded-lg p-6 shadow-lg">
      <h1 className="text-2xl font-bold mb-3">{title}</h1>
      
      <div className="flex flex-wrap items-center gap-4 mb-6 text-ink">
        <div className="flex items-center">
          <Eye className="h-4 w-4 mr-1" />
          <span>{formatNumber(viewCount)} {t("clip.views")}</span>
        </div>
        
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{t("clip.duration")}: {duration}s</span>
        </div>
        
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{t("clip.createdAt")}: {formatDate(createdAt)}</span>
        </div>
        
        <div className="flex items-center">
          <span className="text-ink-muted">Language:</span>
          <span className="ml-1">{language.toUpperCase()}</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <InternalLink 
            href={`mewtwitch/user/${broadcasterName}`}
            className="flex items-center text-lg font-medium hover:text-purple-500 transition-colors"
          >
            <User className="h-5 w-5 mr-2 text-purple-500" />
            {broadcasterName}
          </InternalLink>
        </div>
        
        <div className="bg-layer-3 rounded p-4">
          <p className="text-sm text-ink-muted mb-1">{t("clip.creator")}:</p>
          <p className="text-ink font-medium">{creatorName}</p>
        </div>
      </div>
    </div>
  );
};
