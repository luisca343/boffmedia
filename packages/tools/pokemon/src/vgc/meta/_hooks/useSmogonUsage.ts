"use client";

import { useEffect, useMemo, useState } from "react";
import { PokemonUsageDetail, VgcMetaService } from "../../service";

interface SmogonUsageResult {
  entries:    PokemonUsageDetail[];
  entriesMap: Map<string, PokemonUsageDetail>;
  loading:    boolean;
  error:      string | null;
}

/**
 * Fetches the full Pokémon usage list for a given format/month/cutoff.
 * Builds a Map<speciesId, detail> for O(1) per-click lookup in the detail pane.
 */
export function useSmogonUsage(
  format: string,
  month:  string,
  cutoff: number,
): SmogonUsageResult {
  const [entries, setEntries] = useState<PokemonUsageDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!format) return;
    setLoading(true);
    setError(null);
    VgcMetaService.getSmogonUsage(format, month || undefined, cutoff)
      .then((res) => setEntries(res.data ?? []))
      .catch(() => setError("Failed to load."))
      .finally(() => setLoading(false));
  }, [format, month, cutoff]);

  const entriesMap = useMemo(
    () => new Map(entries.map((e) => [e.speciesId, e])),
    [entries]
  );

  return { entries, entriesMap, loading, error };
}
