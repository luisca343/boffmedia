"use client";

import { InternalLink } from "@/components/ui/navigation/Link";
import { useTranslations } from "next-intl";

interface ChannelCardProps {
  channelId: string;
  title: string;
  thumbnailUrl: string;
}

export const ChannelCard = ({
  channelId,
  title,
  thumbnailUrl,
}: ChannelCardProps) => {
  const t = useTranslations("youtube");
  
  return (
    <InternalLink
      href={`youtube/channel/${channelId}`}
      className="group bg-surface-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-surface-700 flex flex-col"
    >
      <div className="w-full flex justify-center pt-6 pb-2">
        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-surface-700 group-hover:ring-red-600 transition-all">
          <img
            src={thumbnailUrl}
            alt={title}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        </div>
      </div>
      <div className="p-4 text-center">
        <div className="inline-block px-2 py-1 mb-2 text-xs bg-red-600 rounded-full">{t("common.channel")}</div>
        <h3 className="text-lg font-semibold mb-1 group-hover:text-red-500 transition-colors duration-300">
          {title}
        </h3>
      </div>
    </InternalLink>
  );
};