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
import { useDivergence } from "../_hooks/useDivergence";
import { useMetaNavigation, DEFAULT_CUTOFF } from "../_hooks/useMetaNavigation";
import { FormatBar } from "./FormatBar";
import { PokemonSidebar } from "./PokemonSidebar";
import { PokemonDetailView } from "./PokemonDetailView";
import { StandingsView } from "./StandingsView";
import { DivergenceView } from "./DivergenceView";
import { MetaSplitLayout } from "./MetaSplitLayout";
import { ENABLE_PREVIEW_FORMATS, FORMAT_LABELS } from "../constants";

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
  const selectedRegulation = useMemo(
    () => regulations.find((r) => r.id === format),
    [regulations, format],
  );
  const isPreviewFormat = useMemo(
    () => ENABLE_PREVIEW_FORMATS && Boolean(selectedRegulation?.vgcPastesGid),
    [selectedRegulation],
  );
  const resolvedSmogonFormat = useMemo(
    // If `format` points to a regulation that has no VGCPastes GID, treat it as
    // a Smogon-backed regulation and resolve to its formatId.
    () => (selectedRegulation && !selectedRegulation.vgcPastesGid ? selectedRegulation.formatId : format),
    [selectedRegulation, format],
  );
  // Regulation ID to use for the teams panel: prefer the tournament-tab URL param,
  // then the regulation whose ID matches `format`, then the regulation whose formatId
  // matches `resolvedSmogonFormat` (for raw Smogon format IDs like "gen9vgc2026regf").
  const teamsRegulationId = useMemo(
    () => regulation || selectedRegulation?.id || regulations.find((r) => r.formatId === resolvedSmogonFormat)?.id || undefined,
    [regulation, selectedRegulation, regulations, resolvedSmogonFormat],
  );
  const isSmogonFormat = useMemo(
    () => snapshots.some((s) => s.formatId === resolvedSmogonFormat),
    [snapshots, resolvedSmogonFormat],
  );

  // ── Data hooks — inactive tab/source receives empty string and skips fetch ─
  const { entries: ladderEntries,    entriesMap: ladderMap,    loading: ladderLoading,    error: ladderError    } =
    useSmogonUsage(tab === "stats" && isSmogonFormat && !isPreviewFormat ? resolvedSmogonFormat : "", month, cutoff);
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

  // ── Divergence hook — only active when view=divergence in tournament tab ──
  const view_preread = searchParams.get("view") ?? "aggregate";
  const divergenceRegulation = tab === "tournament" && view_preread === "divergence" ? regulation || undefined : undefined;
  const divergenceTournamentId = tab === "tournament" && view_preread === "divergence"
    ? (tournamentId === "combined" || !tournamentId ? "combined" : tournamentIdNum)
    : undefined;
  const { result: divergenceResult, loading: divergenceLoading, error: divergenceError } =
    useDivergence(divergenceRegulation, divergenceTournamentId, "", DEFAULT_CUTOFF);

  const entries    = tab === "tournament" ? tournamentEntries : isPreviewFormat ? championsEntries : ladderEntries;
  const entriesMap = tab === "tournament" ? tournamentMap     : isPreviewFormat ? championsMap     : ladderMap;
  const loading    = tab === "tournament" ? tournamentLoading : isPreviewFormat ? championsLoading : ladderLoading;
  const error      = tab === "tournament" ? tournamentError   : isPreviewFormat ? championsError   : ladderError;

  // ── Navigation hook — buildUrl, auto-navigation effects, all handlers ──────
  const { speciesId, detail: baseDetail, view, handleSelect, handleTabChange, handleFormatChange, handleOptionsApply, handleRegulationChange, handleTournamentChange, handleViewChange, handleBack } =
    useMetaNavigation({ snapshots, regulations, tournaments, entries, entriesMap });

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
    <div className="flex flex-col bg-surface-900 h-[calc(100vh-4rem)] overflow-hidden">
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

      {/* Aggregate / Players / Divergence sub-tab strip — tournament tab only */}
      {tab === "tournament" && (
        <div className="shrink-0 px-3 py-2 border-b border-surface-700 bg-gradient-to-r from-surface-900 via-surface-900 to-surface-800/85">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-surface-700/70 scrollbar-track-transparent">
            <div className="inline-flex min-w-max items-center gap-1 rounded-xl border border-surface-700/80 bg-surface-800/70 p-1">
              {(["aggregate", "players", "divergence"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                    view === v
                      ? "bg-primary-500/20 text-primary-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)]"
                      : "text-surface-400 hover:text-surface-100 hover:bg-surface-700/40",
                  )}
                >
                  {t(`tabs.${v}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      {tab === "tournament" && view === "players" ? (
        <StandingsView
          players={standingsPlayers}
          loading={standingsLoading}
          error={standingsError}
          tournamentId={tournamentIdNum}
        />
      ) : tab === "tournament" && view === "divergence" ? (
        <DivergenceView
          result={divergenceResult}
          loading={divergenceLoading}
          error={divergenceError}
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
              regulationId={isPreviewFormat ? format : teamsRegulationId}
              onBack={handleBack}
              onSelect={handleSelect}
            />
          }
        />
      )}
      </div>
    </div>
  );
}

