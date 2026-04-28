"use client";

import { useEffect, useState } from "react";
import { LimitlessTournament, VgcMetaService } from "@/services/api/boffmedia/vgcService";

export function useLimitlessTournaments(regulationId?: string): {
  tournaments: LimitlessTournament[];
  loading:     boolean;
  error:       string | null;
  reload:      () => void;
} {
  const [tournaments, setTournaments] = useState<LimitlessTournament[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [tick,        setTick]        = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    VgcMetaService.getLimitlessTournaments(regulationId)
      .then((res) => setTournaments(res.data ?? []))
      .catch(() => setError("Failed to load tournaments."))
      .finally(() => setLoading(false));
  }, [regulationId, tick]);

  return { tournaments, loading, error, reload: () => setTick((t) => t + 1) };
}
