"use client"

import { useEffect, useState } from "react"

import { cn } from "../cn"
import { Icon } from "../primitives/icon"
import { getCatalog } from "./client"

// Catalog art is the one thing in the browser that a host cannot always render
// from the URL alone: a Tauri webview's CSP refuses arbitrary remote hosts, so
// the launcher resolves each icon through `iconSrc()` to a locally cached
// `asset:` URL. A browser host leaves `iconSrc` undefined and this degrades to
// a plain <img src>.
//
// Never next/image: this package is shared with a non-Next host, and no image
// loader is configured for the CurseForge/Modrinth CDNs anyway.

export function CatalogIcon({
  src,
  size,
  className,
}: {
  src?: string
  /** Rendered box size in px; also the fallback glyph's scale. */
  size: number
  className?: string
}) {
  const [resolved, setResolved] = useState<string | null>(src ?? null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
    if (!src) {
      setResolved(null)
      return
    }
    const host = getCatalog().iconSrc
    if (!host) {
      setResolved(src)
      return
    }
    let live = true
    // The remote URL is shown IMMEDIATELY and upgraded to the cached copy when
    // it arrives. Blanking it here instead was the bug: a grid fires ~20
    // `icon_cache` calls at once, each of which may sit on a 15s network
    // timeout, so every icon stayed a placeholder cube until the slowest one
    // came back — and any single failure left one there permanently. A host
    // whose CSP forbids the origin simply renders nothing for that moment and
    // lands on the cached copy a beat later, which is strictly better than
    // rendering nothing for the whole wait.
    setResolved(src)
    void host(src)
      .then((next) => {
        // Falling back to the remote URL rather than to the placeholder: if the
        // cache could not be written (read-only profile, full disk) the host's
        // CSP may still permit the origin directly, and a real icon beats a
        // cube. If it does not, <img onError> lands us on the cube anyway.
        if (!live) return
        // Clearing `failed` matters now that the remote URL is attempted
        // first: a host that refused it has already set the flag, and the
        // cached copy it is being replaced with is exactly the URL that host
        // can load.
        if (next && next !== src) setFailed(false)
        setResolved(next ?? src)
      })
      .catch(() => {
        if (live) setResolved(src)
      })
    return () => {
      live = false
    }
  }, [src])

  const box = { width: size, height: size }

  if (!resolved || failed) {
    return (
      <span
        style={box}
        className={cn(
          "grid shrink-0 place-items-center border border-solid border-line text-txt-dim",
          className,
        )}
      >
        <Icon name="cube" size={Math.round(size * 0.4)} />
      </span>
    )
  }

  return (
    <img
      src={resolved}
      alt=""
      style={box}
      onError={() => {
        // The host is told WHICH url the webview rejected. `resolved` is the
        // cached copy by this point, and a rejection here means the bytes exist
        // on disk but the webview will not serve them — a CSP or protocol-scope
        // fault, invisible everywhere else.
        getCatalog().onIconRenderFailure?.(resolved, src ?? "")

        // The cache is an OPTIMISATION. If its copy will not render, fall back
        // to the origin the icon came from rather than to the placeholder:
        // hosts that allow that origin (the launcher's CSP allows Modrinth's
        // CDN outright) then still show a real icon. Going straight to the cube
        // made a broken cache strictly worse than no cache at all, which is how
        // a scope problem became "mod icons do not work".
        if (src && resolved !== src) {
          setResolved(src)
          return
        }
        setFailed(true)
      }}
      className={cn("shrink-0 border border-solid border-line object-cover", className)}
    />
  )
}
