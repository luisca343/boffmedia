import { useEffect } from "react"
import useSocketStore from "../stores/useSocketStore"
import type { SmartRotomUser } from "@/types"
import { useSession } from "next-auth/react"

export function useSocket() {
    const { socket, connect, disconnect, isConnecting } = useSocketStore()
    const { data: session, status } = useSession()
    const user = session?.user as SmartRotomUser | undefined
    
    useEffect(() => {
        if (user && !socket && !isConnecting) {
            connect(user)
        }
        
        return () => {
            if (socket) {
                disconnect()
            }
        }
    }, [user, socket, connect, disconnect, isConnecting])
    
    return { socket, isConnecting }
}

