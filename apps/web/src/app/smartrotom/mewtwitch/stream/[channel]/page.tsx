"use client";

import { useState, useEffect } from "react";
import { InternalLink } from "@/components/ui/navigation/Link";
import { LoadingSpinner } from "@/components/ui/display/LoadingSpinner";
import { TwitchPlayer } from "../_components/TwitchPlayer";
import { StreamDetails } from "../_components/StreamDetails";
import { TwitchStream } from "../../types";
import { twitchAPI } from "../../_services/twitchAPI";
import { addToHistory } from "../../_services/historyService";
import { useTranslations } from "next-intl";

export default function StreamPage({ params }: { params: { channel: string } }) {
  const t = useTranslations("twitch");
  const [streamData, setStreamData] = useState<TwitchStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStreamData() {
      try {
        setLoading(true);
        setError(null);
        
        // Get stream data from Twitch API
        const stream = await twitchAPI.getStreamByUsername(params.channel);
        
        if (stream) {
          setStreamData(stream);
          // Add to watch history
          addToHistory(stream, 'stream');
        } else {
          setError(t("stream.notFound"));
        }
      } catch (error) {
        console.error("Error fetching stream data:", error);
        setError(t("stream.notFound"));
      } finally {
        setLoading(false);
      }
    }
    
    fetchStreamData();
  }, [params.channel, t]);

  if (loading) {
    return (
      <div className="min-h-full bg-surface-900 flex justify-center items-center overflow-auto">
        <LoadingSpinner size="large" message={t("loading.stream")} />
      </div>
    );
  }

  if (error || !streamData) {
    return (
      <div className="min-h-full bg-surface-900 text-white p-6 flex justify-center items-center overflow-auto">
        <div className="bg-surface-800 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-red-500 text-xl mb-4">{error || t("stream.notFound")}</p>
          <p className="text-surface-400 mb-4">
            {error === t("stream.notFound") ? 
              `${params.channel} is not currently streaming or doesn't exist.` :
              "There was an error loading the stream."
            }
          </p>
          <InternalLink href="twitch" className="text-purple-400 hover:underline">
            {t("stream.returnToBrowse")}
          </InternalLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-surface-900 text-white overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <TwitchPlayer 
            channel={params.channel}
            layout="video-with-chat"
            autoplay={true}
            height={600}
          />
        </div>

        <StreamDetails
          title={streamData.title}
          streamerName={streamData.user_name}
          streamerId={streamData.user_id}
          gameName={streamData.game_name}
          viewerCount={streamData.viewer_count}
          startedAt={streamData.started_at}
          language={streamData.language}
          tags={streamData.tags}
        />
      </div>
    </div>
  );
}
