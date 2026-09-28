"use client"

import { USER_ROLES } from "@boffmedia/shared/roles"
import { useBoffSession } from "@/services/useBoffSession"
import UnauthorizedPage from "@/components/boffmedia/ui/layout/Unauthorized"
import { FortunesWeaveTracker } from "./FortunesWeaveTracker"

export function FortunesWeaveGate() {
  const { session, status } = useBoffSession()

  if (status === "loading") return null
  if (!session?.user.roles.includes(USER_ROLES.BOFF_ADMIN)) return <UnauthorizedPage />

  return <FortunesWeaveTracker accountKey={String(session.user.id ?? "boff-admin")} />
}
