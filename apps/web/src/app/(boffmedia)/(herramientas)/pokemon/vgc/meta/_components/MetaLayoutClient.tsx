"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSmogonSnapshots } from "../_hooks/useSmogonSnapshots";
import { useSmogonUsage } from "../_hooks/useSmogonUsage";
import { useChampionsRegulations } from "../_hooks/useChampionsRegulations";
import { useChampionsUsage } from "../_hooks/useChampionsUsage";
import { useChampionsPasteDetail } from "../_hooks/useChampionsPasteDetail";
import { useLimitlessTournaments } from "../_hooks/useLimitlessTournaments";
import { useLimitlessUsage } from "../_hooks/useLimitlessUsage";
import { useLimitlessPlayers } from "../_hooks/useLimitlessPlayers";
import { useMetaNavigation, DEFAULT_CUTOFF } from "../_hooks/useMetaNavigation";
import { FormatBar } from "./FormatBar";
import { PokemonSidebar } from "./PokemonSidebar";
import { PokemonDetailView } from "./PokemonDetailView";
import { StandingsView } from "./StandingsView";
import { MetaSplitLayout } from "./MetaSplitLayout";

const FORMAT_LABELS: Record<string, string> = {
  gen9vgc2026regi: "VGC 2026 Reg I",
  gen9vgc2026regh: "VGC 2026 Reg H",
  gen9vgc2025regg: "VGC 2025 Reg G",
  gen9vgc2025regf: "VGC 2025 Reg F",
};

