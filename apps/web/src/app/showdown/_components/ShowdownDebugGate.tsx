"use client"

import { USER_ROLES } from "@boffmedia/shared/roles"
import { useBoffSession } from "@/services/useBoffSession"
import UnauthorizedPage from "@/components/boffmedia/ui/layout/Unauthorized"
import { ShowdownDebugConsole } from "./ShowdownDebugConsole"

/**
 * `/showdown` is a raw Socket.IO console for the Showdown proxy — a developer
 * tool, not a product surface, and it takes a Pokemon Showdown username and
 * password. It used to be reachable by anyone who guessed the URL; only
 * BOFF_ADMIN gets it now.
 *
 * The gate is the same shape the admin console uses: hiding the route is not
 * the protection, the proxy's own auth is — this just stops it being an open
 * credential prompt on a public URL.
 */
export function ShowdownDebugGate() {
  const { session, status } = useBoffSession()

  // Render nothing while the session resolves rather than flashing the refusal
  // panel at an admin who is in fact allowed in.
  if (status === "loading") return null

  if (!session?.user.roles.includes(USER_ROLES.BOFF_ADMIN)) return <UnauthorizedPage />

  return <ShowdownDebugConsole />
}
