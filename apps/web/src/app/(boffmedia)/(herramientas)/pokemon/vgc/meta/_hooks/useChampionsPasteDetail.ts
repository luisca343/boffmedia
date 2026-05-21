"use client";

import { useEffect, useState } from "react";
import { ChampionsPasteDetail, VgcMetaService } from "@/services/api/boffmedia/vgcService";

interface ChampionsPasteDetailResult {
  detail:  ChampionsPasteDetail | null;
  loading: boolean;
  error:   string | null;
}

export function useChampionsPasteDetail(
  speciesId: string | undefined,
  regulationId: string | undefined,
): ChampionsPasteDetailResult {
  const [detail,  setDetail]  = useState<ChampionsPasteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!speciesId || !regulationId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setError(null);
    VgcMetaService.getChampionsPasteDetail(regulationId, speciesId)
      .then((res) => setDetail(res.data ?? null))
      .catch(() => setError("Failed to load paste detail."))
      .finally(() => setLoading(false));
  }, [speciesId, regulationId]);

  return { detail, loading, error };
}
