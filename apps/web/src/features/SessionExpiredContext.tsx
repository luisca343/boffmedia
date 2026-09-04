"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

export interface SessionExpiredContextType {
  isOpen: boolean
  caseType: "refreshable" | "expired" | "pending-2fa" | null
  currentPath: string | null
  openDialog: (caseType: "refreshable" | "expired" | "pending-2fa", path?: string) => void
  closeDialog: () => void
}

const SessionExpiredContext = createContext<SessionExpiredContextType | undefined>(undefined)

export function SessionExpiredProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [caseType, setCaseType] = useState<"refreshable" | "expired" | "pending-2fa" | null>(null)
  const [currentPath, setCurrentPath] = useState<string | null>(null)

  const openDialog = useCallback((type: "refreshable" | "expired" | "pending-2fa", path?: string) => {
    setCaseType(type)
    setCurrentPath(path || null)
    setIsOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setIsOpen(false)
    setCaseType(null)
    setCurrentPath(null)
  }, [])

  return (
    <SessionExpiredContext.Provider value={{ isOpen, caseType, currentPath, openDialog, closeDialog }}>
      {children}
    </SessionExpiredContext.Provider>
  )
}

export function useSessionExpired(): SessionExpiredContextType {
  const context = useContext(SessionExpiredContext)
  if (!context) {
    throw new Error("useSessionExpired must be used inside SessionExpiredProvider")
  }
  return context
}
