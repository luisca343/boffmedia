"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { useTranslations } from "next-intl";
import { getTheme } from "../themes";

interface BaseSearchProps {
  platform: "youtube" | "twitch";
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const BaseSearch = ({ 
  platform, 
  onSearch, 
  isLoading = false,
  placeholder 
}: BaseSearchProps) => {
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
    ? "Search YouTube..." 
    : "Search channels, games or streams...";

  return (
    <div className="bg-surface-800 p-6 rounded-lg shadow-lg mb-8">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={placeholder || defaultPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-surface-700 border-surface-600 text-white placeholder-surface-400 focus:border-surface-500"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isLoading || !search.trim()}
          className={platform === "youtube" 
            ? "bg-red-500 hover:bg-red-600 text-white px-6"
            : "bg-purple-500 hover:bg-purple-600 text-white px-6"
          }
        >
          {isLoading ? (
            <span>{t("search.searching")}</span>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              {t("search.button")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
