"use client";

import { InternalLink } from "@/components/ui/navigation/Link";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { formatDistanceToNow } from "date-fns";

interface VideoCardProps {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  formatDate: (date: string) => string;
  timestamp?: number; // timestamp for history items
  allowRemove?: boolean;
  onRemove?: () => void;
}

export const VideoCard = ({
  id,
  title,
  channelTitle,
  thumbnailUrl,
  publishedAt,
  formatDate,
  timestamp,
  allowRemove = false,
  onRemove
}: VideoCardProps) => {
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

  return (
    <div className="relative group">
      {allowRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 bg-red-600/80 text-white rounded-full p-1 m-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleRemoveClick}
          title="Remove from history"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      
      <InternalLink
        href={`youtube/video/${id}`}
        className="block bg-surface-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-surface-700"
      >
        <div className="relative">
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {timestamp ? (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {getWatchedTime()}
            </div>
          ) : (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {formatDate(publishedAt)}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-red-500 transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-surface-400 group-hover:text-surface-300 transition-colors duration-300 mt-1">
            {channelTitle}
          </p>
        </div>
      </InternalLink>
    </div>
  );
};