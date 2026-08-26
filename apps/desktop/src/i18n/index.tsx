import * as React from "react"

import { configureUi, DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@boffmedia/ui"

import { messages as toolsMinecraftMessages } from "@boffmedia/tools-minecraft/catalog"
import { messages as toolsMhwildsMessages } from "@boffmedia/tools-mhwilds/catalog"

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

// Workspace tool packages own their own catalogs, so they are
// flattened in FIRST and the launcher's own messages land on top — a host key
// wins a collision, which is the direction that lets the launcher override a
// tool string without editing the package.
const FLAT: Record<AppLocale, Dict> = {
  es: flatten(messages.es, "", flatten(toolsMhwildsMessages.es, "", flatten(toolsMinecraftMessages.es, "", {}))),
  en: flatten(messages.en, "", flatten(toolsMhwildsMessages.en, "", flatten(toolsMinecraftMessages.en, "", {}))),
}

/** Index of the `}` matching the `{` at `open`, or -1 if unbalanced. Branch
 *  bodies nest (`other {{count} opciones}`), so a regex cannot find this. */
function matchBrace(s: string, open: number): number {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === "{") depth++
    else if (s[i] === "}" && --depth === 0) return i
  }
  return -1
}

/** `=0 {…} one {…} other {…}` → a map of branch key to body. */
function parseBranches(s: string): Map<string, string> {
  const out = new Map<string, string>()
  let i = 0
  for (;;) {
    const head = /^\s*(=\d+|\w+)\s*\{/.exec(s.slice(i))
    if (!head) return out
    const open = i + head[0].length - 1
    const close = matchBrace(s, open)
    if (close === -1) return out
    out.set(head[1], s.slice(open + 1, close))
    i = close + 1
  }
}

/** Render one `{…}` argument. `raw` is returned unchanged for anything not
 *  understood — a visible `{count}` is a better bug report than a silent "". */
function renderArg(
  body: string,
  raw: string,
  values: Record<string, string | number | Date>,
  locale: AppLocale,
): string {
  const simple = /^\w+$/.test(body)
  if (simple) {
    const v = values[body]
    return v === undefined ? raw : String(v)
  }

  const head = /^(\w+)\s*,\s*(plural|select)\s*,\s*([\s\S]*)$/.exec(body)
  if (!head) return raw
  const [, name, kind, rest] = head
  const value = values[name]
  if (value === undefined) return raw

  const branches = parseBranches(rest)
  let chosen: string | undefined
  if (kind === "plural") {
    const n = Number(value)
    if (!Number.isFinite(n)) return raw
    // An `=N` exact match outranks the language's plural category, which is the
    // whole reason catalogs write `=0 {No hay decoraciones equipadas}`.
    chosen =
      branches.get(`=${n}`) ?? branches.get(new Intl.PluralRules(locale).select(n)) ?? branches.get("other")
  } else {
    chosen = branches.get(String(value)) ?? branches.get("other")
  }
  if (chosen === undefined) return raw

  // `#` is the plural's own number; the body may also nest `{name}` args.
  return interpolate(kind === "plural" ? chosen.split("#").join(String(value)) : chosen, values, locale)
}

/**
 * The launcher's ICU renderer: named `{placeholders}` plus `plural`/`select`.
 *
 * A plain `{name}` regex is NOT enough: the host merges tool-package catalogs,
 * which are authored for next-intl and do use ICU, so
 * `{count, plural, one {# opción} other {# opciones}}` would render to the
 * player verbatim.
 *
 * Plural categories come from `Intl.PluralRules`, not a hand-rolled n===1 test:
 * getting this right per locale is exactly what that API is for, and it costs
 * nothing here. Anything unrecognised (a format we do not implement, an unknown
 * placeholder) is left verbatim on purpose.
 */
function interpolate(
  template: string,
  values?: Record<string, string | number | Date>,
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  if (!values) return template
  let out = ""
  let i = 0
  while (i < template.length) {
    const open = template.indexOf("{", i)
    if (open === -1) return out + template.slice(i)
    out += template.slice(i, open)
    const close = matchBrace(template, open)
    // Unbalanced braces: emit the rest verbatim rather than looping forever.
    if (close === -1) return out + template.slice(open)
    out += renderArg(template.slice(open + 1, close), template.slice(open, close + 1), values, locale)
    i = close + 1
  }
  return out
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
  return interpolate(msg, values, locale)
}

/** Translate outside React.
 *
 *  For code that is not a component and so cannot hold a hook — the app
 *  provider's launch and install flows, which until now hardcoded Spanish
 *  strings inline. Reads the CURRENT locale at call time rather than closing
 *  over one, so a string produced after the player switches language is in the
 *  language they switched to. */
export function translate(
  ns: string | undefined,
  key: string,
  values?: Record<string, string | number | Date>,
): string {
  return resolve(getLocale(), ns, key, values)
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
  // Unbound — the tool packages' `tools.*` keys live at the root of this store.
  useTranslateRoot: () => useT(),
  useLocale,
})
