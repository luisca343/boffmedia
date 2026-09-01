"use client";

import { useEffect, useMemo, useState } from "react";
import { PokemonUsageDetail, VgcMetaService } from "../../service";

interface ChampionsUsageResult {
  entries:    PokemonUsageDetail[];
  entriesMap: Map<string, PokemonUsageDetail>;
  loading:    boolean;
  error:      string | null;
}

export function useChampionsUsage(regulationId: string): ChampionsUsageResult {
  const [entries, setEntries] = useState<PokemonUsageDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!regulationId) return;
    setLoading(true);
    setError(null);
    VgcMetaService.getChampionsUsage(regulationId)
      .then((res) => setEntries(res.data ?? []))
      .catch(() => setError("Failed to load."))
      .finally(() => setLoading(false));
  }, [regulationId]);

  const entriesMap = useMemo(
    () => new Map(entries.map((e) => [e.speciesId, e])),
    [entries],
  );

  return { entries, entriesMap, loading, error };
}
