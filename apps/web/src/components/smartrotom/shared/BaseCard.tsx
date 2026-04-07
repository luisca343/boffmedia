"use client";

import { InternalLink } from "@/components/ui/navigation/Link";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { formatDistanceToNow } from "date-fns";
import { getTheme } from "../themes";

interface BaseCardProps {
  id: string;
  title: string;
  creator: string; // Generic term for channel/streamer
  thumbnailUrl: string;
  publishedAt?: string;
  platform: "youtube" | "twitch";
  type: "video" | "stream" | "clip" | "channel";
  linkPath: string;
  timestamp?: number; // for history items
  duration?: string;
  viewCount?: number | string;
  allowRemove?: boolean;
  onRemove?: () => void;
  additionalInfo?: React.ReactNode; // For platform-specific content
  formatDate?: (date: string) => string;
}

export const BaseCard = ({
  id,
  title,
  creator,
  thumbnailUrl,
  publishedAt,
  platform,
  type,
  linkPath,
  timestamp,
  duration,
  viewCount,
  allowRemove = false,
  onRemove,
  additionalInfo,
  formatDate
}: BaseCardProps) => {
  const theme = getTheme(platform);
  
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove) onRemove();
  };

  // Format the watched time in a human-readable way
  const getWatchedTime = () => {
    if (!timestamp) return "";
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  const isChannel = type === "channel";
  const isLive = type === "stream";

  return (
    <div className="relative group">
      {allowRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className={`absolute right-0 top-0 text-white rounded-full p-1 m-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${
            platform === "youtube" ? "bg-red-500/80" : "bg-purple-500/80"
          }`}
          onClick={handleRemoveClick}
          title="Remove from history"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      
      <InternalLink
        href={linkPath}
        className={`block bg-surface-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-surface-700 ${isChannel ? 'flex flex-col' : ''}`}
      >
        {isChannel ? (
          // Channel layout - centered avatar
          <>
            <div className="w-full flex justify-center pt-6 pb-2">
              <div className={`w-24 h-24 rounded-full overflow-hidden ring-4 ring-surface-700 transition-all ${
              platform === "youtube" ? "group-hover:ring-red-500" : "group-hover:ring-purple-500"
            }`}>
                <img
                  src={thumbnailUrl}
                  alt={title}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="p-4 text-center">
              <div className={`inline-block px-2 py-1 mb-2 text-xs rounded-full text-white ${
                platform === "youtube" ? "bg-red-500" : "bg-purple-500"
              }`}>
                {platform === "youtube" ? "Channel" : "Streamer"}
              </div>
              <h3 className={`text-lg font-semibold mb-1 transition-colors duration-300 ${
                platform === "youtube" ? "group-hover:text-red-500" : "group-hover:text-purple-500"
              }`}>
                {title}
              </h3>
            </div>
          </>
        ) : (
          // Video/Stream layout - thumbnail with overlay
          <>
            <div className="relative">
              <img
                src={thumbnailUrl}
                alt={title}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              
              {/* Live indicator for streams */}
              {isLive && (
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold flex items-center">
                  LIVE
                  <span className="w-2 h-2 bg-white rounded-full ml-1 animate-pulse"></span>
                </div>
              )}
              
              {/* Duration for videos/clips */}
              {duration && !isLive && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {duration}
                </div>
              )}
              
              {/* Watch timestamp for history items */}
              {timestamp && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {getWatchedTime()}
                </div>
              )}
              
              {/* Date for regular videos */}
              {!timestamp && publishedAt && formatDate && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDate(publishedAt)}
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="p-4">
              <h3 className={`text-lg font-semibold line-clamp-2 transition-colors duration-300 mb-2 ${
                platform === "youtube" ? "group-hover:text-red-500" : "group-hover:text-purple-500"
              }`}>
                {title}
              </h3>
              
              <p className="text-sm text-surface-400 group-hover:text-surface-300 transition-colors duration-300 mb-1">
                {creator}
              </p>
              
              {/* Additional platform-specific info */}
              {additionalInfo}
            </div>
          </>
        )}
      </InternalLink>
    </div>
  );
};
