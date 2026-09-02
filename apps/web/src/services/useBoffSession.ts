import { useSession } from "next-auth/react"
import { Session } from "next-auth"
import { forceSessionRefresh } from "@/utils/refreshSession"
import { USER_ROLES } from "@boffmedia/shared/roles"
import type { UserRole } from "@boffmedia/shared/roles"

export const useBoffSession = () => {
  const { data: session, status, update } = useSession()

  function hasRole(role: UserRole | UserRole[]) {
    if (!session?.user?.roles) return false
    
    if (Array.isArray(role)) {
      return role.some(r => session.user.roles.includes(r))
    }

    return session.user.roles.includes(role)
  }

  function isBoffAdmin() {
    return hasRole(USER_ROLES.BOFF_ADMIN)
  }

  function isRotomAdmin() {
    return hasRole(USER_ROLES.ROTOM_ADMIN)
  }

  function getMinecraftUUID() {
    return session?.user.smartRotomUser?.uuid!
  }

  // Function to manually refresh session
  async function refreshSession() {
    try {
      await update() // This triggers the JWT callback with trigger: 'update'
      return session
    } catch (error) {
      console.error('Error updating session:', error)
      // Fallback to force refresh
      return await forceSessionRefresh()
    }
  }

  return {
    session: session as Session,
    getMinecraftUUID,
    status,
    hasRole,
    isBoffAdmin,
    isRotomAdmin,
    refreshSession,
    update, // next-auth session update — refreshes the JWT in place, no page reload
  }
}

/**
 * Just the viewer's roles, for the listings that hide a role-gated tool
 * (`ToolEntry.requiredRoles`). `undefined` while the session is still loading
 * and for a signed-out viewer — which `toolsVisibleTo` reads as "hide", so an
 * admin card never flashes at everyone for a frame before the session lands.
 */
export function useViewerRoles(): readonly string[] | undefined {
  const { data: session } = useSession()
  return session?.user?.roles
}
