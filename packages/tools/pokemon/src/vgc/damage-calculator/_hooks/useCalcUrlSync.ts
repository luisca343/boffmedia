'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { assetUrl } from '@boffmedia/tool-kit'
import { toast } from '@boffmedia/ui'
import { useVgcNav } from "../../routing";
import { useVgcT } from "../../i18n";
import { useCalculatorStore } from '../_store/calculatorStore'
import { encodeCalcUrl, decodeCalcUrl, URL_PARAM } from '../_lib/urlSerializer'

/**
 * Handles URL-based state sharing for the damage calculator.
 *
 * - On mount: if the URL contains `?s=`, decodes it, hydrates the store, then
 *   removes the param so the URL stays clean after the initial load.
 * - On demand: `copyShareLink` encodes the *current* store state via
 *   `getState()` (avoids stale-closure capture) and copies the full URL to the
 *   clipboard. The address is never auto-updated on state changes.
 *
 * Both halves go through the host rather than `window.location`, and that is
 * not tidiness. In the desktop app `window.location` is the shell's own
 * `index.html`: the share link built from it pointed at a file nobody else can
 * open, and `history.replaceState` rewrote the shell's address instead of the
 * tool's. `assetUrl` resolves a site path to the public origin (identity on the
 * web, the website's origin in the desktop app), and the router owns the
 * address in both.
 */
export function useCalcUrlSync() {
  const {
    setPoke1, setPoke2, setField,
    setRegulation, setUseChampions,
    setActiveTab, setActiveMove1, setActiveMove2,
  } = useCalculatorStore()

  const t = useVgcT("calc")
  const { path, query: searchParams, replace } = useVgcNav();
  // `replace` is read through a ref so the hydration effect can stay a
  // run-exactly-once effect with an empty dependency list.
  const replaceRef = useRef(replace)
  replaceRef.current = replace
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

    // Drop the param so the address is clean after hydration. `replace`, not
    // `push`: rehydrating is not a place the back button should return to.
    const rest = new URLSearchParams(searchParams)
    rest.delete(URL_PARAM)
    const qs = rest.toString()
    replaceRef.current(qs ? `${path}?${qs}` : path)
  }, [])

  const copyShareLink = useCallback(() => {
    const s = useCalculatorStore.getState()
    const encoded = encodeCalcUrl(
      s.poke1, s.poke2, s.field,
      s.regulation, s.useChampions,
      s.activeTab, s.activeMove1, s.activeMove2,
    )
    if (!encoded) return

    // A share link has to be openable by someone else, so it is built against
    // the PUBLIC site: `assetUrl` is the identity on the web and the website's
    // origin in the desktop app.
    const shareUrl = new URL(
      assetUrl(`${path}?${URL_PARAM}=${encoded}`),
      typeof window === 'undefined' ? undefined : window.location.origin,
    ).toString()

    // navigator.clipboard is only available in secure contexts (HTTPS / localhost).
    // The old fallback was `window.prompt`, which the desktop webview answers
    // with nothing at all — so a failure said so instead of pretending.
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(
        () => {
          setLinkCopied(true)
          setTimeout(() => setLinkCopied(false), 2000)
        },
        () => toast.error(t('shareCopyFailed', { url: shareUrl })),
      )
    } else {
      toast.error(t('shareCopyFailed', { url: shareUrl }))
    }
  }, [path, t])

  return { copyShareLink, linkCopied }
}
