"use client";

import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { ToolApp } from "@/components/boffmedia-v2/primitives/tool-app";
import { Icon } from "@/components/boffmedia-v2/primitives/icon";
import { VgcUsageSidebar } from "@/components/boffmedia-v2/ui/vgc/meta/usage-sidebar";
import { VgcPokemonDetail } from "@/components/boffmedia-v2/ui/vgc/meta/pokemon-detail";
import { VgcStandingsView } from "@/components/boffmedia-v2/ui/vgc/meta/standings-view";
import { VgcDivergenceView } from "@/components/boffmedia-v2/ui/vgc/meta/divergence-view";
import { VgcMetaService } from "@/services/api/boffmedia/vgcService";
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
import { useSpeciesTeams } from "../_hooks/useSpeciesTeams";
import { VgcToolbar } from "./VgcToolbar";
import { VgcSubbar } from "./VgcSubbar";
import { ENABLE_PREVIEW_FORMATS, FORMAT_LABELS } from "../constants";
import { toUsageEntry, toPokeData, toPlayerEntry, toDivergenceResult, toTeamEntry, toTeamSlot } from "../_lib/vgc-adapter";

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
    () => (selectedRegulation && !selectedRegulation.vgcPastesGid ? selectedRegulation.formatId : format),
    [selectedRegulation, format],
  );
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

  // ── Read view early for divergence gating ─────────────────────────────────
  const view_preread = searchParams.get("view") ?? "aggregate";

  // ── On-demand team cache for tournament standings ──────────────────────────
  const [teamCache, setTeamCache] = useState<Map<string, { team: { dex: number; name: string; tera: string; item: string; moves: string[] }[]; rawText: string }>>(new Map());

  const fetchTeam = useCallback(async (slug: string) => {
    if (!tournamentIdNum) return null;
    try {
      const res = await VgcMetaService.getLimitlessPlayerTeam(tournamentIdNum, slug);
      if (res.data) {
        const adapted = { team: res.data.slots.map((s) => toTeamSlot(s)), rawText: res.data.rawText };
        setTeamCache((prev) => new Map(prev).set(slug, adapted));
        return adapted;
      }
    } catch { /* ignore */ }
    return null;
  }, [tournamentIdNum]);

  // ── Divergence hook — only active when view=divergence in tournament tab ──
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

  // ── Teams for selected Pokémon ─────────────────────────────────────────────
  const resolvedTeamsRegId = isPreviewFormat ? format : teamsRegulationId;
  const { teams: speciesTeams } = useSpeciesTeams(
    speciesId || undefined,
    resolvedTeamsRegId,
  );

  // ── Adapt data for new components ──────────────────────────────────────────
  const usageEntries = useMemo(() => entries.map(toUsageEntry), [entries]);
  const pokeMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; dex: number; types: string[]; base: Record<string, number>; abilities: { name: string; pct: number }[]; items: { name: string; pct: number }[]; moves: { name: string; pct: number }[]; tera: { name: string; pct: number }[]; mates: { id: string; pct: number }[]; spreads: { nature: string; ev: number[]; pct: number }[] }> = {};
    for (const e of entries) {
      const pokeData = toPokeData(e);
      map[e.speciesId] = pokeData;
      map[e.speciesName] = pokeData;
    }
    return map;
  }, [entries]);

  const selectedEntry = useMemo(() => {
    if (!speciesId) return usageEntries[0] ?? null;
    return usageEntries.find((e) => e.id === speciesId) ?? null;
  }, [usageEntries, speciesId]);

  const selectedPokeData = useMemo(() => {
    const id = selectedEntry?.id ?? speciesId;
    return id ? pokeMap[id] ?? null : null;
  }, [pokeMap, selectedEntry, speciesId]);

  const adaptedPlayers = useMemo(
    () => standingsPlayers.map((p) => toPlayerEntry(p, new Map())),
    [standingsPlayers],
  );

  const adaptedDivergence = useMemo(
    () => (divergenceResult ? toDivergenceResult(divergenceResult) : null),
    [divergenceResult],
  );

  const adaptedTeams = useMemo(
    () => (speciesTeams.length > 0 ? speciesTeams.map(toTeamEntry) : undefined),
    [speciesTeams],
  );

  // ── Toolbar stats ──────────────────────────────────────────────────────────
  const totalBattles = ladderEntries.reduce((a, e) => a + e.rawCount, 0);
  const totalTeams   = tournamentEntries.reduce((a, e) => a + e.rawCount, 0);
  const tours = tournaments;
  const curTour = tournamentId && tournamentId !== "combined"
    ? tours.find((t2) => String(t2.id) === String(tournamentId))
    : undefined;

  // ── Subbar data ────────────────────────────────────────────────────────────
  const fmt = snapshots.find((s) => s.formatId === resolvedSmogonFormat);
  const cutoffLabel = cutoff === 0 ? "All ELO" : `${cutoff}+ ELO`;

  const toolbar = (
    <VgcToolbar
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
      totalBattles={totalBattles}
      totalTeams={totalTeams}
      onTabChange={handleTabChange}
      onFormatChange={handleFormatChange}
      onOptionsApply={handleOptionsApply}
      onRegulationChange={handleRegulationChange}
      onTournamentChange={handleTournamentChange}
    />
  );

  const subbar = (
    <VgcSubbar
      tab={tab}
      view={view}
      formatLabel={selectedRegulation?.name ?? fmt?.formatId ?? format}
      formatNote={selectedRegulation?.name ? `Regulación actual. Permite dos Pokémon restringidos por equipo.` : undefined}
      cutoffLabel={cutoffLabel}
      month={month}
      curTourName={curTour?.name ?? undefined}
      curTourPlayers={curTour?.playerCount ?? undefined}
      curTourIsCombined={tournamentId === "combined" || !tournamentId}
      combinedCount={tours.length}
      onViewChange={handleViewChange}
    />
  );

  // ── Body ───────────────────────────────────────────────────────────────────
  let body: React.ReactNode;
  if (tab === "tournament" && view === "players") {
    body = (
      <VgcStandingsView players={adaptedPlayers} teamCache={teamCache} onFetchTeam={fetchTeam} />
    );
  } else if (tab === "tournament" && view === "divergence") {
    body = (
      <VgcDivergenceView result={adaptedDivergence} pokeMap={pokeMap} />
    );
  } else {
    body = (
      <div className="flex-1 min-h-0 flex w-full">
        <aside className="w-[320px] shrink-0 flex flex-col min-h-0 border-r border-edge bg-[color-mix(in_srgb,var(--layer-1)_40%,transparent)]">
          <VgcUsageSidebar
            entries={usageEntries}
            pokeMap={pokeMap}
            selectedId={selectedEntry?.id ?? null}
            onSelect={handleSelect}
            loading={loading}
            error={error}
          />
        </aside>
        <main className="flex-1 min-w-0 overflow-y-auto">
          {selectedPokeData && selectedEntry ? (
            <VgcPokemonDetail
              detail={selectedPokeData}
              entry={selectedEntry}
              pokeMap={pokeMap}
              onSelect={handleSelect}
              teams={adaptedTeams}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-ink-dim p-8">
              <Icon name="database" size={26} />
              <p className="text-sm max-w-[32ch] text-center">Elige un Pokémon de la lista para ver su detalle competitivo.</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <ToolApp className="vgc-app" toolbar={toolbar} subbar={subbar}>
      {/* Preview notice for VGCPastes-backed formats */}
      {tab === "stats" && isPreviewFormat && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-amber-500/5 border-b border-amber-500/20 text-xs text-amber-400/80">
          <Info className="w-3.5 h-3.5 shrink-0" />
          {t("tabs.championsPreviewNotice")}
        </div>
      )}
      {body}
    </ToolApp>
  );
}
