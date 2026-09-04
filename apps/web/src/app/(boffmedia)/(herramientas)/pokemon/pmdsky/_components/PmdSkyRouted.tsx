'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useCallback, useRef } from 'react'
import { siteUrl } from '@boffmedia/tool-kit'
import { PmdSkyView, decodePmdSkyUrl, encodePmdSkyUrl } from '@boffmedia/tools-pokemon'
import type { PmdSkyUrlState } from '@boffmedia/tools-pokemon'

const URL_PARAM = 'wm'

/**
 * The web's routing half of PMD Sky Wonder Mail builder.
 *
 * The tool itself has no idea what a URL is — it runs in the launcher too,
 * where there are none — so it takes URL callbacks as props. This adapter
 * wires them to next/navigation, which is what keeps the site's URL state
 * working in sync with the form.
 *
 * Pattern: matches VGC's damage calculator integration (useCalcUrlSync).
 */
export function PmdSkyRouted() {
  const router = useRouter()
  const params = useSearchParams()
  const hydratedRef = useRef(false)

  // Callback: decode URL param and hydrate form
  const onHydrateFromUrl = useCallback((applyState: (state: any) => void) => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    const encoded = params.get(URL_PARAM)
    if (!encoded) return

    const decoded = decodePmdSkyUrl(encoded)
    if (!decoded) return

    // Convert UrlState numeric fields back to the store's expected types
    applyState({
      questType: decoded.qt,
      specialQuestType: decoded.sq || 0,
      dungeon: decoded.dg,
      floor: decoded.fl,
      clientPokemon: decoded.cp,
      targetPokemon: decoded.tp,
      rewardType: decoded.rt,
      targetItem: decoded.ti,
      rewardItem: decoded.ri,
      europeanVersion: decoded.eu,
    })

    // Drop the param so the URL stays clean after hydration
    const rest = new URLSearchParams(params)
    rest.delete(URL_PARAM)
    const qs = rest.toString()
    const path = `/pokemon/pmdsky`
    router.replace(qs ? `${path}?${qs}` : path)
  }, [params, router])

  // Callback: encode state and copy link
  const onCopyShareLink = useCallback((encoded: string) => {
    const path = `/pokemon/pmdsky`
    const shareUrl = new URL(
      siteUrl(`${path}?${URL_PARAM}=${encoded}`),
      typeof window === 'undefined' ? undefined : window.location.origin,
    ).toString()

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {
        // Fall back to showing in browser's native share if available
        if (navigator.share) {
          navigator.share({ url: shareUrl }).catch(() => {})
        }
      })
    }
  }, [])

  return (
    <PmdSkyView
      onHydrateFromUrl={onHydrateFromUrl}
      onCopyShareLink={onCopyShareLink}
    />
  )
}
