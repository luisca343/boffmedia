/**
 * A segment that is not valid percent-encoding is already literal - keep it.
 *
 * `usePathname()` hands back the pathname still encoded, so a biome id arrives
 * as `teras%3Apueblo_kinoko`. Every crumb label needs decoding, not just the
 * `%20` the old implementation special-cased.
 */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/**
 * Index at which a multi-segment id starts, or -1.
 *
 * Two Terralith biomes are namespaced a level deeper (`terralith:cave/fungal_caves`),
 * so the biome route is a catch-all and one id can span two path segments. Split
 * naively, the first half becomes its own crumb pointing at `.../terralith%3Acave`,
 * which is not a biome and renders an empty page.
 *
 * Located by searching for `localizacion` rather than by a fixed index: on the
 * smartrotom subdomain the leading segment is rewritten away.
 */
function spannedIdStart(parts: string[]): number {
  const i = parts.indexOf('localizacion')
  return i > 0 && parts[i - 1] === 'pokedex' ? i + 1 : -1
}

/**
 * How many path segments this crumb covers. Always 1, except the crumb holding
 * an id that legitimately contains a slash.
 */
export function breadcrumbSpan(parts: string[], index: number): number {
  const start = spannedIdStart(parts)
  return start !== -1 && index === start ? parts.length - index : 1
}

export function breadcrumbRewrite(parts: string[], index: number): string {
  if (index == 0) return 'smartrotom'

  if (index === 4 && parts[2] === "entrada") {
    return ""
  }

  const start = spannedIdStart(parts)
  if (start !== -1 && index >= start) {
    // The whole id on the first crumb; the segments it swallowed render nothing.
    return index === start ? decodeSegment(parts.slice(start).join('/')) : ""
  }

  return decodeSegment(parts[index])
}
