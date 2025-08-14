"use client";

import { useTranslations } from "next-intl";
import { BaseHistory } from "@/components/smartrotom/shared/BaseHistory";
import { VideoCard } from "../../_components/VideoCard";
import { getHistory, clearHistory, removeFromHistory, HistoryItem } from "../../_services/historyService";
import { formatDate } from "../../types";

export const HistoryView = () => {
  const t = useTranslations("youtube");

  // Helper function to reliably extract video ID from any video object structure
  const extractVideoId = (video: HistoryItem): string => {
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

  const renderHistoryItem = (item: HistoryItem, onRemove: (id: string) => void) => {
    const videoId = extractVideoId(item);
    
    if (!videoId) {
      console.error("Could not extract video ID from:", item);
      return null; // Skip this video if we can't extract an ID
    }
    
    return (
      <VideoCard
        key={videoId + item.timestamp}
        id={videoId}
        title={item.snippet.title}
        channelTitle={item.snippet.channelTitle}
        thumbnailUrl={item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || ''}
        publishedAt={item.snippet.publishedAt}
        formatDate={formatDate}
        timestamp={item.timestamp}
        allowRemove={true}
        onRemove={() => onRemove(videoId)}
      />
    );
  };

  return (
    <BaseHistory<HistoryItem & { id: string }>
      platform="youtube"
      getHistory={() => getHistory().map(item => ({...item, id: extractVideoId(item)}))}
      clearHistory={clearHistory}
      removeFromHistory={removeFromHistory}
      renderItem={renderHistoryItem}
      emptyMessage={t("history.empty")}
      emptySubtext={t("history.emptySubtext")}
    />
  );
};