"use client"

import { useBoffSession } from "@/services/useBoffSession"

/**
 * The SmartRotom uuid every app keys its data by. `null` until signed in.
 * The one home for the session chain — never hand-chain
 * `session?.user?.smartRotomUser?.uuid` in app code.
 */
export function useRotomUuid(): string | null {
  const { session } = useBoffSession()
  return session?.user?.smartRotomUser?.uuid ?? null
}
