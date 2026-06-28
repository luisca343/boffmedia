"use client";

import { useState, useEffect } from "react";
import Axios from "axios";
import { VideoGrid } from "@/components/smartrotom/youtube/VideoGrid";
import { BaseSearchHeader } from "@/components/smartrotom/shared/BaseSearchHeader";
import { Video, API_KEY } from "../types";
import { useTranslations } from "next-intl";
import { LoadingSpinner } from "@/components/ui/display/LoadingSpinner";

export default function YoutubeResults() {
  const t = useTranslations("youtube");
  const tCommon = useTranslations("common");
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trending, setTrending] = useState<Video[]>([]);

  useEffect(() => {
    fetchTrendingVideos();
  }, []);

  const fetchTrendingVideos = async () => {
    try {
      setIsLoading(true);
      const res = await Axios.get(
        `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&part=snippet&chart=mostPopular&maxResults=8&regionCode=US`
      );
      setTrending(res.data.items);
    } catch (error) {
      console.error("Error fetching trending videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await Axios.get(
        `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&part=snippet&q=${query}&maxResults=25&type=video,channel`
      );
      setVideos(res.data.items);
    } catch (error) {
      console.error("Error fetching videos:", error);
      setError(tCommon("search.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-layer-1 text-white overflow-auto">
      <BaseSearchHeader
        platform="youtube"
        onSearch={handleSearch}
        isLoading={isLoading}
        placeholder={t("search.placeholder")}
      />
      
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900/50 border border-red-800 rounded-lg p-4 mb-6 text-center">
            {error}
          </div>
        )}

        {videos.length === 0 && !isLoading && (
          <VideoGrid 
            videos={trending}
            loading={isLoading}
            title={t("search.trendingTitle")}
            emptyMessage={t("search.noTrending")}
          />
        )}

        {videos.length > 0 && (
          <VideoGrid 
            videos={videos}
            title={t("search.title")}
          />
        )}

        {isLoading && videos.length === 0 && <LoadingSpinner size="large" message={tCommon("loading.content")} platform="youtube" />}
      </main>
    </div>
  );
}