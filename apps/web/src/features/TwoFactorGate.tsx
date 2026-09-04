"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

/** Where an unfinished admin sign-in has to go. */
const TWO_FACTOR_ROUTE = "/entrar/2fa"

/**
 * Sends a half-finished admin sign-in to `/entrar/2fa` and keeps it there.
 *
 * Mounted once in `GlobalProviders`, because a pending session can be created by
 * FOUR different doors — the credentials form and the Google, Discord and Twitch
 * callbacks — and only the credentials one runs code we control at the moment it
 * completes. Watching the session instead covers all four with one rule.
 *
 * This is convenience, not enforcement. A pending session carries no
 * `accessToken`, so it can already reach nothing; the API is what refuses, and
 * this only stops the browser from sitting on a page that will fail every call.
 */
export function TwoFactorGate() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  const pending = status === "authenticated" && session?.user?.twoFactorPending

  React.useEffect(() => {
    if (!pending) return
    if (pathname === TWO_FACTOR_ROUTE) return
    // Carrying the current path forward means finishing the second factor lands
    // the admin where they were going, not on the home page.
    const target = pathname && pathname !== "/entrar"
      ? `${TWO_FACTOR_ROUTE}?redirect=${encodeURIComponent(pathname)}`
      : TWO_FACTOR_ROUTE
    router.replace(target)
  }, [pending, pathname, router])

  return null
}
