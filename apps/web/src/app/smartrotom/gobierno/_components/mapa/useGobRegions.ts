"use client"

import { useQuery } from "@tanstack/react-query"
import type { Region } from "@boffmedia/shared"
import { WingullService } from "@/services/api/smartrotom/wingullService"

/**
 * The world's real WorldGuard regions — the same call the Taxi map uses for its landmass
 * (taxi/_hooks/queries.ts `useRegions`). Ported locally rather than shared cross-app:
 * Taxi's hook lives in a different design system's folder, and this app's own
 * `_hooks/queries.ts` is off-limits for this build. Purely decorative infrastructure —
 * if it fails, the cadastral map just can't resolve plot polygons and shows its empty
 * state instead of a crash.
 */
export function useGobRegions() {
  return useQuery({
    queryKey: ["gob", "wg-regions"],
    queryFn: async () => {
      const res = await WingullService.getRegions()
      if (!res.success || res.data === undefined) {
        throw new Error(res.message || "No se pudieron cargar las regiones del mundo.")
      }
      return res.data as Region[]
    },
    staleTime: Infinity,
    retry: false,
  })
}
