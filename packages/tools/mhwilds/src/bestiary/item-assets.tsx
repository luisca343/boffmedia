"use client"

import * as React from "react"
import {
  loadMhwildsItemAssetManifest,
  mhwildsItemAsset,
  type MhwildsItemAssetManifest,
  type MhwildsItemAssetReference,
} from "./assets"

const MhwildsItemAssetManifestContext =
  React.createContext<MhwildsItemAssetManifest | null>(null)

/**
 * Shares the generated item manifest across every MH Wilds surface mounted in
 * the shell. The loader is already cached, so separate tool mounts still make
 * only one request per page.
 */
export function MhwildsItemAssetProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [manifest, setManifest] =
    React.useState<MhwildsItemAssetManifest | null>(null)

  React.useEffect(() => {
    let active = true
    loadMhwildsItemAssetManifest().then((next) => {
      if (active) setManifest(next)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <MhwildsItemAssetManifestContext.Provider value={manifest}>
      {children}
    </MhwildsItemAssetManifestContext.Provider>
  )
}

export function useMhwildsItemAssetManifest(): MhwildsItemAssetManifest | null {
  return React.useContext(MhwildsItemAssetManifestContext)
}

/** Resolve an item through the shared manifest, with the semantic fallback. */
export function useMhwildsItemAsset(
  item: MhwildsItemAssetReference | null | undefined,
  version?: string,
): string | null {
  const manifest = useMhwildsItemAssetManifest()
  return mhwildsItemAsset(item, manifest, version)
}
