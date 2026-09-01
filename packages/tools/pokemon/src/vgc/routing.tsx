"use client";

/**
 * VGC's address bar.
 *
 * Three of these four tools keep their whole state in the URL — which species,
 * which regulation, which snapshot month, which session, which match. That is a
 * good design on the web and an impossible one in the desktop app, which has no
 * URL at all. So the address space stays, and only its BACKING changes.
 *
 * The paths are unchanged: `/pokemon/vgc/tracker/<sessionId>/<matchId>` means
 * the same thing in both hosts, and every `router.push("/pokemon/vgc/…")` in
 * the ported screens was left exactly as it was written. apps/web maps that
 * onto real routes through next/navigation; the desktop app runs the memory
 * router below, where a push is a `useState` call and the back button is the
 * tool's own.
 *
 * Route params are derived from the path in BOTH hosts rather than read from
 * `useParams()` on the web. One matcher, one answer — a second implementation
 * of "which segment is the session id" is a second thing to get wrong.
 */

import * as React from "react";

/** This tool family's root. Every path below is absolute from the host root. */
export const VGC_BASE = "/pokemon/vgc";

/** The routes that carry params, longest-first so the greedy ones match. */
const ROUTES = [
  `${VGC_BASE}/tracker/:sessionId/series/:seriesId`,
  `${VGC_BASE}/tracker/:sessionId/:matchId`,
  `${VGC_BASE}/tracker/:sessionId`,
  `${VGC_BASE}/meta/:speciesId`,
] as const;

export type VgcParams = Partial<Record<"sessionId" | "matchId" | "seriesId" | "speciesId", string>>;

/** First matching route's params, or `{}`. Exact segment count — otherwise
 *  `/tracker/<id>` would also match `/tracker/<id>/<matchId>`'s prefix. */
export function matchParams(path: string): VgcParams {
  const parts = path.split("?")[0].split("/").filter(Boolean);
  for (const route of ROUTES) {
    const pattern = route.split("/").filter(Boolean);
    if (pattern.length !== parts.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    for (let i = 0; i < pattern.length; i++) {
      const seg = pattern[i];
      if (seg.startsWith(":")) params[seg.slice(1)] = decodeURIComponent(parts[i]);
      else if (seg !== parts[i]) { ok = false; break; }
    }
    if (ok) return params;
  }
  return {};
}

export interface VgcNav {
  /** Path only, no query. */
  path: string;
  query: URLSearchParams;
  /** Route params for `path`. */
  params: VgcParams;
  /** Navigate, leaving a history entry where the host has history. */
  push(href: string): void;
  /** Navigate without one — used for the URL-state sync loops. */
  replace(href: string): void;
}

const NavContext = React.createContext<VgcNav | null>(null);

export function useVgcNav(): VgcNav {
  const nav = React.useContext(NavContext);
  if (!nav) throw new Error("useVgcNav must be used inside <VgcNavProvider>");
  return nav;
}

/** Split "/a/b?x=1" into its two halves. */
function parse(href: string): { path: string; query: URLSearchParams } {
  const i = href.indexOf("?");
  return i === -1
    ? { path: href, query: new URLSearchParams() }
    : { path: href.slice(0, i), query: new URLSearchParams(href.slice(i + 1)) };
}

/**
 * @param nav  The host's router. Omit it to run the memory router — which is
 *             what the desktop app does, and what a Storybook or a test would.
 * @param initialHref Where the memory router starts. Ignored when `nav` is set.
 */
export function VgcNavProvider({
  nav,
  initialHref = VGC_BASE,
  children,
}: {
  nav?: VgcNav;
  initialHref?: string;
  children: React.ReactNode;
}) {
  const [href, setHref] = React.useState(initialHref);
  const inherited = React.useContext(NavContext);

  const memory = React.useMemo<VgcNav>(() => {
    const { path, query } = parse(href);
    return { path, query, params: matchParams(path), push: setHref, replace: setHref };
  }, [href]);

  // An explicit `nav` wins; failing that a provider already above us does — so
  // a tool can mount its own root unconditionally (see `VgcRoot`) without
  // stealing the address bar from a host that supplied one.
  return <NavContext.Provider value={nav ?? inherited ?? memory}>{children}</NavContext.Provider>;
}

/**
 * What every VGC entry component wraps itself in.
 *
 * The four tools each need a router, and the two hosts supply one very
 * differently: apps/web wraps them in a `VgcNavProvider` carrying its own
 * next/navigation adapter, while the desktop app renders a manifest's
 * `component` directly out of the registry and has nowhere to wrap anything.
 * Mounting the root inside each tool makes the registry case work with no host
 * wiring at all, and the pass-through above keeps the web case exactly as the
 * host asked for it.
 */
export function VgcRoot({
  initialHref = VGC_BASE,
  children,
}: {
  initialHref?: string;
  children: React.ReactNode;
}) {
  return <VgcNavProvider initialHref={initialHref}>{children}</VgcNavProvider>;
}

/**
 * A link that navigates through whichever router is mounted.
 *
 * An `<a href>` alone would be wrong in the desktop app twice over: the webview
 * would try to load a page that does not exist, and a middle-click would open
 * the launcher's chrome in a browser. The `href` is still on the element so the
 * status bar and "copy link" do something sensible on the web.
 */
export function VgcLink({
  href,
  children,
  ...rest
}: { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { push } = useVgcNav();
  return (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        rest.onClick?.(event);
        if (event.defaultPrevented) return;
        // Leave the modified clicks to the host: on the web they mean "new tab"
        // and are a real feature; in the desktop app nothing happens, which is
        // the same as today.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        push(href);
      }}
    >
      {children}
    </a>
  );
}
