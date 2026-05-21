"use client";

import { useEffect, useMemo, useState } from "react";
import { PokemonUsageDetail, VgcMetaService } from "@/services/api/boffmedia/vgcService";

interface LimitlessUsageResult {
  entries:    PokemonUsageDetail[];
  entriesMap: Map<string, PokemonUsageDetail>;
  loading:    boolean;
  error:      string | null;
}

/**
 * Fetches Limitless usage data.
 * - If `tournamentId` is provided, fetches that tournament's usage.
 * - If `regulationId` is provided (and `tournamentId` is undefined/"combined"),
 *   fetches the combined usage across all done tournaments in the regulation.
 */
export function useLimitlessUsage(
  tournamentId: number | "combined" | undefined,
  regulationId?: string,
): LimitlessUsageResult {
  const [entries, setEntries] = useState<PokemonUsageDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId === undefined && !regulationId) return;
    setLoading(true);
    setError(null);

    const req =
      tournamentId !== undefined && tournamentId !== "combined"
        ? VgcMetaService.getLimitlessUsage(tournamentId)
        : regulationId
          ? VgcMetaService.getLimitlessCombinedUsage(regulationId)
          : null;

    if (!req) { setLoading(false); return; }

    req
      .then((res) => setEntries(res.data ?? []))
      .catch(() => setError("Failed to load usage data."))
      .finally(() => setLoading(false));
  }, [tournamentId, regulationId]);

  const entriesMap = useMemo(
    () => new Map(entries.map((e) => [e.speciesId, e])),
    [entries],
  );

  return { entries, entriesMap, loading, error };
}
