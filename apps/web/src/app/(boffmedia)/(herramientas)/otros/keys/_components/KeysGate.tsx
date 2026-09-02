"use client"

import { USER_ROLES } from "@boffmedia/shared/roles"
import { KeysView } from "@boffmedia/tools-misc"
import { useBoffSession } from "@/services/useBoffSession"
import UnauthorizedPage from "@/components/boffmedia/ui/layout/Unauthorized"

/**
 * The Steam key inventory is Boffmedia's own, not the viewer's, so it is
 * BOFF_ADMIN-only on both surfaces.
 *
 * Three layers, and only the first is protection: `/steamkeys` is role-guarded
 * in `apps/api` and refuses everyone else whatever the page does. The tool's
 * manifest keeps the tile out of the launcher's grid, and `requiredRoles` on the
 * hub entry keeps the card and the sidebar link out of the site's. This is what
 * remains — the direct URL — and it exists so guessing the route lands on a
 * refusal rather than on a tool that renders and then fails every call.
 *
 * Same shape as `ShowdownDebugGate`, including the loading branch: rendering
 * nothing while the session resolves beats flashing the refusal at an admin who
 * is in fact allowed in.
 */
export function KeysGate() {
  const { session, status } = useBoffSession()

  if (status === "loading") return null
  if (!session?.user.roles.includes(USER_ROLES.BOFF_ADMIN)) return <UnauthorizedPage />

  return <KeysView />
}
