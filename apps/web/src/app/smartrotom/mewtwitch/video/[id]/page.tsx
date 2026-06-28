"use client";

import { useState, useEffect } from "react";
import { InternalLink } from "@/components/ui/navigation/Link";
import { LoadingSpinner } from "@/components/ui/display/LoadingSpinner";
import { TwitchVideoPlayer } from "../_components/TwitchVideoPlayer";
import { VideoDetails } from "../_components/VideoDetails";
import { TwitchVideo } from "../../types";
import { twitchAPI } from "../../_services/twitchAPI";
import { addToHistory } from "../../_services/historyService";
import { useTranslations } from "next-intl";

export default function VideoPage({ params }: { params: { id: string } }) {
  const t = useTranslations("twitch");
  const [videoData, setVideoData] = useState<TwitchVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideoData() {
      try {
        setLoading(true);
        setError(null);
        
        // Get video data from Twitch API
        const video = await twitchAPI.getVideoById(params.id);
        
        if (video) {
          setVideoData(video);
          // Add to watch history
          addToHistory(video, 'video');
        } else {
          setError(t("video.notFound"));
        }
      } catch (error) {
        console.error("Error fetching video data:", error);
        setError(t("video.notFound"));
      } finally {
        setLoading(false);
      }
    }
    
    fetchVideoData();
  }, [params.id, t]);

  if (loading) {
    return (
      <div className="min-h-full bg-layer-1 flex justify-center items-center overflow-auto">
        <LoadingSpinner size="large" message={t("loading.stream")} />
      </div>
    );
  }

  if (error || !videoData) {
    return (
      <div className="min-h-full bg-layer-1 text-white p-6 flex justify-center items-center overflow-auto">
        <div className="bg-layer-2 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-red-500 text-xl mb-4">{error || t("video.notFound")}</p>
          <InternalLink href="twitch" className="text-purple-400 hover:underline">
            {t("video.returnToBrowse")}
          </InternalLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-layer-1 text-white overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <TwitchVideoPlayer 
            videoId={params.id}
            autoplay={true}
            height={600}
          />
        </div>

        <VideoDetails
          title={videoData.title}
          description={videoData.description}
          streamerName={videoData.user_name}
          streamerId={videoData.user_id}
          viewCount={videoData.view_count}
          duration={videoData.duration}
          publishedAt={videoData.published_at}
          language={videoData.language}
        />
      </div>
    </div>
  );
}
