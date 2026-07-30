"use client"

import { useUiLocale } from "./i18n"
import { useMemo } from "react"

import * as fmt from "./format"
import type { TimeAgoOptions } from "./format"
import { intlLocale } from "./locale"

/** The house formatter, bound to the viewer's locale. Generalised from rooker's
 *  `useFormat`; use this in client components instead of calling `lib/format`
 *  directly, so nothing has to remember to pass a locale.
 *
 *  DS-neutral: no `components/*` import, safe from both design systems. */
export function useFormat() {
  const locale = useUiLocale()

  return useMemo(() => {
    const tag = intlLocale(locale)
    return {
      locale,
      /** The resolved BCP-47 tag, for one-off `Intl`/`toLocaleX` calls. */
      intlLocale: tag,
      number: (n: number) => fmt.formatNumber(n, locale),
      money: (n: number) => fmt.formatMoney(n, locale),
      compact: (n: number) => fmt.formatCompact(n, locale),
      timeAgo: (v: Parameters<typeof fmt.timeAgo>[0], options: TimeAgoOptions = {}) =>
        fmt.timeAgo(v, { ...options, locale }),
      timeAgoLong: (v: Parameters<typeof fmt.timeAgoLong>[0]) => fmt.timeAgoLong(v, locale),
      date: (v: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => {
        const ms = fmt.toMs(v)
        return ms ? new Date(ms).toLocaleDateString(tag, options) : "—"
      },
      time: (v: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => {
        const ms = fmt.toMs(v)
        return ms ? new Date(ms).toLocaleTimeString(tag, options) : "—"
      },
      dateTime: (v: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => {
        const ms = fmt.toMs(v)
        return ms ? new Date(ms).toLocaleString(tag, options) : "—"
      },
    }
  }, [locale])
}