export function MetaLayoutClient() {
  const t            = useTranslations("vgc.meta");
  const searchParams = useSearchParams();

  // ── URL state — read inline to gate data hooks before they are called ──────
  const tab          = searchParams.get("tab")          ?? "stats";
  const format       = searchParams.get("format")       ?? "";
  const month        = searchParams.get("month")        ?? "";
  const cutoff       = Number(searchParams.get("cutoff") ?? DEFAULT_CUTOFF);
  const regulation   = searchParams.get("regulation")   ?? "";
  const tournamentId = searchParams.get("tournamentId") ?? "";

  // ── Determine format source — wait until both lists load before activating ─
  const snapshots   = useSmogonSnapshots();
  const regulations = useChampionsRegulations();
  const isSmogonFormat  = useMemo(() => snapshots.some(s => s.formatId === format),   [snapshots,   format]);
  const isPreviewFormat = useMemo(() => regulations.some(r => r.id    === format),    [regulations, format]);

  // ── Data hooks — inactive tab/source receives empty string and skips fetch ─
  const { entries: ladderEntries,    entriesMap: ladderMap,    loading: ladderLoading,    error: ladderError    } =
    useSmogonUsage(tab === "stats" && isSmogonFormat ? format : "", month, cutoff);
  const { entries: championsEntries, entriesMap: championsMap, loading: championsLoading, error: championsError } =
    useChampionsUsage(tab === "stats" && isPreviewFormat ? format : "");

  // ── Limitless hooks ────────────────────────────────────────────────────────
  const { tournaments } = useLimitlessTournaments(
    tab === "tournament" ? regulation || undefined : undefined,
  );
  const tournamentIdNum = tournamentId && tournamentId !== "combined" ? Number(tournamentId) : undefined;
  const { entries: tournamentEntries, entriesMap: tournamentMap, loading: tournamentLoading, error: tournamentError } =
    useLimitlessUsage(
      tab === "tournament" ? (tournamentId === "combined" || !tournamentId ? "combined" : tournamentIdNum) : undefined,
      tab === "tournament" ? regulation || undefined : undefined,
    );
  const { players: standingsPlayers, loading: standingsLoading, error: standingsError } =
    useLimitlessPlayers(tab === "tournament" ? tournamentIdNum : undefined);

  const entries    = tab === "tournament" ? tournamentEntries : isPreviewFormat ? championsEntries : ladderEntries;
  const entriesMap = tab === "tournament" ? tournamentMap     : isPreviewFormat ? championsMap     : ladderMap;
  const loading    = tab === "tournament" ? tournamentLoading : isPreviewFormat ? championsLoading : ladderLoading;
  const error      = tab === "tournament" ? tournamentError   : isPreviewFormat ? championsError   : ladderError;

  // ── Navigation hook — buildUrl, auto-navigation effects, all handlers ──────
  const { speciesId, detail: baseDetail, view, handleSelect, handleTabChange, handleFormatChange, handleOptionsApply, handleRegulationChange, handleTournamentChange, handleViewChange, handleBack } =
    useMetaNavigation({ snapshots, regulations, entries, entriesMap });

  // ── Phase 3: paste-derived data for preview formats ───────────────────────
  const { detail: pasteDetail } = useChampionsPasteDetail(
    isPreviewFormat ? speciesId : undefined,
    isPreviewFormat ? format    : undefined,
  );

  const detail = useMemo(() => {
    if (!baseDetail || !isPreviewFormat || !pasteDetail) return baseDetail;
    return {
      ...baseDetail,
      abilities: pasteDetail.abilities.length > 0 ? pasteDetail.abilities : baseDetail.abilities,
      items:     pasteDetail.items.length     > 0 ? pasteDetail.items     : baseDetail.items,
      moves:     pasteDetail.moves.length     > 0 ? pasteDetail.moves     : baseDetail.moves,
      teraTypes: pasteDetail.teraTypes.length > 0 ? pasteDetail.teraTypes : baseDetail.teraTypes,
      spreads:   pasteDetail.spreads.length   > 0 ? pasteDetail.spreads   : baseDetail.spreads,
    };
  }, [baseDetail, pasteDetail, isPreviewFormat]);

  return (
    <div className="flex flex-col bg-surface-950 min-h-screen">
      <FormatBar
        tab={tab}
        format={format}
        month={month}
        cutoff={cutoff}
        regulation={regulation}
        tournamentId={tournamentId}
        snapshots={snapshots}
        regulations={regulations}
        tournaments={tournaments}
        formatLabels={FORMAT_LABELS}
        onTabChange={handleTabChange}
        onFormatChange={handleFormatChange}
        onOptionsApply={handleOptionsApply}
        onRegulationChange={handleRegulationChange}
        onTournamentChange={handleTournamentChange}
      />

      {/* Preview notice for VGCPastes-backed formats */}
      {tab === "stats" && isPreviewFormat && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-amber-500/5 border-b border-amber-500/20 text-xs text-amber-400/80">
          <Info className="w-3.5 h-3.5 shrink-0" />
          {t("tabs.championsPreviewNotice")}
        </div>
      )}

      {/* Aggregate / Players sub-tab strip — tournament tab only */}
      {tab === "tournament" && (
        <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-surface-800 bg-surface-950">
          {(["aggregate", "players"] as const).map((v) => (
            <button
              key={v}
              onClick={() => handleViewChange(v)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                view === v
                  ? "bg-surface-700 text-surface-100"
                  : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/60",
              )}
            >
              {t(`tabs.${v}`)}
            </button>
          ))}
        </div>
      )}

      {/* Players / Standings view for tournament tab */}
      {tab === "tournament" && view === "players" ? (
        <StandingsView
          players={standingsPlayers}
          loading={standingsLoading}
          error={standingsError}
          tournamentId={tournamentIdNum}
        />
      ) : (
        <MetaSplitLayout
          hasSelection={!!speciesId}
          sidebar={
            <PokemonSidebar
              entries={entries}
              loading={loading}
              error={error}
              selectedId={speciesId}
              onSelect={handleSelect}
            />
          }
          detail={
            <PokemonDetailView
              detail={detail}
              loading={false}
              speciesId={speciesId}
              onBack={handleBack}
              onSelect={handleSelect}
            />
          }
        />
      )}
    </div>
  );
}

