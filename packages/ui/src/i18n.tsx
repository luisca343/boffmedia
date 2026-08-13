import * as React from "react"

import { DEFAULT_LOCALE } from "./locale"

/** Signature of a bound translator. Mirrors next-intl's `useTranslations(ns)`
 *  return value so the host can hand its own straight through. */
export type Translate = (key: string, values?: Record<string, string | number | Date>) => string

/** The host's Link. Defaults to a plain anchor so a non-Next host (Tauri,
 *  Electron, Storybook) renders correctly with no wiring at all. */
export type LinkComponent = React.ComponentType<
  { href: string; children?: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>
>

/** Deliberately a module-level registry and NOT a React context: four of these
 *  primitives (banner, pagination, search-input, spinner) and Button are server
 *  components, and a context hook would force "use client" on all of them —
 *  and on the ~20 server components that render Button. What is registered is
 *  the host's *hook*, not its result, so per-request locale still resolves
 *  normally when useTranslate() runs during render. */
export type UiRuntime = {
  /** Bound to the `common.primitives` namespace — what the primitives use. */
  useTranslate: () => Translate
  /** UNBOUND: takes full dotted keys from the root of the host's message store.
   *  The primitives never use this; workspace tool packages
   *  (`@boffmedia/tools-*`) do, because their keys live under their own
   *  top-level namespace (`tools.*`) rather than inside `common.primitives`.
   *  A host that only renders primitives can leave it unset. */
  useTranslateRoot: () => Translate
  useLocale: () => string
  Link: LinkComponent
}

const DefaultLink: LinkComponent = ({ href, children, ...rest }) => (
  <a href={href} {...rest}>
    {children}
  </a>
)

/** Echoes the key back. An unconfigured host degrades to visible key names
 *  rather than a crash — the launcher can adopt primitives before it has any
 *  translations wired. */
let runtime: UiRuntime = {
  useTranslate: () => (key: string) => key,
  useTranslateRoot: () => (key: string) => key,
  useLocale: () => DEFAULT_LOCALE,
  Link: DefaultLink,
}

/** Call once per module graph, at import time. Under Next that means both the
 *  server and the client bundle — see apps/web/src/lib/ui-runtime.ts. */
export function configureUi(partial: Partial<UiRuntime>) {
  runtime = { ...runtime, ...partial }
}

/** The in-package replacement for `useTranslations("common.primitives")`.
 *  Keys are unchanged, so existing message files keep working verbatim. */
export function useT(): Translate {
  return runtime.useTranslate()
}

/** Root-namespace translator for tool packages. See `useTranslateRoot`. */
export function useRootT(): Translate {
  return runtime.useTranslateRoot()
}

export function useUiLocale(): string {
  return runtime.useLocale()
}

/** Not a hook — safe to call in server components. */
export function getLink(): LinkComponent {
  return runtime.Link
}
