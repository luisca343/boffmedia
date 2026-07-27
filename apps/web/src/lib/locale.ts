/** The locale-resolution layer. This is the ONLY module allowed to name a BCP-47
 *  tag literally (`scripts/check-locale-literals.mjs` enforces it). Everything
 *  else takes a locale in and passes it to `Intl`.
 *
 *  DS-neutral pure TS — no React, no `components/*`. Imported by both design
 *  systems, so it must stay that way. */

export const SUPPORTED_LOCALES = ["es", "en"] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

/** next-intl's default and fallback (mirrors `i18n/request.ts`). */
export const DEFAULT_LOCALE: AppLocale = "es"

/** App locale → the BCP-47 tag `Intl` should format with. */
const INTL_TAG: Record<AppLocale, string> = {
  es: "es-ES",
  en: "en-US",
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/** Resolve anything (a next-intl locale, an `Accept-Language` fragment, undefined)
 *  to the tag `Intl` should use. Unknown input falls back to the default locale,
 *  never to the host's system locale — that would make output machine-dependent. */
export function intlLocale(locale?: string | null): string {
  if (!locale) return INTL_TAG[DEFAULT_LOCALE]
  const base = locale.toLowerCase().split("-")[0]
  return isAppLocale(base) ? INTL_TAG[base] : INTL_TAG[DEFAULT_LOCALE]
}
