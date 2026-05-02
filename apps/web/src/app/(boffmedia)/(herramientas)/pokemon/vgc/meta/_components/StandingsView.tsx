"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LimitlessPlayerEntry,
  LimitlessPlayerTeam,
  VgcMetaService,
} from "@/services/api/boffmedia/vgcService";
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types";

interface Props {
  players:      LimitlessPlayerEntry[];
  loading:      boolean;
  error:        string | null;
  tournamentId: number | undefined;
}

export function StandingsView({ players, loading, error, tournamentId }: Props) {
  const t = useTranslations("vgc.meta.standings");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [teamCache,    setTeamCache]    = useState<Map<string, LimitlessPlayerTeam>>(new Map());
  const [teamLoading,  setTeamLoading]  = useState<string | null>(null);
  const [copied,       setCopied]       = useState<string | null>(null);
  const fetchedRef   = useRef(new Set<string>());
  const detailRowRef = useRef<HTMLTableRowElement | null>(null);

  // Scroll the expanded detail row into view after it renders
  useEffect(() => {
    if (!expandedSlug || !detailRowRef.current) return;
    detailRowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [expandedSlug, teamCache]);

  // Prefetch all teams as soon as the player list is available
  useEffect(() => {
    if (!tournamentId || !players.length) return;
    fetchedRef.current.clear();
    for (const player of players) {
      if (!player.hasTeam) continue;
      if (fetchedRef.current.has(player.playerSlug)) continue;
      fetchedRef.current.add(player.playerSlug);
      VgcMetaService.getLimitlessPlayerTeam(tournamentId, player.playerSlug)
        .then((res) => {
          if (res.data) {
            setTeamCache((prev) => new Map(prev).set(player.playerSlug, res.data!));
          }
        })
        .catch(() => {/* ignore individual fetch errors */});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, players]);

  const handleRowClick = async (player: LimitlessPlayerEntry) => {
    if (!player.hasTeam || !tournamentId) return;
    if (expandedSlug === player.playerSlug) {
      setExpandedSlug(null);
      return;
    }
    setExpandedSlug(player.playerSlug);
    // Fallback fetch in case the prefetch hasn't resolved yet
    if (!teamCache.has(player.playerSlug) && !fetchedRef.current.has(player.playerSlug)) {
      setTeamLoading(player.playerSlug);
      try {
        const res = await VgcMetaService.getLimitlessPlayerTeam(tournamentId, player.playerSlug);
        if (res.data) {
          setTeamCache((prev) => new Map(prev).set(player.playerSlug, res.data!));
        }
      } finally {
        setTeamLoading(null);
      }
    }
  };

  const handleCopy = async (slug: string, rawText: string) => {
    await navigator.clipboard.writeText(rawText);
    setCopied(slug);
    setTimeout(() => setCopied((c) => (c === slug ? null : c)), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-surface-500 text-sm">
        {t("loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>
    );
  }

  if (!players.length) {
    return (
      <div className="flex items-center justify-center h-full text-surface-500 text-sm">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-auto border border-surface-700/80 bg-surface-800/50 shadow-sm">
        <table className="w-full min-w-[46rem] text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-surface-900/95 backdrop-blur-sm">
            <tr className="border-b border-surface-700/70 text-left text-surface-400 text-[11px] uppercase tracking-[0.08em]">
              <th className="py-2 px-3 w-12 font-medium">{t("col.rank")}</th>
              <th className="py-2 px-3 font-medium">{t("col.player")}</th>
              <th className="py-2 px-3 w-24 font-medium">{t("col.record")}</th>
              <th className="py-2 px-3 font-medium">{t("col.team")}</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const isExpanded    = expandedSlug === player.playerSlug;
              const team          = teamCache.get(player.playerSlug);
              const isLoadingTeam = teamLoading === player.playerSlug;

              return (
                <Fragment key={player.playerSlug}>
                  <tr
                    onClick={() => handleRowClick(player)}
                    className={cn(
                      "border-b border-surface-700/35 transition-colors",
                      player.hasTeam
                        ? "cursor-pointer hover:bg-surface-700/20"
                        : "opacity-50 cursor-default",
                    )}
                  >
                    <td className="py-3 px-3 text-surface-400 font-mono text-xs tabular-nums">
                      {player.placing || "—"}
                    </td>

                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1.5">
                        {player.hasTeam ? (
                          isExpanded
                            ? <ChevronDown  className="w-3.5 h-3.5 shrink-0 text-surface-400" />
                            : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-surface-500" />
                        ) : (
                          <span className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="text-surface-100">{player.playerName}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-xs">
                      <span className="inline-flex items-center rounded-md border border-surface-700/80 bg-surface-800/80 px-2 py-0.5 text-surface-300 font-mono tabular-nums">
                        {player.record || "—"}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {isLoadingTeam ? (
                        <span className="text-surface-500 text-xs">{t("teamLoading")}</span>
                      ) : team ? (
                        <div className="flex items-center gap-1">
                          {team.slots.slice(0, 6).map((slot) => (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              key={slot.slotIndex}
                              src={spriteUrl(slot.speciesName)}
                              alt={slot.speciesName}
                              width={40}
                              height={40}
                              className="object-contain"
                              onError={handleSpriteError}
                            />
                          ))}
                        </div>
                      ) : player.hasTeam ? (
                        <span className="text-surface-700 text-xs animate-pulse">{t("teamLoading")}</span>
                      ) : (
                        <span className="text-surface-700 text-xs">—</span>
                      )}
                    </td>
                  </tr>

                  {isExpanded && team && (
                    <tr
                      ref={detailRowRef}
                      key={`${player.playerSlug}-detail`}
                      className="border-b border-surface-700/35 bg-surface-900/45"
                    >
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(player.playerSlug, team.rawText); }}
                            className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-100 transition-colors px-2 py-1 rounded border border-surface-700 hover:border-surface-500"
                          >
                            {copied === player.playerSlug
                              ? <><Check className="w-3 h-3 text-green-400" /> {t("copied")}</>
                              : <><Copy className="w-3 h-3" /> {t("copyPaste")}</>}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                          {team.slots.map((slot) => (
                            <div
                              key={slot.slotIndex}
                              className="flex flex-col items-center gap-1 bg-surface-800/75 border border-surface-700/70 rounded-lg p-2"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={spriteUrl(slot.speciesName)}
                                alt={slot.speciesName}
                                width={52}
                                height={52}
                                className="object-contain"
                                onError={handleSpriteError}
                              />
                              <span className="text-xs text-surface-200 font-medium text-center leading-tight">
                                {slot.speciesName}
                              </span>
                              {slot.item && (
                                <span className="text-xs text-surface-400 text-center leading-tight">
                                  {slot.item}
                                </span>
                              )}
                              {slot.tera && (
                                <span className="text-xs text-amber-400/80 text-center leading-tight">
                                  {t("tera", { type: slot.tera })}
                                </span>
                              )}
                              {slot.moves.length > 0 && (
                                <ul className="text-xs text-surface-500 space-y-0.5 w-full mt-0.5">
                                  {slot.moves.slice(0, 4).map((m) => (
                                    <li key={m} className="truncate text-center">{m}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
