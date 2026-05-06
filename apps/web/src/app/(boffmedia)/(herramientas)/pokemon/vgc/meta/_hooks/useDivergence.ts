"use client";

import { useEffect, useState } from "react";
import { DivergenceResult, VgcMetaService } from "@/services/api/boffmedia/vgcService";

interface UseDivergenceResult {
  result:  DivergenceResult | null;
  loading: boolean;
  error:   string | null;
}

/**
 * Fetches ladder-vs-tournament divergence data.
 * Skips the fetch when `regulationId` is undefined.
 * - `tournamentId` = specific tournament; omit for combined across the regulation.
 * - `month` / `cutoff` = Smogon baseline; backend defaults to latest snapshot / 1760.
 */
export function useDivergence(
  regulationId: string | undefined,
  tournamentId: number | "combined" | undefined,
  month: string,
  cutoff: number,
): UseDivergenceResult {
  const [result,  setResult]  = useState<DivergenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!regulationId) {
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    VgcMetaService.getDivergence({
      regulationId,
      tournamentId: tournamentId !== undefined && tournamentId !== "combined"
        ? tournamentId
        : undefined,
      month: month || undefined,
      cutoff,
    })
      .then((res) => setResult(res.data ?? null))
      .catch(() => setError("Failed to load divergence data."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regulationId, tournamentId, month, cutoff]);

  return { result, loading, error };
}
