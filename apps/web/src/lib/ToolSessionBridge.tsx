"use client"

import { useEffect } from "react"

import { useBoffSession } from "@/services/useBoffSession"

import { toolSessionStore } from "./ui-runtime"

/**
 * Publishes the site's session into the tool host. Renders nothing.
 *
 * Separate from `UiRuntimeClient`, and mounted lower: that one lives in the
 * ROOT layout, which is outside `SessionProvider`, so calling `useSession`
 * there throws ("must be wrapped in a SessionProvider") and takes every page
 * with it. This sits inside `GlobalProviders`, where a session exists.
 *
 * Tools never import next-auth themselves — they could not, since they run in
 * the desktop app too — so this one component is the whole of the web's answer
 * to "who is signed in", the same way `app.tsx` is the launcher's.
 */
export function ToolSessionBridge() {
  const { session, status } = useBoffSession()
  const userId = session?.user?.id
  const userName = session?.user?.name
  const avatarUrl = session?.user?.image

  useEffect(() => {
    if (status === "loading") {
      toolSessionStore.publish({ status: "loading" })
      return
    }
    if (status !== "authenticated" || userId == null) {
      toolSessionStore.publish({ status: "anonymous" })
      return
    }
    toolSessionStore.publish({
      status: "signed-in",
      user: { id: String(userId), name: userName ?? "", avatarUrl: avatarUrl ?? null },
    })
  }, [status, userId, userName, avatarUrl])

  return null
}
