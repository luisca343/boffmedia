"use client";

import { User } from "lucide-react";
import { InternalLink } from "@/components/ui/navigation/Link";
import { useTranslations } from "next-intl";
import { getTheme } from "../themes";

interface BaseDetailsProps {
  title: string;
  creatorName: string;
  creatorId: string;
  platform: "youtube" | "twitch";
  statsComponent: React.ReactNode;
  description?: string;
  tags?: string[];
  children?: React.ReactNode; // For additional platform-specific content
}

export const BaseDetails = ({
  title,
  creatorName,
  creatorId,
  platform,
  statsComponent,
  description,
  tags = [],
  children
}: BaseDetailsProps) => {
  const t = useTranslations(platform);
  const theme = getTheme(platform);
  
  const creatorLink = platform === "youtube" 
    ? `youtube/channel/${creatorId}`
    : `twitch/user/${creatorName}`;

  return (
    <div className="bg-surface-800 rounded-lg p-6 shadow-lg">
      <h1 className="text-2xl font-bold mb-3">{title}</h1>
      
      {statsComponent}
      
      <div className="mb-6">
        <InternalLink 
          href={creatorLink}
          className={`flex items-center text-lg font-medium transition-colors ${
            platform === "youtube" ? "hover:text-red-500" : "hover:text-purple-500"
          }`}
        >
          <User className={`h-5 w-5 mr-2 ${
            platform === "youtube" ? "text-red-500" : "text-purple-500"
          }`} />
          {creatorName}
        </InternalLink>
      </div>
      
      {/* Additional platform-specific content */}
      {children}
      
      {/* Tags for Twitch */}
      {tags.length > 0 && platform === "twitch" && (
        <div className="bg-surface-700 rounded p-4">
          <h3 className="text-lg font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="text-white px-2 py-1 rounded-full text-sm bg-purple-500"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Description */}
      {description && (
        <div className="bg-surface-700 rounded p-4 mt-4">
          <h3 className="text-lg font-medium mb-2">
            {platform === "youtube" ? t("video.description") : "Description"}
          </h3>
          <p className="text-surface-300 whitespace-pre-line">{description}</p>
        </div>
      )}
    </div>
  );
};
