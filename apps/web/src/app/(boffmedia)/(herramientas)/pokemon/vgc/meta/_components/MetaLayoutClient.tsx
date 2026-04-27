"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSmogonSnapshots } from "../_hooks/useSmogonSnapshots";
import { useSmogonUsage } from "../_hooks/useSmogonUsage";
import { FormatBar } from "./FormatBar";
import { PokemonSidebar } from "./PokemonSidebar";
import { PokemonDetailView } from "./PokemonDetailView";

const FORMAT_LABELS: Record<string, string> = {
  gen9vgc2026regi: "VGC 2026 Reg I",
  gen9vgc2026regh: "VGC 2026 Reg H",
  gen9vgc2025regg: "VGC 2025 Reg G",
  gen9vgc2025regf: "VGC 2025 Reg F",
};

const BASE_PATH = "/pokemon/vgc/meta";
const DEFAULT_CUTOFF = 1760;

function buildUrl(
  speciesId: string | undefined,
  format:    string,
  month:     string,
  cutoff:    number
) {
  const params = new URLSearchParams({ format });
  if (month) params.set("month", month);
  if (cutoff !== DEFAULT_CUTOFF) params.set("cutoff", String(cutoff));
  const base = speciesId ? `${BASE_PATH}/${speciesId}` : BASE_PATH;
  return `${base}?${params}`;
}

export function MetaLayoutClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rawParams    = useParams();
  const speciesId    = rawParams?.speciesId as string | undefined;

  const format = searchParams.get("format") ?? "";
  const month  = searchParams.get("month")  ?? "";
  const cutoff = Number(searchParams.get("cutoff") ?? DEFAULT_CUTOFF);

  const snapshots = useSmogonSnapshots();
  const { entries, entriesMap, loading, error } = useSmogonUsage(format, month, cutoff);

  // Auto-navigate to first snapshot when no format is set
  useEffect(() => {
    if (snapshots.length > 0 && !searchParams.get("format")) {
      const first = snapshots[0];
      router.replace(buildUrl(speciesId, first.formatId, first.month, first.cutoff));
    }
  }, [snapshots]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-navigate to first Pokémon when list loads and no selection
  useEffect(() => {
    if (!speciesId && entries.length > 0) {
      router.replace(buildUrl(entries[0].speciesId, format, month, cutoff));
    }
  }, [entries]); // eslint-disable-line react-hooks/exhaustive-deps

  const detail = useMemo(
    () => (speciesId ? (entriesMap.get(speciesId) ?? null) : null),
    [speciesId, entriesMap]
  );

  const handleSelect = useCallback(
    (id: string) => router.push(buildUrl(id, format, month, cutoff)),
    [router, format, month, cutoff]
  );

  const handleFormatChange = useCallback(
    (newFormat: string, newMonth: string, newCutoff: number) =>
      router.push(buildUrl(speciesId, newFormat, newMonth, newCutoff)),
    [router, speciesId]
  );

  const handleOptionsApply = useCallback(
    (newMonth: string, newCutoff: number) =>
      router.push(buildUrl(speciesId, format, newMonth, newCutoff)),
    [router, speciesId, format]
  );

  const handleBack = useCallback(
    () => router.push(buildUrl(undefined, format, month, cutoff)),
    [router, format, month, cutoff]
  );

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      <FormatBar
        format={format}
        month={month}
        cutoff={cutoff}
        snapshots={snapshots}
        formatLabels={FORMAT_LABELS}
        onFormatChange={handleFormatChange}
        onOptionsApply={handleOptionsApply}
      />

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
