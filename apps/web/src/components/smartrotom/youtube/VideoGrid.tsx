"use client";

import { BaseContentGrid } from "../shared/BaseContentGrid";
import { VideoCard } from "./VideoCard";
import { ChannelCard } from "./ChannelCard";
import { Video } from "../../../app/smartrotom/mewtube/types";

interface VideoGridProps {
  videos: Video[];
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  allowRemoval?: boolean;
  onRemoveVideo?: (videoId: string) => void;
}

export const VideoGrid = ({
  videos,
  loading = false,
  emptyMessage = "No videos available",
  title,
  allowRemoval = false,
  onRemoveVideo
}: VideoGridProps) => {
  
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
    <BaseContentGrid
      loading={loading}
      emptyMessage={emptyMessage}
      title={title}
      platform="youtube"
      loadingMessage="Loading videos..."
    >
      {videos.map((video) => {
        // Handle channel results from search
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
          return null;
        }
        
        return (
          <VideoCard
            key={video.etag || videoId || Math.random().toString()}
            id={videoId}
            title={video.snippet.title}
            channelTitle={video.snippet.channelTitle}
            thumbnailUrl={video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || ''}
            publishedAt={video.snippet.publishedAt}
            timestamp={video.timestamp}
            allowRemove={allowRemoval}
            onRemove={allowRemoval && onRemoveVideo ? () => onRemoveVideo(videoId) : undefined}
          />
        );
      })}
    </BaseContentGrid>
  );
};
