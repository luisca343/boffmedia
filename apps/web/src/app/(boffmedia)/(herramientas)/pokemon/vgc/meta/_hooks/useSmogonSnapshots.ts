"use client";

import { useEffect, useState } from "react";
import { SmogonSnapshot, VgcMetaService } from "@/services/api/boffmedia/vgcService";

/** Fetches the list of available Smogon snapshots once on mount. */
export function useSmogonSnapshots(): SmogonSnapshot[] {
  const [snapshots, setSnapshots] = useState<SmogonSnapshot[]>([]);

  useEffect(() => {
    VgcMetaService.getAvailableSnapshots().then((res) => {
      setSnapshots(res.data ?? []);
    });
  }, []);  

  return snapshots;
}
