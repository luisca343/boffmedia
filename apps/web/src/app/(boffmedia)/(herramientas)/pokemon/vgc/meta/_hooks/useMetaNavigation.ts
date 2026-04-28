"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
  ChampionsRegulation,
  LimitlessTournament,
  PokemonUsageDetail,
  SmogonSnapshot,
} from "@/services/api/boffmedia/vgcService";

const BASE_PATH      = "/pokemon/vgc/meta";
export const DEFAULT_CUTOFF = 1760;

export interface MetaUrlState {
  tab:          string;
  format:       string;
  month:        string;
  cutoff:       number;
  regulation:   string;
  speciesId:    string | undefined;
  tournamentId: string;
  view:         string;
}

export interface MetaNavigationHandlers {
  handleSelect:            (id: string) => void;
  handleTabChange:         (newTab: string) => void;
  handleFormatChange:      (newFormat: string, newMonth: string, newCutoff: number) => void;
  handleOptionsApply:      (newMonth: string, newCutoff: number) => void;
  handleRegulationChange:  (newRegulation: string) => void;
  handleTournamentChange:  (newTournamentId: string) => void;
  handleViewChange:        (newView: string) => void;
  handleBack:              () => void;
}

export interface UseMetaNavigationResult extends MetaNavigationHandlers {
  /** Route param — identifies the selected Pokémon */
  speciesId:    string | undefined;
  tournamentId: string;
  view:         string;
  detail:       PokemonUsageDetail | null;
}

function buildUrl(opts: MetaUrlState) {
  const { speciesId, tab, format, month, cutoff, regulation, tournamentId, view } = opts;
  const params = new URLSearchParams();
  if (tab !== "stats") params.set("tab", tab);
  if (tab === "stats") {
    if (format) params.set("format", format);
    if (month)  params.set("month",  month);
    if (cutoff !== DEFAULT_CUTOFF) params.set("cutoff", String(cutoff));
  } else if (tab === "tournament") {
    if (regulation)             params.set("regulation",   regulation);
    if (tournamentId)           params.set("tournamentId", tournamentId);
    if (view && view !== "aggregate") params.set("view", view);
  }
  const base = speciesId ? `${BASE_PATH}/${speciesId}` : BASE_PATH;
  const qs   = params.toString();
  return qs ? `${base}?${qs}` : base;
}

interface UseMetaNavigationOpts {
  snapshots:   SmogonSnapshot[];
  regulations: ChampionsRegulation[];
  tournaments: LimitlessTournament[];
  entries:     PokemonUsageDetail[];
  entriesMap:  Map<string, PokemonUsageDetail>;
}

/**
 * Encapsulates all URL-state parsing, navigation handlers, and auto-navigation
 * effects for the meta page. Data fetching stays in the four dedicated hooks.
 */
