"use client";

import { useEffect, useState } from "react";
import { ChampionsRegulation, VgcMetaService } from "@/services/api/boffmedia/vgcService";

export function useChampionsRegulations(): ChampionsRegulation[] {
  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([]);

  useEffect(() => {
    VgcMetaService.getRegulations()
      .then((res) => setRegulations(res.data ?? []))
      .catch(() => setRegulations([]));
  }, []);

  return regulations;
}
