"use client";

import { useMemo, useState, useCallback } from "react";
import { useVgcNav, VgcRoot } from "../../routing";
import { useVgcT } from "../../i18n";
import { DkApp, DkBody, useDkNarrow } from "@boffmedia/ui/datakit";
import { Icon } from "@boffmedia/ui"
import { VgcMetaService } from "../../service";
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
import { MvList } from "./MvList";
import { MvDetail } from "./MvDetail";
import { MvPlayers } from "./MvPlayers";
import { MvDivergence } from "./MvDivergence";
import { FORMAT_LABELS } from "../constants";
import { toUsageEntry, toPokeData, toPlayerEntry, toDivergenceResult, toTeamEntry, toTeamSlot } from "../_lib/vgc-adapter";
import type { PokeData, TeamSlot } from "../_lib/meta-types";

function MetaScreen() {
  const t            = useVgcT("meta");
  const { query: searchParams } = useVgcNav();
  const narrow       = useDkNarrow(980);

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
  // `format` is a regulation id for registered regulations; older URLs may
  // still carry the bare formatId, so accept either key.
  const selectedRegulation = useMemo(
    () => regulations.find((r) => r.id === format) ?? regulations.find((r) => r.formatId === format),
    [regulations, format],
  );
  // `format` carries a regulation id when one is registered, a bare Smogon
  // formatId otherwise. Snapshots are only ever keyed by formatId.
  const resolvedSmogonFormat = useMemo(
    () => selectedRegulation?.formatId ?? format,
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
  // Smogon wins whenever a ladder snapshot exists; the VGCPastes sheet is the
  // fallback for regulations that have no ladder data imported yet.
  const isChampionsFormat = useMemo(
    () => Boolean(selectedRegulation?.vgcPastesGid) && !isSmogonFormat,
    [selectedRegulation, isSmogonFormat],
  );

  // ── Data hooks — inactive tab/source receives empty string and skips fetch ─
  const { entries: ladderEntries,    entriesMap: ladderMap,    loading: ladderLoading,    error: ladderError    } =
    useSmogonUsage(tab === "stats" && isSmogonFormat && !isChampionsFormat ? resolvedSmogonFormat : "", month, cutoff);
  const { entries: championsEntries, entriesMap: championsMap, loading: championsLoading, error: championsError } =
    useChampionsUsage(tab === "stats" && isChampionsFormat ? format : "");

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
  const { players: standingsPlayers, loading: standingsLoading } =
    useLimitlessPlayers(tab === "tournament" ? tournamentIdNum : undefined);

  // ── Read view early for divergence gating ─────────────────────────────────
  const view_preread = searchParams.get("view") ?? "aggregate";

  // ── On-demand team cache for tournament standings ──────────────────────────
  const [teamCache, setTeamCache] = useState<Map<string, { team: TeamSlot[]; rawText: string }>>(new Map());

  const fetchTeam = useCallback(async (slug: string) => {
    if (!tournamentIdNum) return null;
    try {
      const res = await VgcMetaService.getLimitlessPlayerTeam(tournamentIdNum, slug);
      if (res.data) {
        const adapted = { team: res.data.slots.map((s) => toTeamSlot(s, t("adapter.teraNone"))), rawText: res.data.rawText };
        setTeamCache((prev) => new Map(prev).set(slug, adapted));
        return adapted;
      }
    } catch { /* ignore */ }
    return null;
  }, [tournamentIdNum, t]);

  // ── Divergence hook — only active when view=divergence in tournament tab ──
  const divergenceRegulation = tab === "tournament" && view_preread === "divergence" ? regulation || undefined : undefined;
  const divergenceTournamentId = tab === "tournament" && view_preread === "divergence"
    ? (tournamentId === "combined" || !tournamentId ? "combined" : tournamentIdNum)
    : undefined;
  const { result: divergenceResult, loading: divergenceLoading } =
    useDivergence(divergenceRegulation, divergenceTournamentId, "", DEFAULT_CUTOFF);

  const entries    = tab === "tournament" ? tournamentEntries : isChampionsFormat ? championsEntries : ladderEntries;
  const entriesMap = tab === "tournament" ? tournamentMap     : isChampionsFormat ? championsMap     : ladderMap;
  const loading    = tab === "tournament" ? tournamentLoading : isChampionsFormat ? championsLoading : ladderLoading;
  const error      = tab === "tournament" ? tournamentError   : isChampionsFormat ? championsError   : ladderError;

  // ── Navigation hook — buildUrl, auto-navigation effects, all handlers ──────
  const { speciesId, view, handleSelect, handleTabChange, handleFormatChange, handleOptionsApply, handleRegulationChange, handleTournamentChange, handleViewChange, handleBack } =
    useMetaNavigation({ snapshots, regulations, tournaments, entries, entriesMap });

  // ── Paste-derived data for preview formats ────────────────────────────────
  const { detail: pasteDetail } = useChampionsPasteDetail(
    isChampionsFormat ? speciesId : undefined,
    isChampionsFormat ? format    : undefined,
  );

  // ── Adapt data ─────────────────────────────────────────────────────────────
  const usageEntries = useMemo(() => entries.map(toUsageEntry), [entries]);
  const pokeMap = useMemo(() => {
    const map: Record<string, PokeData> = {};
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

  const selectedRank = useMemo(
    () => (selectedEntry ? usageEntries.indexOf(selectedEntry) + 1 : null),
    [usageEntries, selectedEntry],
  );

  const selectedPokeData = useMemo(() => {
    const id = selectedEntry?.id ?? speciesId;
    if (!id) return null;
    const base = pokeMap[id] ?? null;
    if (!base || !isChampionsFormat || !pasteDetail) return base;
    return {
      ...base,
      abilities: pasteDetail.abilities.length > 0 ? pasteDetail.abilities.map((a) => ({ name: a.name, pct: a.percent })) : base.abilities,
      items:     pasteDetail.items.length     > 0 ? pasteDetail.items.map((a) => ({ name: a.name, pct: a.percent }))     : base.items,
      moves:     pasteDetail.moves.length     > 0 ? pasteDetail.moves.map((a) => ({ name: a.name, pct: a.percent }))     : base.moves,
      tera:      pasteDetail.teraTypes.length > 0 ? pasteDetail.teraTypes.map((a) => ({ name: a.name, pct: a.percent })) : base.tera,
      spreads:   pasteDetail.spreads.length   > 0 ? pasteDetail.spreads.map((s) => ({ nature: s.nature, ev: s.spread.split("/").map(Number), pct: s.percent })) : base.spreads,
    };
  }, [pokeMap, selectedEntry, speciesId, isChampionsFormat, pasteDetail]);

  const adaptedPlayers = useMemo(
    () => standingsPlayers.map((p) => toPlayerEntry(p, new Map(), t("adapter.teraNone"))),
    [standingsPlayers, t],
  );

  const adaptedDivergence = useMemo(
    () => (divergenceResult ? toDivergenceResult(divergenceResult) : null),
    [divergenceResult],
  );

  // ── Teams for selected Pokémon ─────────────────────────────────────────────
  const resolvedTeamsRegId = isChampionsFormat ? format : teamsRegulationId;
  const { teams: speciesTeams, loading: teamsLoading } = useSpeciesTeams(
    speciesId || undefined,
    resolvedTeamsRegId,
  );
  const adaptedTeams = useMemo(
    () => speciesTeams.map((entry) => toTeamEntry(entry, t("adapter.teamFallback"), t("adapter.teraNone"))),
    [speciesTeams, t],
  );

  // ── Toolbar / subbar derived data ──────────────────────────────────────────
  const totalBattles = ladderEntries.reduce((a, e) => a + e.rawCount, 0);
  const totalTeams   = tournamentEntries.reduce((a, e) => a + e.rawCount, 0);
  const curTour = tournamentId && tournamentId !== "combined"
    ? tournaments.find((t2) => String(t2.id) === String(tournamentId))
    : undefined;
  const fmt = snapshots.find((s) => s.formatId === resolvedSmogonFormat);
  const cutoffLabel = cutoff === 0 ? t("cutoff.all") : `${cutoff}+ ELO`;

  // ── Body ───────────────────────────────────────────────────────────────────
  const isSplit = tab === "stats" || view === "aggregate";

  let body: React.ReactNode;
  if (!isSplit && view === "players") {
    body = (
      <DkBody>
        <MvPlayers players={adaptedPlayers} loading={standingsLoading} teamCache={teamCache} onFetchTeam={fetchTeam} />
      </DkBody>
    );
  } else if (!isSplit) {
    body = (
      <DkBody>
        <MvDivergence result={adaptedDivergence} pokeMap={pokeMap} loading={divergenceLoading} />
      </DkBody>
    );
  } else if (narrow) {
    body = speciesId && selectedPokeData ? (
      <div className="flex min-h-0 flex-1 flex-col max-[980px]:overflow-visible">
        <MvDetail
          className="flex-1"
          detail={selectedPokeData}
          entry={selectedEntry}
          rank={selectedRank}
          pokeMap={pokeMap}
          onSelect={handleSelect}
          onBack={handleBack}
          loading={loading}
          teams={adaptedTeams}
          teamsLoading={teamsLoading}
        />
      </div>
    ) : (
      <div className="flex min-h-0 flex-1 flex-col max-[980px]:overflow-visible">
        <MvList className="flex-1" entries={usageEntries} pokeMap={pokeMap} selectedId={selectedEntry?.id ?? null} onSelect={handleSelect} loading={loading} error={error} />
      </div>
    );
  } else {
    body = (
      // Split view: the ranking is a sticky, self-scrolling column and the detail
      // rides the page scroll — DkApp does not bound their height.
      <div className="grid min-h-0 flex-1 items-start grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <MvList
          className="sticky top-[calc(var(--tool-sticky-top,0px)_+_var(--tool-bar-h,58px))] h-[calc(100dvh_-_var(--tool-sticky-top,0px)_-_var(--tool-bar-h,58px))] border-r border-solid border-line"
          entries={usageEntries}
          pokeMap={pokeMap}
          selectedId={selectedEntry?.id ?? null}
          onSelect={handleSelect}
          loading={loading}
          error={error}
        />
        <MvDetail
          detail={selectedPokeData}
          entry={selectedEntry}
          rank={selectedRank}
          pokeMap={pokeMap}
          onSelect={handleSelect}
          loading={loading}
          teams={adaptedTeams}
          teamsLoading={teamsLoading}
        />
      </div>
    );
  }

  return (
    <DkApp className="min-w-0">
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
      <VgcSubbar
        tab={tab}
        view={view}
        formatLabel={selectedRegulation?.name ?? fmt?.formatId ?? format}
        formatNote={selectedRegulation?.name ? t("sub.formatNote") : undefined}
        cutoffLabel={cutoffLabel}
        month={month}
        curTourName={curTour?.name ?? undefined}
        curTourPlayers={curTour?.playerCount ?? undefined}
        curTourIsCombined={tournamentId === "combined" || !tournamentId}
        combinedCount={tournaments.length}
        onViewChange={handleViewChange}
      />

      {tab === "stats" && isChampionsFormat && (
        <div className="flex flex-none items-center gap-2 border-b border-solid border-warn/20 bg-warn/5 px-3 py-2 text-[12px] text-warn">
          <Icon name="info" size={14} className="flex-none" />
          {t("tabs.championsNotice")}
        </div>
      )}
      {body}
    </DkApp>
  );
}

/**
 * The registry mounts this component straight out of the manifest, so it brings
 * its own router root. Under a host that already provided one (apps/web wraps
 * its routes in `VgcNavProvider`) this is a pass-through — see `VgcRoot`.
 */
export function MetaLayoutClient() {
  return (
    <VgcRoot initialHref="/pokemon/vgc/meta">
      <MetaScreen />
    </VgcRoot>
  )
}
