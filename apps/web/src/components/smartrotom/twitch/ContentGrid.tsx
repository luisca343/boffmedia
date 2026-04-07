"use client";

import { BaseContentGrid } from "../shared/BaseContentGrid";
import { StreamCard } from "./StreamCard";
import { GameCard } from "./GameCard";
import { TwitchStream, TwitchVideo, TwitchClip, TwitchGame } from "../../../app/smartrotom/mewtwitch/types";
import { HistoryItem } from "../../../app/smartrotom/mewtwitch/_services/historyService";

interface ContentGridProps {
  streams?: TwitchStream[];
  videos?: TwitchVideo[];
  clips?: TwitchClip[];
  games?: TwitchGame[];
  history?: HistoryItem[];
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  allowRemoval?: boolean;
  onRemoveItem?: (id: string, type: 'stream' | 'video' | 'clip') => void;
}

export const ContentGrid = ({
  streams,
  videos,
  clips,
  games,
  history,
  loading = false,
  emptyMessage = "No content available",
  title,
  allowRemoval = false,
  onRemoveItem
}: ContentGridProps) => {
  
  // Determine what content to show
  const hasContent = 
    (streams && streams.length > 0) ||
    (videos && videos.length > 0) ||
    (clips && clips.length > 0) ||
    (games && games.length > 0) ||
    (history && history.length > 0);

  return (
    <BaseContentGrid
      loading={loading}
      emptyMessage={emptyMessage}
      title={title}
      platform="twitch"
      loadingMessage="Loading content..."
    >
      {/* Render streams */}
      {streams?.map((stream) => (
        <StreamCard
          key={stream.id}
          id={stream.id}
          title={stream.title}
          streamerName={stream.user_name}
          gameName={stream.game_name}
          thumbnailUrl={stream.thumbnail_url}
          viewerCount={stream.viewer_count}
          startedAt={stream.started_at}
          type="stream"
          allowRemove={allowRemoval}
          onRemove={allowRemoval && onRemoveItem ? () => onRemoveItem(stream.id, 'stream') : undefined}
        />
      ))}

      {/* Render videos */}
      {videos?.map((video) => (
        <StreamCard
          key={video.id}
          id={video.id}
          title={video.title}
          streamerName={video.user_name}
          thumbnailUrl={video.thumbnail_url}
          startedAt={video.created_at}
          duration={video.duration}
          type="video"
          allowRemove={allowRemoval}
          onRemove={allowRemoval && onRemoveItem ? () => onRemoveItem(video.id, 'video') : undefined}
        />
      ))}

      {/* Render clips */}
      {clips?.map((clip) => (
        <StreamCard
          key={clip.id}
          id={clip.id}
          title={clip.title}
          streamerName={clip.broadcaster_name}
          thumbnailUrl={clip.thumbnail_url}
          startedAt={clip.created_at}
          duration={`${Math.floor(clip.duration)}s`}
          type="clip"
          allowRemove={allowRemoval}
          onRemove={allowRemoval && onRemoveItem ? () => onRemoveItem(clip.id, 'clip') : undefined}
        />
      ))}

      {/* Render games */}
      {games?.map((game) => (
        <GameCard
          key={game.id}
          id={game.id}
          name={game.name}
          boxArtUrl={game.box_art_url}
        />
      ))}

      {/* Render history */}
      {history?.map((item) => (
        <StreamCard
          key={`${item.id}-${item.type}-${item.timestamp}`}
          id={item.id}
          title={item.title}
          streamerName={item.streamer_name}
          thumbnailUrl={item.thumbnail_url}
          startedAt={item.created_at}
          duration={item.duration}
          type={item.type}
          timestamp={item.timestamp}
          allowRemove={allowRemoval}
          onRemove={allowRemoval && onRemoveItem ? () => onRemoveItem(item.id, item.type) : undefined}
        />
      ))}
    </BaseContentGrid>
  );
};
