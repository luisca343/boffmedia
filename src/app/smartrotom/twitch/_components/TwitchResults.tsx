"use client";

import { useState, useEffect } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContentGrid } from "./ContentGrid";
import { LoadingSpinner } from "./LoadingSpinner";
import { TwitchStream, TwitchGame, TwitchUser, TwitchSearchChannel } from "../types";
import { twitchAPI } from "../_services/twitchAPI";
import { useTranslations } from "next-intl";
import { InternalLink } from "@/components/nav/Link";

export default function TwitchResults() {
  const t = useTranslations("twitch");
  const [search, setSearch] = useState("");
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

  const handleSearch = async () => {
    if (!search.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const [streamsData, usersData, gamesData] = await Promise.all([
        twitchAPI.searchStreams(search, 20),
        twitchAPI.searchChannels(search, 10),
        twitchAPI.searchGames(search, 8)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasSearchResults = 
    searchResults.streams.length > 0 || 
    searchResults.users.length > 0 || 
    searchResults.games.length > 0;

  return (
    <div className="min-h-full bg-surface-900 text-white overflow-auto">
      <header className="sticky top-0 z-10 bg-surface-800/95 backdrop-blur-sm shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-grow max-w-2xl">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow pr-10 bg-surface-700 text-white placeholder-surface-400 border-surface-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder={t("search.placeholder")}
                aria-label={t("search.placeholder")}
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
            </div>
            
            <div className="flex items-center gap-4 ml-4">
              <Button
                onClick={handleSearch}
                className="bg-purple-600 hover:bg-purple-700 transition-colors"
                disabled={isLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                {t("search.button")}
              </Button>
              
              <InternalLink 
                href="twitch/history" 
                className="flex items-center text-surface-300 hover:text-purple-500 transition-colors"
              >
                <Users className="h-5 w-5 mr-2" />
                {t("history.title")}
              </InternalLink>
            </div>
          </div>
        </div>
      </header>
      
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
                      href={`twitch/user/${user.broadcaster_login}`}
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
