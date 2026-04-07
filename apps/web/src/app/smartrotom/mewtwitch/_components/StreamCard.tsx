"use client";

import { InternalLink } from "@/components/ui/navigation/Link";
import { Users, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { formatDistanceToNow } from "date-fns";
import { formatNumber, getTimeSince } from "../types";

interface StreamCardProps {
  id: string;
  title: string;
  streamerName: string;
  gameName?: string;
  thumbnailUrl: string;
  viewerCount?: number;
  startedAt?: string;
  type: 'stream' | 'video' | 'clip';
  timestamp?: number; // timestamp for history items
  duration?: string; // for videos and clips
  allowRemove?: boolean;
  onRemove?: () => void;
}

export const StreamCard = ({
  id,
  title,
  streamerName,
  gameName,
  thumbnailUrl,
  viewerCount,
  startedAt,
  type,
  timestamp,
  duration,
  allowRemove = false,
  onRemove
}: StreamCardProps) => {
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

  // Get the appropriate thumbnail URL with proper dimensions
  const getThumbnailUrl = () => {
    if (type === 'stream') {
      return thumbnailUrl.replace('{width}', '440').replace('{height}', '248');
    } else if (type === 'video') {
      // For videos, replace %{width}x%{height} format
      return thumbnailUrl.replace('%{width}x%{height}', '440x248');
    }
    return thumbnailUrl;
  };

  // Get the appropriate link based on type
  const getLink = () => {
    switch (type) {
      case 'stream':
        return `mewtwitch/stream/${streamerName}`;
      case 'video':
        return `mewtwitch/video/${id}`;
      case 'clip':
        return `mewtwitch/clip/${id}`;
      default:
        return `mewtwitch/stream/${streamerName}`;
    }
  };

  return (
    <div className="relative group">
      {allowRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 bg-purple-600/80 text-white rounded-full p-1 m-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleRemoveClick}
          title="Remove from history"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      
      <InternalLink
        href={getLink()}
        className="block bg-surface-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-surface-700"
      >
        <div className="relative">
          <img
            src={getThumbnailUrl()}
            alt={title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          
          {/* Live indicator for streams */}
          {type === 'stream' && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
              LIVE
            </div>
          )}
          
          {/* Duration for videos/clips */}
          {duration && type !== 'stream' && (
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
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-purple-500 transition-colors duration-300 mb-2">
            {title}
          </h3>
          
          <p className="text-sm text-surface-400 group-hover:text-surface-300 transition-colors duration-300 mb-1">
            {streamerName}
          </p>
          
          {gameName && (
            <p className="text-xs text-surface-500 mb-2">{gameName}</p>
          )}
          
          <div className="flex items-center justify-between text-xs text-surface-400">
            {type === 'stream' && viewerCount !== undefined && (
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                <span>{formatNumber(viewerCount)}</span>
              </div>
            )}
            
            {startedAt && (
              <span>{getTimeSince(startedAt)}</span>
            )}
          </div>
        </div>
      </InternalLink>
    </div>
  );
};
