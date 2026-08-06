import * as React from "react"

import { configureUi, DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@boffmedia/ui"

import { messages } from "./messages"

// The launcher's translator. `@boffmedia/ui` is host-agnostic and only exposes a
// SEAM — `configureUi({ useTranslate, useLocale })` — so the actual message store
// lives here, in the host, exactly as next-intl does for apps/web. The primitives
// call `useT()` bound to the `common.primitives` namespace; the launcher screens
// call `useT("<screen>")`. Same store, one locale.
//
// Not a React context: the locale is a single app-wide value that even non-React
// code (boot, the settings save) needs to set, so it is a module-level signal
// read through useSyncExternalStore. That also means changing the language
// re-renders every translated component at once, with no provider to thread.

let currentLocale: AppLocale = DEFAULT_LOCALE
const listeners = new Set<() => void>()

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Set the app language. Anything not in SUPPORTED_LOCALES falls back to the
 *  default rather than showing raw keys. No-op when unchanged. */
export function setLocale(locale: string | null | undefined): void {
  const next = isAppLocale(locale) ? locale : DEFAULT_LOCALE
  if (next === currentLocale) return
  currentLocale = next
  for (const cb of listeners) cb()
}

export function getLocale(): AppLocale {
  return currentLocale
}

export function useLocale(): AppLocale {
  return React.useSyncExternalStore(subscribe, getLocale, getLocale)
}

type Dict = Record<string, string>

/** Flatten a nested message tree into dotted keys once, at module load. Lookups
 *  are then a single map hit rather than a walk per render. */
function flatten(node: unknown, prefix: string, out: Dict): Dict {
  if (typeof node === "string") {
    out[prefix] = node
    return out
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out)
    }
  }
  return out
}

const FLAT: Record<AppLocale, Dict> = {
  es: flatten(messages.es, "", {}),
  en: flatten(messages.en, "", {}),
}

/** next-intl uses ICU `{name}` placeholders; the launcher only needs simple
 *  named substitution, so that is all this does. An unmatched placeholder is
 *  left verbatim — a visible `{count}` is a better bug report than a silent "". */
function interpolate(template: string, values?: Record<string, string | number | Date>): string {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const v = values[name]
    return v === undefined ? whole : String(v)
  })
}

/** Mirrors next-intl's `useTranslations(ns)` return value, so the same call
 *  shape works in both hosts and `configureUi` can hand it straight through. */
export type Translate = (key: string, values?: Record<string, string | number | Date>) => string

function resolve(
  locale: AppLocale,
  ns: string | undefined,
  key: string,
  values?: Record<string, string | number | Date>,
): string {
  const full = ns ? `${ns}.${key}` : key
  // Fall back through the default locale before giving up on the key itself, so
  // a not-yet-translated English string shows the Spanish original, never a raw
  // dotted key in the player's face.
  const msg = FLAT[locale][full] ?? FLAT[DEFAULT_LOCALE][full] ?? full
  return interpolate(msg, values)
}

/** The launcher's own `useT`. Pass the screen/namespace once, then call with the
 *  short key: `const t = useT("settings"); t("title")`. */
export function useT(ns?: string): Translate {
  const locale = useLocale()
  return React.useCallback(
    (key: string, values?: Record<string, string | number | Date>) =>
      resolve(locale, ns, key, values),
    [locale, ns],
  )
}

// Wire the design-system primitives to this same store. Their internal strings
// (Copiar, Cerrar, Siguiente…) resolve from the `common.primitives` namespace in
// the message files. `Link` keeps its plain-anchor default — the launcher has no
// router. Import-time, once, before anything renders.
configureUi({
  useTranslate: () => useT("common.primitives"),
  useLocale,
})
