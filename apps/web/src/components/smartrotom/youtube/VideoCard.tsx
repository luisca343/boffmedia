"use client";

import { BaseCard } from "../shared/BaseCard";
import { formatDate } from "../../../app/smartrotom/mewtube/types";

interface VideoCardProps {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  timestamp?: number;
  allowRemove?: boolean;
  onRemove?: () => void;
}

export const VideoCard = (props: VideoCardProps) => {
  return (
    <BaseCard
      {...props}
      creator={props.channelTitle}
      platform="youtube"
      type="video"
      linkPath={`youtube/video/${props.id}`}
      formatDate={formatDate}
    />
  );
};
