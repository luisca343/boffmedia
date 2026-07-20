"use client";

import { useCallback } from "react";
import type { ReleasableApi } from "./worker-contracts";

/**
 * Frees a worker-side artifact whose UI handle is about to be replaced or
 * discarded. Without this every scan / document load leaves its worker entry (a
 * full registry or block array) alive for the whole session.
 */
export function useReleaseHandle(api: ReleasableApi | null) {
  return useCallback(
    async (id: string | undefined) => {
      if (id && api) await api.release(id).catch(() => {});
    },
    [api],
  );
}
