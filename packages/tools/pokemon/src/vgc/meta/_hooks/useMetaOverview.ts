"use client";

import { useEffect, useState } from "react";
import { VgcMetaService, type MetaOverview } from "../../service";

interface MetaOverviewResult {
  overview: MetaOverview | null;
  loading: boolean;
  error: string | null;
}

export function useMetaOverview(
  regulationId: string | undefined,
  enabled: boolean,
): MetaOverviewResult {
  const [overview, setOverview] = useState<MetaOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !regulationId) {
      setOverview(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setOverview(null);
    setLoading(true);
    setError(null);

    VgcMetaService.getLimitlessMetaOverview(regulationId)
      .then((res) => {
        if (!cancelled) setOverview(res.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load overview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, regulationId]);

  return { overview, loading, error };
}
