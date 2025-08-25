"use client";

import { BaseCard } from "../shared/BaseCard";
import { Users } from "lucide-react";
import { formatNumber, getTimeSince } from "../../../app/smartrotom/mewtwitch/types";

interface StreamCardProps {
  id: string;
  title: string;
  streamerName: string;
  gameName?: string;
  thumbnailUrl: string;
  viewerCount?: number;
  startedAt?: string;
  type: 'stream' | 'video' | 'clip';
  timestamp?: number;
  duration?: string;
  allowRemove?: boolean;
  onRemove?: () => void;
}

export const StreamCard = (props: StreamCardProps) => {
  const getThumbnailUrl = () => {
    if (props.type === 'stream') {
      return props.thumbnailUrl.replace('{width}', '440').replace('{height}', '248');
    } else if (props.type === 'video') {
      return props.thumbnailUrl.replace('%{width}x%{height}', '440x248');
    }
    return props.thumbnailUrl;
  };

  const getLink = () => {
    switch (props.type) {
      case 'stream':
        return `twitch/stream/${props.streamerName}`;
      case 'video':
        return `twitch/video/${props.id}`;
      case 'clip':
        return `twitch/clip/${props.id}`;
      default:
        return `twitch/stream/${props.streamerName}`;
    }
  };

  const additionalInfo = (
    <>
      {props.gameName && (
        <p className="text-xs text-surface-500 mb-2">{props.gameName}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-surface-400">
        {props.type === 'stream' && props.viewerCount !== undefined && (
          <div className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            <span>{formatNumber(props.viewerCount)}</span>
          </div>
        )}
        
        {props.startedAt && (
          <span>{getTimeSince(props.startedAt)}</span>
        )}
      </div>
    </>
  );

  return (
    <BaseCard
      id={props.id}
      title={props.title}
      creator={props.streamerName}
      thumbnailUrl={getThumbnailUrl()}
      platform="twitch"
      type={props.type}
      linkPath={getLink()}
      timestamp={props.timestamp}
      duration={props.duration}
      viewCount={props.viewerCount}
      allowRemove={props.allowRemove}
      onRemove={props.onRemove}
      additionalInfo={additionalInfo}
    />
  );
};
