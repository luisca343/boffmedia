"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Axios from "axios";
import { History, Search } from "lucide-react";
import { VideoGrid } from "./VideoGrid";
import { LoadingSpinner } from "./LoadingSpinner";
import { Video, API_KEY } from "../types";
import { InternalLink } from "@/components/nav/Link";
import { useTranslations } from "next-intl";

export default function YoutubeResults() {
  const t = useTranslations("youtube");
  const [busqueda, setBusqueda] = useState("");
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

  const handleSearch = async () => {
    if (!busqueda.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const res = await Axios.get(
        `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&part=snippet&q=${busqueda}&maxResults=25&type=video,channel`
      );
      setVideos(res.data.items);
    } catch (error) {
      console.error("Error fetching videos:", error);
      setError(t("search.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-full bg-surface-900 text-white overflow-auto">
      <header className="sticky top-0 z-10 bg-surface-800/95 backdrop-blur-sm shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <div className="relative flex-grow">
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow pr-10 bg-surface-700 text-white placeholder-surface-400 border-surface-600 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                placeholder={t("search.placeholder")}
                aria-label={t("search.placeholder")}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-surface-400">
                <Search size={18} />
              </div>
            </div>
            <Button 
              onClick={handleSearch} 
              className="ml-2 bg-red-600 hover:bg-red-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? t("search.searching") : t("search.button")}
            </Button>
            <InternalLink href="/youtube/history" className="ml-2">
              <Button 
                variant="ghost" 
                className="bg-surface-700 hover:bg-surface-600"
                title={t("history.title")}
              >
                <History size={20} />
              </Button>
            </InternalLink>
          </div>
        </div>
      </header>
      
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

        {isLoading && videos.length === 0 && <LoadingSpinner size="large" message={t("loading.search")} />}
      </main>
    </div>
  );
}