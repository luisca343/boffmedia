/**
 * Which image sources `next/image` is allowed to optimize.
 *
 * next/image THROWS at render time for a host that is not in
 * `images.remotePatterns` ("Invalid src prop … hostname is not configured"), and
 * that takes the whole page down — not just the picture. Admin-supplied URLs are
 * arbitrary, so callers ask here first and fall back to a plain `<img>` for
 * anything unrecognised: an unoptimized image instead of a crashed route.
 *
 * The table below MIRRORS `images.remotePatterns` in `apps/web/next.config.mjs`
 * (the config is `.mjs`, so it cannot import this file, and this file must not
 * import the config). Drift is safe in one direction only: a host added to the
 * config but missing here just renders unoptimized. Never list a host here that
 * the config does not have — that is the crash this module exists to prevent.
 */
type RemotePattern = { protocol: "http" | "https"; hostname: string }

const REMOTE_PATTERNS: readonly RemotePattern[] = [
  { protocol: "http", hostname: "**.lizardon.es" },
  { protocol: "https", hostname: "**.boffmedia.es" },
  { protocol: "https", hostname: "i.ytimg.com" },
  { protocol: "https", hostname: "i.imgur.com" },
  { protocol: "https", hostname: "minotar.net" },
  { protocol: "https", hostname: "www.serebii.net" },
  { protocol: "https", hostname: "example.com" },
]

/** `**.example.com` matches any subdomain but not the apex — Next's own rule. */
function hostnameMatches(pattern: string, hostname: string): boolean {
  if (pattern.startsWith("**.")) return hostname.endsWith(pattern.slice(2))
  if (pattern.startsWith("*.")) {
    const rest = hostname.slice(0, -pattern.slice(1).length)
    return hostname.endsWith(pattern.slice(1)) && rest.length > 0 && !rest.includes(".")
  }
  return hostname === pattern
}

/**
 * True when `next/image` can render this source without throwing: a relative
 * path (served by this app, including the `/uploads/*` rewrite), or a remote URL
 * whose protocol and host are configured.
 */
export function isOptimizableImageSrc(src: string): boolean {
  if (!src) return false
  if (src.startsWith("/") && !src.startsWith("//")) return true
  let url: URL
  try {
    url = new URL(src)
  } catch {
    // Not absolute and not root-relative (e.g. "img/foo.png"): next/image rejects
    // it too, so treat it as a plain <img> source.
    return false
  }
  const protocol = url.protocol.replace(":", "")
  if (protocol !== "http" && protocol !== "https") return false
  return REMOTE_PATTERNS.some(
    (p) => p.protocol === protocol && hostnameMatches(p.hostname, url.hostname),
  )
}
