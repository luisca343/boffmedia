'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCalculatorStore } from '../_store/calculatorStore'
import { encodeCalcUrl, decodeCalcUrl, URL_PARAM } from '../_lib/urlSerializer'

/**
 * Handles URL-based state sharing for the damage calculator.
 *
 * - On mount: if the URL contains `?s=`, decodes it, hydrates the store, then
 *   removes the param so the URL stays clean after the initial load.
 * - On demand: `copyShareLink` encodes the *current* store state via
 *   `getState()` (avoids stale-closure capture) and copies the full URL to the
 *   clipboard. The browser URL is never auto-updated on state changes.
 */
export function useCalcUrlSync() {
  const {
    setPoke1, setPoke2, setField,
    setRegulation, setUseChampions,
    setActiveTab, setActiveMove1, setActiveMove2,
  } = useCalculatorStore()

  const searchParams = useSearchParams()
  const [linkCopied, setLinkCopied] = useState(false)
  const hydratedRef = useRef(false)

  // Hydrate store from URL on first mount, then clean the param.
  // Intentionally empty deps array — must run exactly once.
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    const encoded = searchParams.get(URL_PARAM)
    if (!encoded) return

    const decoded = decodeCalcUrl(encoded)
    if (!decoded) return

    setPoke1(decoded.p1)
    setPoke2(decoded.p2)
    setField(decoded.f)
    setRegulation(decoded.reg)
    setUseChampions(decoded.ch)
    setActiveTab(decoded.tab)
    setActiveMove1(decoded.m1)
    setActiveMove2(decoded.m2)

    // Remove the param so the URL is clean after hydration.
    // replaceState avoids pushing a new history entry.
    const clean = new URL(window.location.href)
    clean.searchParams.delete(URL_PARAM)
    window.history.replaceState(null, '', clean.toString())
  }, [])

  const copyShareLink = useCallback(() => {
    const s = useCalculatorStore.getState()
    const encoded = encodeCalcUrl(
      s.poke1, s.poke2, s.field,
      s.regulation, s.useChampions,
      s.activeTab, s.activeMove1, s.activeMove2,
    )
    if (!encoded) return

    const url = new URL(window.location.href)
    url.searchParams.set(URL_PARAM, encoded)
    const shareUrl = url.toString()

    // navigator.clipboard is only available in secure contexts (HTTPS / localhost).
    // Fall back to a prompt() so the user can still copy the link manually.
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      })
    } else {
      window.prompt('Copy this link:', shareUrl)
    }
  }, [])

  return { copyShareLink, linkCopied }
}
