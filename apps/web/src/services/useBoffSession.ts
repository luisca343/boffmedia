import { useSession } from "next-auth/react"
import { Session } from "next-auth"
import { forceSessionRefresh } from "@/utils/refreshSession"

export const useBoffSession = () => {
  const { data: session, status, update } = useSession()

  function hasRole(role: string | string[]) {
    if (!session?.user?.roles) return false
    
    if (Array.isArray(role)) {
      return role.some(r => session.user.roles.includes(r.toUpperCase()))
    }

    return session.user.roles.includes(role.toUpperCase())
  }

  function isBoffAdmin() {
    return hasRole('BOFF_ADMIN')
  }

  function isRotomAdmin() {
    return hasRole('TERAS_ADMIN')
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
    refreshSession
  }
}