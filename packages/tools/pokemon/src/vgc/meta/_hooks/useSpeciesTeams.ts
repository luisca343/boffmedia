"use client";

import { useEffect, useState } from "react";
import { SpeciesTeamEntry, VgcMetaService } from "../../service";

interface SpeciesTeamsResult {
  teams:   SpeciesTeamEntry[];
  loading: boolean;
  error:   string | null;
}

export function useSpeciesTeams(
  speciesId:    string | undefined,
  regulationId: string | undefined,
): SpeciesTeamsResult {
  const [teams,   setTeams]   = useState<SpeciesTeamEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!speciesId || !regulationId) {
      setTeams([]);
      return;
    }
    setLoading(true);
    setError(null);
    VgcMetaService.getSpeciesTeams(speciesId, regulationId)
      .then((res) => setTeams(res.data ?? []))
      .catch(() => setError("Failed to load teams."))
      .finally(() => setLoading(false));
  }, [speciesId, regulationId]);

  return { teams, loading, error };
}
