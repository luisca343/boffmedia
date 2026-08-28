import { useEffect, useState } from "react"

import { iconSrc, reportIconFailure } from "../runtime"

/**
 * Resolves a remote image to something the launcher's webview will actually
 * render, via the on-disk cache in `icons.rs` (a `data:` URL).
 *
 * WHY THE CACHE FIRST, when CatalogIcon deliberately shows the remote URL first
 * and upgrades — the opposite order:
 *
 *   CatalogIcon draws a GRID of catalog art hosted on Modrinth's CDN. That is
 *   https, which `img-src 'self' data: https:` allows outright, so the remote
 *   URL is a real image that renders while the cache warms; blanking it would
 *   leave twenty placeholders standing for as long as the slowest download.
 *
 *   These two avatars are ONE image each, on origins the policy does not
 *   necessarily permit. A Boffmedia avatar is served from our own asset origin,
 *   which is an `http://` URL in this project's configuration — verified
 *   blocked: "Loading the image … violates the following Content Security
 *   Policy directive: img-src 'self' data: https:". Attempting it first is
 *   therefore guaranteed to fail, and the only thing it buys is a monogram
 *   flash plus a console violation, with recovery left to a race against the
 *   cache resolving.
 *
 * Widening the CSP is not the alternative. The asset origin comes from server
 * configuration (PUBLIC_DIR) and `app.security.csp` is a compile-time constant,
 * so the origin to allow is not knowable when the policy is written. A `data:`
 * URL needs no origin in the list at all — the same reason icons.rs exists.
 *
 * The remote URL is still tried if the cache cannot produce one, since a host
 * the policy DOES allow (textures.minecraft.net) then still renders. Only when
 * both fail does the caller get `failed`, and that lands in the Logs screen
 * rather than vanishing: a release build has no devtools, and this whole class
 * of fault otherwise looks identical to "this account has no picture".
 */
export function useCachedImage(url: string | null | undefined): {
  /** What to put in `src`, or null while pending or once everything failed. */
  src: string | null
  /** Both the cache and the origin were refused — draw the fallback. */
  failed: boolean
  /** Hand straight to `<img onError>`. */
  onError: () => void
} {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
    setSrc(null)
    if (!url) return

    let live = true
    void iconSrc(url)
      .then((next) => {
        if (!live) return
        // `iconSrc` resolves to null when the cache could not produce a copy;
        // it has already reported why. Fall back to the origin rather than to
        // the placeholder — if the policy allows that host it still renders,
        // and going straight to a fallback would make a broken cache strictly
        // worse than no cache at all.
        setSrc(next ?? url)
      })
      .catch(() => {
        if (live) setSrc(url)
      })

    return () => {
      live = false
    }
  }, [url])

  return {
    src,
    failed,
    onError: () => {
      // The cached copy is what normally sits in `src`, so a rejection here
      // means the bytes exist on disk but the webview will not serve them.
      // Name both URLs: which of the two was refused is the whole diagnosis.
      reportIconFailure(src ?? "", url ?? "")
      if (url && src !== url) {
        setSrc(url)
        return
      }
      setFailed(true)
    },
  }
}
