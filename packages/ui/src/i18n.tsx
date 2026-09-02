import * as React from "react"

import { DEFAULT_LOCALE } from "./locale"

/** Signature of a bound translator. Mirrors next-intl's `useTranslations(ns)`
 *  return value so the host can hand its own straight through. */
export type Translate = (key: string, values?: Record<string, string | number | Date>) => string

/** A chunk handler wraps the text between one pair of tags — `b: (c) => <b>{c}</b>`. */
export type RichValues = Record<
  string,
  string | number | Date | ((chunks: React.ReactNode) => React.ReactNode)
>

/**
 * A translator for messages that carry MARKUP — `Probabilidad <b>{pct}%</b> · …`.
 *
 * Separate from {@link Translate} rather than a method on it, and that
 * separation is the point: `Translate` is a plain callable that four tool
 * packages and both hosts already produce, and bolting a required `rich` onto
 * it breaks every one of them. Almost no message needs this; the handful that
 * do ask for it explicitly.
 */
export type RichTranslate = (key: string, values?: RichValues) => React.ReactNode

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
  /**
   * OPTIONAL rich translator, unbound like `useTranslateRoot`.
   *
   * A host with a real markup-aware formatter (next-intl's `t.rich`) should
   * wire it. A host without one leaves it unset and gets the fallback in
   * `useRootRichT`, which renders the tags out of the already-formatted string.
   * That fallback is enough for the launcher, whose own formatter treats a
   * `<b>` as ordinary text and passes it straight through.
   */
  useTranslateRootRich?: () => RichTranslate
  Link: LinkComponent
  /** Open an external URL. The default navigates a new tab, which is right in a
   *  browser and WRONG in a webview host: under Tauri an unhandled link would
   *  replace the launcher UI with a web page and strand the user with no way
   *  back. Hosts that are not a plain browser MUST override this. */
  openUrl: (url: string) => void
  /** Resolve a root-relative asset path to a URL the current host can fetch.
   *  In a browser served from the same origin, the identity function is correct.
   *  A webview host (Tauri, Electron) MUST override this to map root-relative
   *  paths like /smartrotom/img/... to its own asset location (e.g. file:// or
   *  a custom scheme like boffasset://). */
  assetUrl: (path: string) => string
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
  openUrl: (url: string) => {
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer")
  },
  assetUrl: (path: string) => path,
}

/** Call once per module graph, at import time. Under Next that means both the
 *  server and the client bundle — see apps/web/src/lib/ui-runtime.ts. */
export function configureUi(partial: Partial<UiRuntime>) {
  runtime = { ...runtime, ...partial }
}

/** Hand an external URL to the host. Not a hook: it is called from click
 *  handlers inside rendered Markdown, where hooks cannot run. */
export function uiOpenUrl(url: string) {
  runtime.openUrl(url)
}

/** Resolve a root-relative asset path to a URL the host can fetch. Not a hook:
 *  it is called from effect setup and callback creation, where hooks cannot run. */
export function uiAssetUrl(path: string): string {
  return runtime.assetUrl(path)
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

/** Matches one `<tag>…</tag>` pair. Non-greedy so two tags in one message do
 *  not collapse into a single enormous chunk. Nesting is not supported and does
 *  not need to be: these are emphasis spans, not a markup language. */
const TAG = /<([a-zA-Z][\w-]*)>([\s\S]*?)<\/\1>/

/**
 * Renders `<b>…</b>`-style spans in an already-formatted string through the
 * caller's chunk handlers. The fallback path of {@link useRootRichT}.
 *
 * Deliberately operates on the FORMATTED output rather than on the message:
 * plurals, numbers and dates have already been resolved by the host's own
 * formatter, so this only has to deal with the tags.
 */
function renderTags(text: string, values?: RichValues): React.ReactNode {
  const out: React.ReactNode[] = []
  let rest = text
  let key = 0
  for (;;) {
    const match = TAG.exec(rest)
    if (!match) break
    const [whole, tag, inner] = match
    if (match.index > 0) out.push(rest.slice(0, match.index))
    const handler = values?.[tag]
    // An unhandled tag renders its CONTENTS, never the tag itself: a viewer
    // should see the words, not the markup, when a call site forgot a handler.
    out.push(
      typeof handler === "function"
        ? React.createElement(React.Fragment, { key: key++ }, handler(inner))
        : inner,
    )
    rest = rest.slice(match.index + whole.length)
  }
  if (rest) out.push(rest)
  return out.length === 1 ? out[0] : out
}

/**
 * Root-namespace RICH translator. See {@link RichTranslate}.
 *
 * Not a hook conditionally: both branches are resolved at call time from the
 * module-level runtime, and the fallback calls `useTranslateRoot` the same way
 * `useRootT` does — so the hook order is identical whichever host is wired.
 */
export function useRootRichT(): RichTranslate {
  const rich = runtime.useTranslateRootRich
  const plain = runtime.useTranslateRoot()
  if (rich) return rich()
  return (key, values) => renderTags(plain(key, values as Record<string, string | number | Date>), values)
}

/**
 * A translator BOUND to `namespace`, over the host's root message store.
 *
 * The seam only hands back an unbound translator, but almost every call site
 * outside the primitives was written against next-intl's namespace-bound one
 * (`useTranslations("common.dkExtras")`). Binding here rather than at each call
 * site is what let the datakit move into this package without touching a single
 * `t("…")` — only the namespace string at the top of each component changed.
 */
export function useNsT(namespace: string): Translate {
  const t = runtime.useTranslateRoot()
  return React.useCallback(
    (key: string, values?: Record<string, string | number | Date>) =>
      t(`${namespace}.${key}`, values),
    [t, namespace],
  )
}

export function useUiLocale(): string {
  return runtime.useLocale()
}

/** Not a hook — safe to call in server components. */
export function getLink(): LinkComponent {
  return runtime.Link
}
