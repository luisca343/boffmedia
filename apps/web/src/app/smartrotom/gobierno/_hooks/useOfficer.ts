"use client"

import { useBoffSession } from "@/services/useBoffSession"
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid"
import { USER_ROLES, GOBIERNO_RANKS } from "@boffmedia/shared/roles"
import { badgeOf } from "../_utils/format"

/**
 * Who the current officer is. There is no officers table by design — the roles ARE the
 * roster (the user's call). So rank comes from the highest GOB_* role held, and the badge
 * number is derived from the user id rather than stored anywhere.
 */
export function useOfficer() {
  const { session, status, hasRole, isRotomAdmin, isBoffAdmin } = useBoffSession()
  const uuid = useRotomUuid()

  const rank = GOBIERNO_RANKS.find((r) => hasRole(r.role))
  const isAdmin = isRotomAdmin() || isBoffAdmin()

  // An admin can always open the app; otherwise you need the GOBIERNO role (or any rank,
  // since holding a rank without the base role would otherwise lock you out).
  const canOpen =
    isAdmin || hasRole(USER_ROLES.GOBIERNO) || GOBIERNO_RANKS.some((r) => hasRole(r.role))

  const userId = Number(session?.user?.id ?? 0)

  return {
    status,
    canOpen,
    isAdmin,
    username: session?.user?.smartRotomUser?.username ?? session?.user?.username ?? "",
    uuid: uuid ?? "",
    rankLabel: rank?.label ?? (isAdmin ? "Administración" : "Funcionario"),
    badge: badgeOf(userId, rank?.prefix ?? (isAdmin ? "A" : "G")),
  }
}