export function useMetaNavigation({
  snapshots,
  regulations,
  tournaments,
  entries,
  entriesMap,
}: UseMetaNavigationOpts): UseMetaNavigationResult {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rawParams    = useParams();

  const speciesId    = rawParams?.speciesId as string | undefined;
  const tab          = searchParams.get("tab")          ?? "stats";
  const format       = searchParams.get("format")       ?? "";
  const month        = searchParams.get("month")        ?? "";
  const cutoff       = Number(searchParams.get("cutoff") ?? DEFAULT_CUTOFF);
  const regulation   = searchParams.get("regulation")   ?? "";
  const tournamentId = searchParams.get("tournamentId") ?? "";
  const view         = searchParams.get("view")         ?? "aggregate";

  // Auto-navigate when Stats tab has no format: default to latest regulation (Champions), fall back to first Smogon snapshot
  useEffect(() => {
    if (tab !== "stats") return;
    if (searchParams.get("format")) return;
    if (regulations.length > 0) {
      router.replace(buildUrl({ speciesId, tab, format: regulations[0].id, month: "", cutoff: DEFAULT_CUTOFF, regulation, tournamentId, view }));
    } else if (snapshots.length > 0) {
      const first = snapshots[0];
      router.replace(buildUrl({ speciesId, tab, format: first.formatId, month: first.month, cutoff: first.cutoff, regulation, tournamentId, view }));
    }
  }, [snapshots, regulations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-navigate to first regulation when Tournament tab has no regulation set
  useEffect(() => {
    if (tab !== "tournament") return;
    if (regulations.length > 0 && !searchParams.get("regulation")) {
      router.replace(buildUrl({ speciesId, tab, format, month, cutoff, regulation: regulations[0].id, tournamentId, view }));
    }
  }, [regulations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-navigate to first tournament when Tournament tab has a regulation but no tournamentId
  useEffect(() => {
    if (tab !== "tournament") return;
    if (tournaments.length > 0 && !searchParams.get("tournamentId")) {
      router.replace(buildUrl({ speciesId, tab, format, month, cutoff, regulation, tournamentId: String(tournaments[0].id), view }));
    }
  }, [tournaments]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-navigate to first Pokémon when list loads and no selection
  useEffect(() => {
    if (!speciesId && entries.length > 0 && view === "aggregate") {
      router.replace(buildUrl({ speciesId: entries[0].speciesId, tab, format, month, cutoff, regulation, tournamentId, view }));
    }
  }, [entries]); // eslint-disable-line react-hooks/exhaustive-deps

  const detail = useMemo(
    () => (speciesId ? (entriesMap.get(speciesId) ?? null) : null),
    [speciesId, entriesMap],
  );

  const handleSelect = useCallback(
    (id: string) => router.push(buildUrl({ speciesId: id, tab, format, month, cutoff, regulation, tournamentId, view })),
    [router, tab, format, month, cutoff, regulation, tournamentId, view],
  );

  const handleTabChange = useCallback(
    (newTab: string) => {
      if (newTab === "stats") {
        // Default to first regulation (Champions preview) or first Smogon snapshot
        const defaultFormat = regulations.length > 0
          ? regulations[0].id
          : snapshots.length > 0 ? snapshots[0].formatId : "";
        const defaultMonth  = regulations.length > 0 ? "" : (snapshots[0]?.month ?? "");
        const defaultCutoff = regulations.length > 0 ? DEFAULT_CUTOFF : (snapshots[0]?.cutoff ?? DEFAULT_CUTOFF);
        router.push(buildUrl({ speciesId: undefined, tab: newTab, format: defaultFormat, month: defaultMonth, cutoff: defaultCutoff, regulation, tournamentId: "", view: "aggregate" }));
      } else if (newTab === "tournament") {
        // Default to first regulation + first tournament
        const defaultReg        = regulations[0]?.id ?? "";
        const defaultTournament = tournaments[0] ? String(tournaments[0].id) : "";
        router.push(buildUrl({ speciesId: undefined, tab: newTab, format, month, cutoff, regulation: defaultReg, tournamentId: defaultTournament, view: "aggregate" }));
      } else {
        router.push(buildUrl({ speciesId: undefined, tab: newTab, format, month, cutoff, regulation, tournamentId: "", view: "aggregate" }));
      }
    },
    [router, format, month, cutoff, regulation, regulations, snapshots, tournaments],
  );

  const handleFormatChange = useCallback(
    (newFormat: string, newMonth: string, newCutoff: number) =>
      router.push(buildUrl({ speciesId, tab, format: newFormat, month: newMonth, cutoff: newCutoff, regulation, tournamentId, view })),
    [router, speciesId, tab, regulation, tournamentId, view],
  );

  const handleOptionsApply = useCallback(
    (newMonth: string, newCutoff: number) =>
      router.push(buildUrl({ speciesId, tab, format, month: newMonth, cutoff: newCutoff, regulation, tournamentId, view })),
    [router, speciesId, tab, format, regulation, tournamentId, view],
  );

  const handleRegulationChange = useCallback(
    (newRegulation: string) =>
      router.push(buildUrl({ speciesId: undefined, tab, format, month, cutoff, regulation: newRegulation, tournamentId: "", view: "aggregate" })),
    [router, tab, format, month, cutoff],
  );

  const handleTournamentChange = useCallback(
    (newTournamentId: string) =>
      router.push(buildUrl({ speciesId: undefined, tab, format, month, cutoff, regulation, tournamentId: newTournamentId, view })),
    [router, tab, format, month, cutoff, regulation, view],
  );

  const handleViewChange = useCallback(
    (newView: string) =>
      router.push(buildUrl({ speciesId: undefined, tab, format, month, cutoff, regulation, tournamentId, view: newView })),
    [router, tab, format, month, cutoff, regulation, tournamentId],
  );

  const handleBack = useCallback(
    () => router.push(buildUrl({ speciesId: undefined, tab, format, month, cutoff, regulation, tournamentId, view })),
    [router, tab, format, month, cutoff, regulation, tournamentId, view],
  );

  return {
    speciesId, tournamentId, view, detail,
    handleSelect, handleTabChange, handleFormatChange,
    handleOptionsApply, handleRegulationChange, handleTournamentChange,
    handleViewChange, handleBack,
  };
}
