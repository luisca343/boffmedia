"use client";

import { useState } from "react";
import { Search, History } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { useTranslations } from "next-intl";
import { InternalLink } from "@/components/ui/navigation/Link";
import { getTheme } from "../themes";

interface BaseSearchHeaderProps {
  platform: "youtube" | "twitch";
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const BaseSearchHeader = ({ 
  platform, 
  onSearch, 
  isLoading = false,
  placeholder 
}: BaseSearchHeaderProps) => {
  const [search, setSearch] = useState("");
  const t = useTranslations("common");
  const theme = getTheme(platform);

  const handleSearch = () => {
    if (!search.trim()) return;
    onSearch(search.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const defaultPlaceholder = platform === "youtube"
    ? t("search.youtubePlaceholder")
    : t("search.twitchPlaceholder");

  const platformConfig = {
    youtube: {
      buttonClass: "bg-red-600 hover:bg-red-700 text-white",
      searchButtonText: t("search.youtubeButton"),
      historyPath: "youtube/history"
    },
    twitch: {
      buttonClass: "bg-purple-600 hover:bg-purple-700 text-white",
      searchButtonText: t("search.twitchButton"),
      historyPath: "twitch/history"
    }
  };

  const config = platformConfig[platform];

  return (
    <header className="sticky top-0 z-10 bg-surface-800/95 backdrop-blur-sm shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder={placeholder || defaultPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-10 bg-surface-700 text-white placeholder-surface-400 border-surface-600 focus:border-surface-500"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
            </div>
            
            <Button
              onClick={handleSearch}
              variant="ghost"
              disabled={isLoading || !search.trim()}
              className={`${config.buttonClass} transition-colors px-6`}
            >
              {isLoading ? (
                <span>{t("search.searching")}</span>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  {config.searchButtonText}
                </>
              )}
            </Button>
          </div>
          
          <InternalLink href={config.historyPath}>
            <button 
              className="bg-surface-700 hover:bg-surface-600 p-2 rounded-lg transition-colors"
              title={t("history.title")}
            >
              <History size={20} />
            </button>
          </InternalLink>
        </div>
      </div>
    </header>
  );
};
