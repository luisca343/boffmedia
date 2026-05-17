"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types";
import { PokemonUsageDetail } from "@/services/api/boffmedia/vgcService";
import { Input } from "@/components/ui/primitives/input";
import { formatCountWithDots } from "../constants";

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
    <div className="flex flex-col h-full ">
      {/* Search */}
      <div className="shrink-0 px-3 py-3 border-b border-surface-700 bg-surface-900/60 backdrop-blur-sm ">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("sidebar.search")}
          variant="default"
          className="h-8 text-sm bg-surface-800/60 border-surface-700/70 placeholder:text-surface-500 focus:border-primary-400"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto ">
        {loading && (
          <div className="py-12 flex justify-center text-surface-500 ">
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

        {!loading && !error && (
          <div className="p-2 space-y-1 ">
            {filtered.map((entry) => {
              const rank = entries.indexOf(entry) + 1;
              const isSelected = entry.speciesId === selectedId;

              return (
                <button
                  key={entry.speciesId}
                  onClick={() => onSelect(entry.speciesId)}
                  className={cn(
                    "group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-transparent transition-all text-left ",
                    isSelected
                      ? "bg-primary-500/10 border-primary-400/30 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.12)]"
                      : "hover:bg-surface-800/60 hover:border-surface-700/70"
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] tabular-nums font-mono w-8 shrink-0 text-right ",
                      isSelected ? "text-primary-300" : "text-surface-500"
                    )}
                  >
                    #{rank}
                  </span>

                  { }
                  <img
                    src={spriteUrl(entry.speciesName)}
                    alt={entry.speciesName}
                    width={34}
                    height={34}
                    className="object-contain shrink-0 drop-shadow-sm"
                    onError={handleSpriteError}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-100 truncate">
                      {entry.speciesName}
                    </p>
                    <p className="text-[10px] text-surface-500 tabular-nums font-mono mt-0.5">
                      {formatCountWithDots(entry.rawCount)}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "text-[11px] tabular-nums font-mono shrink-0",
                      isSelected ? "text-primary-300" : "text-surface-400"
                    )}
                  >
                    {entry.usagePercent.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
