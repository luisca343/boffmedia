"use client";

import { VideoCard } from "./VideoCard";
import { ChannelCard } from "./ChannelCard";
import { Video, formatDate } from "../types";
import { LoadingSpinner } from "@/components/ui/display/LoadingSpinner";

interface VideoGridProps {
  videos: Video[];
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  formatDate?: (date: string) => string;
  allowRemoval?: boolean;
  onRemoveVideo?: (videoId: string) => void;
}

export const VideoGrid = ({
  videos,
  loading = false,
  emptyMessage = "No videos available",
  title,
  formatDate: customFormatDate,
  allowRemoval = false,
  onRemoveVideo
}: VideoGridProps) => {
  const dateFormatter = customFormatDate || formatDate;
  
  if (loading) {
    return <LoadingSpinner message="Loading videos..." />;
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-10 text-surface-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Helper function to reliably extract video ID from any video object structure
  const extractVideoId = (video: Video): string => {
    // Case 1: ID is directly a string
    if (typeof video.id === 'string') {
      return video.id;
    }
    
    // Case 2: From search API - ID is in video.id.videoId
    if (video.id?.videoId) {
      return video.id.videoId;
    }
    
    // Case 3: From playlist items API - ID is in video.snippet.resourceId.videoId
    if (video.snippet?.resourceId?.videoId) {
      return video.snippet.resourceId.videoId;
    }
    
    // Fallback
    return '';
  };

  return (
    <div>
      {title && (
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <span className="bg-red-600 h-6 w-1 rounded-full mr-3"></span>
          {title}
        </h2>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => {
          if (typeof video.id === 'object' && video.id?.kind === "youtube#channel") {
            return (
              <ChannelCard
                key={video.etag || Math.random().toString()}
                channelId={video.snippet.channelId}
                title={video.snippet.title}
                thumbnailUrl={video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || ''}
              />
            );
          }

          const videoId = extractVideoId(video);
          
          if (!videoId) {
            console.error("Could not extract video ID from:", video);
            return null; // Skip this video if we can't extract an ID
          }
          
          return (
            <VideoCard
              key={video.etag || videoId || Math.random().toString()}
              id={videoId}
              title={video.snippet.title}
              channelTitle={video.snippet.channelTitle}
              thumbnailUrl={video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || ''}
              publishedAt={video.snippet.publishedAt}
              formatDate={dateFormatter}
              timestamp={(video as any).timestamp}
              allowRemove={allowRemoval}
              onRemove={allowRemoval && onRemoveVideo ? () => onRemoveVideo(videoId) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};