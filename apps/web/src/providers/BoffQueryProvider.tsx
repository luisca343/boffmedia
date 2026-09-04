"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import {
  MAX_QUERY_RETRIES,
  isTwoFactorPending,
  retryDelay,
  setTwoFactorPending,
  shouldRetryQuery,
} from "@/lib/query/retry"

/**
 * The app-wide TanStack Query client for the Boffmedia surfaces (events, forum,
 * profile). Mounted inside `SessionProvider` because the retry policy has to
 * know whether the session is stuck on its second factor.
 *
 * SmartRotom's per-app `AppQueryProvider`s stay where they are and nest inside
 * this one — the inner provider wins for its subtree, so one app's cache still
 * never bleeds into another's and none of them change behaviour.
 */
export function BoffQueryProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pending = Boolean(session?.user?.twoFactorPending)

  // Mirrored into a module flag rather than read inside the retry closure: the
  // client is built once, so a closure over `pending` would freeze whatever the
  // session was at mount. Written during render, not in an effect, so a request
  // fired in the same commit as the pending session already sees it; the
  // equality guard keeps it idempotent under StrictMode's double render.
  if (isTwoFactorPending() !== pending) setTwoFactorPending(pending)

  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // A minute of freshness is what turns navigating back to /eventos
            // from a refetch into a cache read; the list is not live data.
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            // Off on purpose: these pages are read-heavy and a tab-focus
            // refetch storm across events + forum + profile buys nothing.
            refetchOnWindowFocus: false,
            retry: (failureCount, error) =>
              shouldRetryQuery(failureCount, error, {
                twoFactorPending: isTwoFactorPending(),
                maxRetries: MAX_QUERY_RETRIES,
              }),
            retryDelay,
          },
          mutations: {
            // Never. A retried non-idempotent POST double-posts — rule 4 in
            // lib/query/retry.ts.
            retry: false,
          },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
