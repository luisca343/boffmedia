"use client";

import { BaseCard } from "../shared/BaseCard";
import { formatDate } from "../../../app/smartrotom/youtube/types";

interface ChannelCardProps {
  channelId: string;
  title: string;
  thumbnailUrl: string;
}

export const ChannelCard = (props: ChannelCardProps) => {
  return (
    <BaseCard
      id={props.channelId}
      title={props.title}
      creator=""
      thumbnailUrl={props.thumbnailUrl}
      platform="youtube"
      type="channel"
      linkPath={`youtube/channel/${props.channelId}`}
      formatDate={formatDate}
    />
  );
};
