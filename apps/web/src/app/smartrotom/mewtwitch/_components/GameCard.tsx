"use client";

import { InternalLink } from "@/components/ui/navigation/Link";
import { useTranslations } from "next-intl";

interface GameCardProps {
  id: string;
  name: string;
  boxArtUrl: string;
}

export const GameCard = ({
  id,
  name,
  boxArtUrl,
}: GameCardProps) => {
  const t = useTranslations("twitch");
  // Get the appropriate box art URL with proper dimensions
  const getBoxArtUrl = () => {
    return boxArtUrl.replace('{width}', '285').replace('{height}', '380');
  };

  return (
    <InternalLink
      href={`mewtwitch/game/${id}`}
      className="group bg-surface-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-surface-700 flex flex-col"
    >
      <div className="relative">
        <img
          src={getBoxArtUrl()}
          alt={name}
          className="w-full h-64 object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-4 text-center">
        <h3 className="font-semibold text-lg mb-1 group-hover:text-purple-500 transition-colors duration-300">{name}</h3>
      </div>
    </InternalLink>
  );
};
