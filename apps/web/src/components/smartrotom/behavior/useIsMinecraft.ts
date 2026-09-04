'use client'

import { useEffect, useState } from 'react'
import { isMinecraft } from '@/services/mcef/mcefHelper'

/**
 * Hook to detect if running inside Minecraft (MCEF webview).
 *
 * Reads `window.mcefQuery` after mount (to avoid hydration desync).
 * Returns false during SSR and while hydrating; true only after client mount
 * in an MCEF context.
 */
export function useIsMinecraft(): boolean {
  const [inMinecraft, setInMinecraft] = useState(false)

  useEffect(() => {
    setInMinecraft(isMinecraft())
  }, [])

  return inMinecraft
}
