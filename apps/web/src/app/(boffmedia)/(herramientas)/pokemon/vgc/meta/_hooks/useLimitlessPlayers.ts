"use client";

import { useEffect, useState } from "react";
import { LimitlessPlayerEntry, VgcMetaService } from "@/services/api/boffmedia/vgcService";

export function useLimitlessPlayers(tournamentId: number | undefined): {
  players: LimitlessPlayerEntry[];
  loading: boolean;
  error:   string | null;
} {
  const [players, setPlayers] = useState<LimitlessPlayerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;
    setLoading(true);
    setError(null);
    VgcMetaService.getLimitlessPlayers(tournamentId)
      .then((res) => setPlayers(res.data ?? []))
      .catch(() => setError("Failed to load players."))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  return { players, loading, error };
}
