import { useSession } from "next-auth/react"
import { Session } from "next-auth"
import { get } from "http"

export const useBoffSession = () => {
  const { data: session, status } = useSession()

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

  return { 
    session: session as Session, 
    getMinecraftUUID,
    status, 
    hasRole,
    isBoffAdmin,
    isRotomAdmin
  }
}

