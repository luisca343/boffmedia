"use client";

/**
 * Battlesim navigation — address bar backing for web and desktop.
 *
 * Routes map to URLs on the web site; in the desktop launcher, routes back
 * through React state (hash-stack). Both hosts share the same screen
 * components; only the nav backing changes.
 *
 * Screens: hub (lobby, teams, replays tabs) · play (local AI battle) ·
 * pvp/pvpRoom (ticket-gated PvP) · showdown/showdownRoom (PS proxy, web-only) ·
 * replay (replay library) · replayDetail (single replay with controls).
 */

import * as React from "react";
import { siteUrl } from "@boffmedia/tool-kit";

export type BsimScreen = "hub" | "play" | "pvp" | "pvpRoom" | "showdown" | "showdownRoom" | "replay" | "replayDetail" | "teams" | "teamEdit";

/**
 * Where each screen lives on the public website.
 *
 * THE TOKENS ARE THE PACKAGE'S PARAM NAMES, not the web's folder names. The
 * canonical vocabulary is `roomId` and `id` (plus the query-only `tab`, `team`,
 * `source`, `format`); apps/web keeps its `[roomid]` / `[name]` folders and
 * aliases them to those names in BsimRouted when it READS the address. Writing
 * goes the other way and must use the canonical names, or `[roomid]` survives
 * into the URL verbatim — which is exactly the bug this spelling fixes.
 */
export const BSIM_ROUTES: Record<BsimScreen, string> = {
  hub: "/pokemon/battlesim",
  play: "/pokemon/battlesim/play",
  pvp: "/pokemon/battlesim/pvp",
  pvpRoom: "/pokemon/battlesim/pvp/battle/[roomId]",
  showdown: "/pokemon/battlesim/showdown",
  showdownRoom: "/pokemon/battlesim/showdown/battle/[roomId]",
  replay: "/pokemon/battlesim/replay",
  replayDetail: "/pokemon/battlesim/replay/[id]",
  teams: "/pokemon/battlesim", // tab within hub
  teamEdit: "/pokemon/battlesim", // tab within hub
};

/**
 * Resolve a route template against params: `[token]` segments are substituted,
 * and EVERY param the template did not consume becomes a query parameter.
 *
 * That second half is what puts `?tab=equipos&team=abc` in the address. Without
 * it a screen's non-path state (which hub tab, which team is open, whether a
 * replay is local or from the league) exists only in React state, so Back does
 * not undo it, a reload loses it and nothing about the screen is linkable.
 */
