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
import { useMetaNavigation, DEFAULT_CUTOFF } from "../_hooks/useMetaNavigation";
import { FormatBar } from "./FormatBar";
import { PokemonSidebar } from "./PokemonSidebar";
import { PokemonDetailView } from "./PokemonDetailView";

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
  const tab        = searchParams.get("tab")        ?? "ladder";
  const format     = searchParams.get("format")     ?? "";
  const month      = searchParams.get("month")      ?? "";
  const cutoff     = Number(searchParams.get("cutoff") ?? DEFAULT_CUTOFF);
  const regulation = searchParams.get("regulation") ?? "";

  // ── Data hooks — inactive tab receives empty string and skips fetching ─────
  const snapshots   = useSmogonSnapshots();
  const regulations = useChampionsRegulations();
  const { entries: ladderEntries,    entriesMap: ladderMap,    loading: ladderLoading,    error: ladderError    } =
    useSmogonUsage(tab === "ladder" ? format : "", month, cutoff);
  const { entries: championsEntries, entriesMap: championsMap, loading: championsLoading, error: championsError } =
    useChampionsUsage(tab === "champions" ? regulation : "");

  const entries    = tab === "champions" ? championsEntries : ladderEntries;
  const entriesMap = tab === "champions" ? championsMap     : ladderMap;
  const loading    = tab === "champions" ? championsLoading : ladderLoading;
  const error      = tab === "champions" ? championsError   : ladderError;

  // ── Navigation hook — buildUrl, auto-navigation effects, all handlers ──────
  const { speciesId, detail: baseDetail, handleSelect, handleTabChange, handleFormatChange, handleOptionsApply, handleRegulationChange, handleBack } =
    useMetaNavigation({ snapshots, regulations, entries, entriesMap });

  // ── Phase 3: paste-derived data for Champions tab ─────────────────────────
  const { detail: pasteDetail } = useChampionsPasteDetail(
    tab === "champions" ? speciesId : undefined,
    tab === "champions" ? regulation : undefined,
  );

  const detail = useMemo(() => {
    if (!baseDetail || tab !== "champions" || !pasteDetail) return baseDetail;
    return {
      ...baseDetail,
      abilities: pasteDetail.abilities.length > 0 ? pasteDetail.abilities : baseDetail.abilities,
      items:     pasteDetail.items.length     > 0 ? pasteDetail.items     : baseDetail.items,
      moves:     pasteDetail.moves.length     > 0 ? pasteDetail.moves     : baseDetail.moves,
      teraTypes: pasteDetail.teraTypes.length > 0 ? pasteDetail.teraTypes : baseDetail.teraTypes,
      spreads:   pasteDetail.spreads.length   > 0 ? pasteDetail.spreads   : baseDetail.spreads,
    };
  }, [baseDetail, pasteDetail, tab]);

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      <FormatBar
        tab={tab}
        format={format}
        month={month}
        cutoff={cutoff}
        regulation={regulation}
        snapshots={snapshots}
        regulations={regulations}
        formatLabels={FORMAT_LABELS}
        onTabChange={handleTabChange}
        onFormatChange={handleFormatChange}
        onOptionsApply={handleOptionsApply}
        onRegulationChange={handleRegulationChange}
      />

      {/* Preview notice for Champions tab — sourced from VGCPastes CSV until Smogon adds the format */}
      {tab === "champions" && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-amber-500/5 border-b border-amber-500/20 text-xs text-amber-400/80">
          <Info className="w-3.5 h-3.5 shrink-0" />
          {t("tabs.championsPreviewNotice")}
        </div>
      )}

      {/* Single scroll container — sidebar sticks, detail panel drives height */}
      <div className="flex flex-1 min-h-0 overflow-y-auto">
        <aside
          className={cn(
            "shrink-0 border-r border-surface-800 flex flex-col overflow-hidden",
            "md:sticky md:top-0 md:self-start md:h-[calc(100vh-3rem)]",
            speciesId
              ? "hidden md:flex md:w-72 xl:w-80"
              : "flex w-full md:w-72 xl:w-80"
          )}
        >
          <PokemonSidebar
            entries={entries}
            loading={loading}
            error={error}
            selectedId={speciesId}
            onSelect={handleSelect}
          />
        </aside>

        <main
          className={cn(
            "flex-1 min-w-0",
            speciesId ? "block" : "hidden md:block"
          )}
        >
          <PokemonDetailView
            detail={detail}
            loading={false}
            speciesId={speciesId}
            onBack={handleBack}
            onSelect={handleSelect}
          />
        </main>
      </div>
    </div>
  );
}

