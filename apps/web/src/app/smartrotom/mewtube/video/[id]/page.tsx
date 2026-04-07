"use client";

import { useState, useEffect, use } from "react";
import Axios from "axios";
import { InternalLink } from "@/components/ui/navigation/Link";
import { LoadingSpinner } from "@/components/ui/display/LoadingSpinner";
import { VideoPlayer } from "../_components/VideoPlayer";
import { VideoDetails } from "../_components/VideoDetails";
import { VideoDetails as VideoDetailsType, API_KEY, formatNumber, formatLongDate } from "../../types";
import { addToHistory } from "../../_services/historyService";
import { useTranslations } from "next-intl";

export default function Video({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("youtube");
  const [videoDetails, setVideoDetails] = useState<VideoDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideoDetails() {
      try {
        const response = await Axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${id}&key=${API_KEY}`
        );

        console.log("Video details response:", response.data);
        
        if (response.data.items && response.data.items.length > 0) {
          const details = response.data.items[0];
          setVideoDetails(details);
          
          // Add to watch history
          addToHistory({
            ...details,
            id: id
          });
        } else {
          setError(t("video.notFound"));
        }
      } catch (error) {
        console.error("Error fetching video details:", error);
        setError(t("video.notFound"));
      } finally {
        setLoading(false);
      }
    }
    
    fetchVideoDetails();
  }, [id, t]);

  if (loading) {
    return (
      <div className="min-h-full bg-surface-900 flex justify-center items-center overflow-auto">
        <LoadingSpinner size="large" message={t("loading.video")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-surface-900 text-white p-6 flex justify-center items-center overflow-auto">
        <div className="bg-surface-800 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <InternalLink href="youtube" className="text-secondary-400 hover:underline">
            {t("video.returnToSearch")}
          </InternalLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-surface-900 text-white overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <VideoPlayer videoId={id} title={videoDetails?.snippet.title || ""} />
        </div>

        {videoDetails && (
          <VideoDetails
            title={videoDetails.snippet.title}
            description={videoDetails.snippet.description}
            channelId={videoDetails.snippet.channelId}
            channelTitle={videoDetails.snippet.channelTitle}
            publishedAt={videoDetails.snippet.publishedAt}
            viewCount={videoDetails.statistics.viewCount}
            likeCount={videoDetails.statistics.likeCount}
            formatNumber={formatNumber}
            formatDate={formatLongDate}
          />
        )}
      </div>
    </div>
  );
}