"use client";

import { useState, useEffect } from "react";
import { BaseSearchHeader } from "@/components/smartrotom/shared/BaseSearchHeader";
import { ContentGrid } from "./ContentGrid";
import { LoadingSpinner } from "@/components/ui/display/LoadingSpinner";
import { TwitchStream, TwitchGame, TwitchUser, TwitchSearchChannel } from "../types";
import { twitchAPI } from "../_services/twitchAPI";
import { useTranslations } from "next-intl";
import { InternalLink } from "@/components/ui/navigation/Link";

export default function TwitchResults() {
  const t = useTranslations("twitch");
  const [searchResults, setSearchResults] = useState<{
    streams: TwitchStream[];
    users: TwitchSearchChannel[];
    games: TwitchGame[];
  }>({ streams: [], users: [], games: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topStreams, setTopStreams] = useState<TwitchStream[]>([]);
  const [topGames, setTopGames] = useState<TwitchGame[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);

  useEffect(() => {
    fetchTopContent();
  }, []);

  const fetchTopContent = async () => {
    try {
      setLoadingTop(true);
      setError(null);
      
      const [streamsData, gamesData] = await Promise.all([
        twitchAPI.getTopStreams(12),
        twitchAPI.getTopGames(8)
      ]);
      
      setTopStreams(streamsData);
      setTopGames(gamesData);
    } catch (error) {
      console.error("Error fetching top content:", error);
      setError(t("search.error"));
    } finally {
      setLoadingTop(false);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [streamsData, usersData, gamesData] = await Promise.all([
        twitchAPI.searchStreams(query, 20),
        twitchAPI.searchChannels(query, 10),
        twitchAPI.searchGames(query, 8)
      ]);
      
      setSearchResults({
        streams: streamsData,
        users: usersData,
        games: gamesData
      });
    } catch (error) {
      console.error("Error searching:", error);
      setError(t("search.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const hasSearchResults = 
    searchResults.streams.length > 0 || 
    searchResults.users.length > 0 || 
    searchResults.games.length > 0;

  return (
    <div className="min-h-full bg-surface-900 text-white overflow-auto">
      <BaseSearchHeader
        platform="twitch"
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

        {/* Search Results */}
        {hasSearchResults && (
          <div className="mb-12">
            {searchResults.streams.length > 0 && (
              <div className="mb-8">
                <ContentGrid 
                  streams={searchResults.streams}
                  title={`${t("search.streamResults")} (${searchResults.streams.length})`}
                />
              </div>
            )}
            
            {searchResults.users.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="bg-purple-600 h-6 w-1 rounded-full mr-3"></span>
                  {t("search.userResults")} ({searchResults.users.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {searchResults.users.map((user) => {
                    console.log(user)
                    return <InternalLink
                      key={user.id}
                      href={`mewtwitch/user/${user.broadcaster_login}`}
                      className="group bg-surface-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-surface-700 flex flex-col p-4"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3">
                        <img
                          src={user.thumbnail_url}
                          alt={user.display_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <div className="inline-block px-2 py-1 mb-2 text-xs bg-purple-600 rounded-full">{t("common.streamer")}</div>
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-purple-500 transition-colors duration-300">
                          {user.display_name}
                        </h3>
                        <p className="text-sm text-surface-400">@{user.broadcaster_login}</p>
                      </div>
                    </InternalLink>
})}
                </div>
              </div>
            )}
            
            {searchResults.games.length > 0 && (
              <div className="mb-8">
                <ContentGrid 
                  games={searchResults.games}
                  title={`${t("search.gameResults")} (${searchResults.games.length})`}
                />
              </div>
            )}
          </div>
        )}

        {/* Top Content when no search results */}
        {!hasSearchResults && (
          <>
            <div className="mb-12">
              <ContentGrid 
                streams={topStreams}
                loading={loadingTop}
                title={t("browse.topStreams")}
                emptyMessage={t("browse.noStreams")}
              />
            </div>

            <div className="mb-12">
              <ContentGrid 
                games={topGames}
                loading={loadingTop}
                title={t("browse.topGames")}
                emptyMessage={t("browse.noGames")}
              />
            </div>
          </>
        )}

        {isLoading && !hasSearchResults && <LoadingSpinner size="large" message={t("loading.search")} />}
      </main>
    </div>
  );
}
