"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types";
import { PokemonUsageDetail } from "@/services/api/boffmedia/vgcService";
import { Input } from "@/components/ui/primitives/input";

interface Props {
  entries:    PokemonUsageDetail[];
  loading:    boolean;
  error:      string | null;
  selectedId: string | undefined;
  onSelect:   (speciesId: string) => void;
}

export function PokemonSidebar({ entries, loading, error, selectedId, onSelect }: Props) {
  const t = useTranslations("vgc.meta");
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? entries.filter((e) =>
        e.speciesName.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="shrink-0 px-2 py-2 border-b border-surface-700">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("sidebar.search")}
          variant="default"
          className="h-8 text-sm"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="py-12 flex justify-center text-surface-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <p className="py-8 px-4 text-center text-xs text-red-400">{error}</p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-surface-600">
            {t("sidebar.noResults")}
          </p>
        )}

        {!loading &&
          !error &&
          filtered.map((entry) => {
            const rank       = entries.indexOf(entry) + 1;
            const isSelected = entry.speciesId === selectedId;

            return (
              <button
                key={entry.speciesId}
                onClick={() => onSelect(entry.speciesId)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 border-b border-surface-700/40 transition-colors text-left",
                  isSelected
                    ? "bg-primary-500/10 border-l-2 border-l-primary-400"
                    : "hover:bg-surface-700/30"
                )}
              >
                <span className="text-[11px] text-surface-500 tabular-nums font-mono w-8 shrink-0 text-right">
                  #{rank}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spriteUrl(entry.speciesName)}
                  alt={entry.speciesName}
                  width={32}
                  height={32}
                  className="object-contain shrink-0"
                  onError={handleSpriteError}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-surface-100 truncate">
                    {entry.speciesName}
                  </p>
                </div>
                <span className="text-[11px] text-surface-400 tabular-nums font-mono shrink-0">
                  {entry.usagePercent.toFixed(2)}%
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