function resolveRoute(screen: BsimScreen, params?: Record<string, string>): string {
  const template = BSIM_ROUTES[screen];
  if (!params) return template;
  let path = template;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    const token = `[${key}]`;
    if (path.includes(token)) path = path.replace(token, encodeURIComponent(value));
    else query.set(key, value);
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * The screens in the order a PATH must be tested against them.
 *
 * Longest/most specific first, and `hub` last because three screens share its
 * template (`teams` and `teamEdit` are hub tabs, not routes of their own) —
 * whichever is listed first wins, and the hub is the honest answer for that URL.
 */
const MATCH_ORDER: BsimScreen[] = ["pvpRoom", "showdownRoom", "replayDetail", "play", "pvp", "showdown", "replay", "hub"]

/**
 * A pathname back into a screen and its path params — the READ side of
 * {@link BSIM_ROUTES}.
 *
 * apps/web used to answer this with the route folder that rendered the tool:
 * one `page.tsx` per screen, each passing its own `screen` prop. That is
 * exactly why the tool could not keep a battle open — a different page
 * component per screen means a different React tree per screen, so every
 * navigation unmounted the tool, its worker and every running battle with it.
 * The web now mounts the tool ONCE, in the route group's layout, and asks this
 * function which screen the address is on. Deriving it from the same table the
 * writes use is what keeps the two directions from drifting.
 */
export function matchBsimRoute(pathname: string): { screen: BsimScreen; params: Record<string, string> } {
  const clean = pathname.replace(/\/+$/, "") || "/"
  // Tolerate anything mounted in front of the tool (a locale prefix, a basePath).
  const at = clean.indexOf("/pokemon/battlesim")
  const path = at >= 0 ? clean.slice(at) : clean
  for (const screen of MATCH_ORDER) {
    const template = BSIM_ROUTES[screen].split("/")
    const actual = path.split("/")
    if (template.length !== actual.length) continue
    const params: Record<string, string> = {}
    let ok = true
    for (let i = 0; i < template.length; i += 1) {
      const token = template[i]
      if (token.startsWith("[") && token.endsWith("]")) {
        if (!actual[i]) { ok = false; break }
        try {
          params[token.slice(1, -1)] = decodeURIComponent(actual[i])
        } catch {
          params[token.slice(1, -1)] = actual[i]
        }
      } else if (token !== actual[i]) {
        ok = false
        break
      }
    }
    if (ok) return { screen, params }
  }
  return { screen: "hub", params: {} }
}

export interface BsimNav {
  screen: BsimScreen;
  /** Screen-specific state: room ID, replay ID, team ID, etc. Opaque to nav. */
  params: Record<string, string>;

  replace(screen: BsimScreen, params?: Record<string, string>): void;
  push(screen: BsimScreen, params?: Record<string, string>): void;
  back(): boolean;
  restoresScroll: boolean;
  shareUrl(screen: BsimScreen, params?: Record<string, string>): string;
}

const NavContext = React.createContext<BsimNav | null>(null);

export function useBsimNav(): BsimNav {
  const nav = React.useContext(NavContext);
  if (!nav) throw new Error("useBsimNav must be used inside <BsimNavProvider>");
  return nav;
}

/**
 * {@link useBsimNav} for the handful of components that can legitimately render
 * OUTSIDE the tool.
 *
 * The replay viewer is one: apps/web embeds it in a SmartRotom passport modal
 * that mounts no nav seam. A component that only wants to offer a "back" — a
 * crash fallback, say — must not itself throw for want of one.
 */
export function useBsimNavMaybe(): BsimNav | null {
  return React.useContext(NavContext);
}

/** Shared by both backings: share link is always the public site. */
function buildShareUrl(screen: BsimScreen, params?: Record<string, string>): string {
  const resolved = siteUrl(resolveRoute(screen, params));
  return typeof window === "undefined" ? resolved : new URL(resolved, window.location.origin).toString();
}

/** Launcher backing: a stack in React state. */
function useMemoryNav(initialScreen: BsimScreen, initialParams?: Record<string, string>): BsimNav {
  const [screen, setScreen] = React.useState<BsimScreen>(initialScreen);
  const stack = React.useRef<Array<{ screen: BsimScreen; params: Record<string, string> }>>([{ screen: initialScreen, params: initialParams || {} }]);
  const [version, bump] = React.useReducer((n: number) => n + 1, 0);
  const current = stack.current[stack.current.length - 1] || { screen: initialScreen, params: {} };

  return React.useMemo<BsimNav>(
    () => ({
      screen: current.screen,
      params: current.params,
      replace: (next, nextParams) => {
        stack.current = [...stack.current.slice(0, -1), { screen: next, params: nextParams || {} }];
        bump();
      },
      push: (next, nextParams) => {
        stack.current = [...stack.current, { screen: next, params: nextParams || {} }];
        bump();
      },
      back: () => {
        if (stack.current.length <= 1) return false;
        stack.current = stack.current.slice(0, -1);
        bump();
        return true;
      },
      restoresScroll: false,
      shareUrl: buildShareUrl,
    }),
    [current, version]
  );
}

/** How the host performs a navigation. `replace` swaps the current entry. */
export type BsimNavigate = (route: string, opts?: { replace?: boolean }) => void;

/**
 * Web backing: the real address bar and Next router.
 *
 * `navigate` must be the HOST'S router, not `history.pushState`, for anything
 * that changes params the screens read back: `params` here comes from Next's
 * `useSearchParams`, and a raw `history.replaceState` never tells Next the
 * address moved, so the query would change in the URL bar while the component
 * kept rendering the old value. That is why `replace` routes through it too.
 */
export function useHashBsimNav(screen: BsimScreen, params: Record<string, string> = {}, navigate?: BsimNavigate): BsimNav {
  const [hash, setHash] = React.useState("");
  const depth = React.useRef(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const read = () => decodeURIComponent(window.location.hash.slice(1));
    setHash(read());
    const sync = () => setHash(read());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  return React.useMemo<BsimNav>(
    () => ({
      screen,
      params,
      replace: (next, nextParams) => {
        // No params = "stay where you are, just re-label the screen": the old
        // behaviour, kept because several screens replace() to drop a modal
        // out of the stack without wanting to rewrite the address.
        const url = nextParams ? resolveRoute(next, nextParams) : window.location.pathname + window.location.search;
        if (navigate) navigate(url, { replace: true });
        else window.history.replaceState(null, "", url);
        setHash("");
      },
      push: (next, nextParams) => {
        const url = nextParams ? resolveRoute(next, nextParams) : window.location.pathname + window.location.search;
        if (navigate) {
          navigate(url);
        } else {
          window.history.pushState(null, "", url);
        }
        depth.current += 1;
      },
      back: () => {
        if (depth.current <= 0) return false;
        depth.current -= 1;
        window.history.back();
        return true;
      },
      restoresScroll: true,
      shareUrl: buildShareUrl,
    }),
    [screen, params, navigate]
  );
}

/** Provider for nav context. */
export function BsimNavProvider({
  nav,
  initialScreen = "hub",
  initialParams,
  children,
}: {
  nav?: BsimNav;
  initialScreen?: BsimScreen;
  initialParams?: Record<string, string>;
  children: React.ReactNode;
}) {
  const memory = useMemoryNav(initialScreen, initialParams);
  const inherited = React.useContext(NavContext);
  return <NavContext.Provider value={nav ?? inherited ?? memory}>{children}</NavContext.Provider>;
}

/**
 * The one "go back" affordance for every screen in the tool.
 *
 * `nav.back()` returns false when there is no in-tool history to pop — a deep
 * link opened in a fresh tab, or the launcher's first screen. Every back button
 * used to paper over that with a hard `<a href="/pokemon">`, which is a route
 * the desktop host does not have and a full page load on the one that does.
 * Falling back to `replace("hub")` keeps the user inside the tool on both
 * hosts, and `replace` rather than `push` so Back does not bounce them into the
 * screen they just left.
 */
export function useBsimBackOrHub(): () => void {
  const nav = useBsimNav();
  return React.useCallback(() => {
    if (!nav.back()) nav.replace("hub", {});
  }, [nav]);
}
