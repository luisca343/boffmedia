"use client";

import { BaseCard } from "../shared/BaseCard";

interface GameCardProps {
  id: string;
  name: string;
  boxArtUrl: string;
}

export const GameCard = (props: GameCardProps) => {
  const getThumbnailUrl = () => {
    return props.boxArtUrl.replace('{width}', '285').replace('{height}', '380');
  };

  return (
    <BaseCard
      id={props.id}
      title={props.name}
      creator=""
      thumbnailUrl={getThumbnailUrl()}
      platform="twitch"
      type="channel" // Use channel type for game cards to get the centered layout
      linkPath={`twitch/game/${props.id}`}
    />
  );
};
