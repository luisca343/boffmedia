"use client";

import { useTranslations } from "next-intl";
import { BaseHistory } from "@/components/smartrotom/shared/BaseHistory";
import { StreamCard } from "@/components/smartrotom/twitch/StreamCard";
import { HistoryItem, getHistory, clearHistory, removeFromHistory } from "../../_services/historyService";

export const HistoryView = () => {
  const t = useTranslations("twitch");

  const renderHistoryItem = (item: HistoryItem, onRemove: (id: string, type?: string) => void) => (
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
      allowRemove={true}
      onRemove={() => onRemove(item.id, item.type)}
    />
  );

  return (
    <BaseHistory<HistoryItem>
      platform="twitch"
      getHistory={getHistory}
      clearHistory={clearHistory}
      removeFromHistory={(id: string, type?: string) => removeFromHistory(id, type as 'stream' | 'video' | 'clip')}
      renderItem={renderHistoryItem}
      emptyMessage={t("history.empty")}
      emptySubtext={t("history.emptySubtext")}
    />
  );
};
