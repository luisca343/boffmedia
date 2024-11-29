import { useSession } from "next-auth/react"
import { Session } from "next-auth"

export const useBoffSession = () => {
  const { data: session, status } = useSession()

  function hasRole(role: string | string[]) {
    if (!session?.user?.roles) return false
    
    if (Array.isArray(role)) {
      return role.some(r => session.user.roles.includes(r.toUpperCase()))
    }

    return session.user.roles.includes(role.toUpperCase())
  }

  return { 
    session: session as Session, 
    status, 
    hasRole 
  }
}

