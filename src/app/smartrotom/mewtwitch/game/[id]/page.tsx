"use client";

import { useState, useEffect } from "react";
import { InternalLink } from "@/components/ui/navigation/Link";
import { LoadingSpinner } from "@/components/ui/display/LoadingSpinner";
import { ContentGrid } from "../../_components/ContentGrid";
import { TwitchGame, TwitchStream, TwitchClip, formatNumber } from "../../types";
import { twitchAPI } from "../../_services/twitchAPI";
import { useTranslations } from "next-intl";

export default function GamePage({ params }: { params: { id: string } }) {
  const t = useTranslations("twitch");
  const [gameData, setGameData] = useState<TwitchGame | null>(null);
  const [streams, setStreams] = useState<TwitchStream[]>([]);
  const [clips, setClips] = useState<TwitchClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'streams' | 'clips'>('streams');

  useEffect(() => {
    async function fetchGameData() {
      try {
        setLoading(true);
        setError(null);
        
        // Get game data from Twitch API
        const game = await twitchAPI.getGameById(params.id);
        
        if (game) {
          setGameData(game);
          
          // Fetch streams and clips for this game in parallel
          const [gameStreams, gameClips] = await Promise.all([
            twitchAPI.getStreamsForGame(params.id, 20),
            twitchAPI.getGameClips(params.id, 12)
          ]);
          
          setStreams(gameStreams);
          setClips(gameClips);
        } else {
          setError(t("game.notFound"));
        }
      } catch (error) {
        console.error("Error fetching game data:", error);
        setError(t("game.notFound"));
      } finally {
        setLoading(false);
      }
    }
    
    fetchGameData();
  }, [params.id, t]);

  if (loading) {
    return (
      <div className="min-h-full bg-surface-900 flex justify-center items-center overflow-auto">
        <LoadingSpinner size="large" message={t("loading.game")} />
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="min-h-full bg-surface-900 text-white p-6 flex justify-center items-center overflow-auto">
        <div className="bg-surface-800 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-red-500 text-xl mb-4">{error || t("game.notFound")}</p>
          <InternalLink href="twitch" className="text-purple-400 hover:underline">
            {t("game.returnToBrowse")}
          </InternalLink>
        </div>
      </div>
    );
  }

  const totalViewers = streams.reduce((total, stream) => total + stream.viewer_count, 0);

  return (
    <div className="min-h-full bg-surface-900 text-white overflow-auto">
      {/* Game Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-48 h-64 mb-6 md:mb-0 md:mr-8 flex-shrink-0">
              <img
                src={gameData.box_art_url.replace('{width}', '285').replace('{height}', '380')}
                alt={gameData.name}
                className="w-full h-full object-cover rounded-lg shadow-lg"
              />
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold mb-4">{gameData.name}</h1>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-lg">
                <div>
                  <span className="text-purple-300">Live Channels:</span>
                  <span className="ml-2 font-semibold">{streams.length.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-purple-300">Viewers:</span>
                  <span className="ml-2 font-semibold">{formatNumber(totalViewers)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex border-b border-surface-700 mb-8">
          <button
            onClick={() => setActiveTab('streams')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'streams'
                ? 'border-b-2 border-purple-500 text-purple-500'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            {t("game.streams")} ({streams.length})
          </button>
          <button
            onClick={() => setActiveTab('clips')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'clips'
                ? 'border-b-2 border-purple-500 text-purple-500'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            {t("game.topClips")} ({clips.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'streams' ? (
          <ContentGrid 
            streams={streams}
            emptyMessage={t("game.noStreams")}
          />
        ) : (
          <ContentGrid 
            clips={clips}
            emptyMessage={t("game.noClips")}
          />
        )}
      </div>
    </div>
  );
}
