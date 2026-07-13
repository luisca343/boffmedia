"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Scoped TanStack Query client for the Pasaporte, mirroring `FurretQueryProvider`.
 *
 * `refetchOnWindowFocus` stays off: a passport is a document, not a timeline. Re-fetching
 * because the reader alt-tabbed would re-derive the stamps and the crónica under a page
 * that is mid-turn, and nothing in a passport changes while you are looking at it.
 */
export function PasaporteQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
