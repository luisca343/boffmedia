"use client";

/**
 * Mewgenics' address bar.
 *
 * Both screens keep their whole state in the URL — the codex in a hash query
 * string (`#?c=items&id=SkullCap&sort=rarity`), the builder in a serialised
 * blob (`#<encoded cat>`) — which is a good design on the web and an impossible
 * one in the desktop app, where there is no URL to keep it in. So the address
 * SPACE stays and only its BACKING changes, the same trade the VGC tools make
 * (`@boffmedia/tools-pokemon`'s `vgc/routing`).
 *
 * Two things here are not in the VGC version, because Mewgenics needs them:
 *
 * 1. `back()` returns a boolean. The codex used to walk back with
 *    `window.history.length > 1 ? history.back() : clearSelection()`, and
 *    `history.length` is the WHOLE TAB's depth — it is ≥ 2 after any ordinary
 *    browsing, so the fallback never ran, and inside the launcher's single-page
 *    shell "back" would have walked the HOST out of the tool instead of
 *    returning to the grid. This tracks the entries THIS TOOL pushed, and hands
 *    the caller a `false` it can act on.
 *
 * 2. `go(screen)` switches between the codex and the builder. They are two
 *    manifests, but one mounted component tree (see `MewRoot`), so on the web
 *    that is a route change and in the launcher it is a `useState` — which is
 *    what makes the codex→builder link work in a host that has no router and no
 *    way to open another tool by id.
 */

import * as React from "react";
import { siteUrl } from "@boffmedia/tool-kit";

export type MewScreen = "codex" | "builder";

/** Where each screen lives on the public website. The web host owns these
 *  routes; the launcher only uses them to build share links. */
export const MEW_ROUTES: Record<MewScreen, string> = {
  codex: "/otros/mewgenics",
  builder: "/otros/mewgenics/builder",
};

export interface MewNav {
  screen: MewScreen;
  /**
   * Everything after the `#`, verbatim and screen-specific: `"?c=items&id=…"`
   * for the codex, the serialised build for the builder, `""` for neither.
   * Encoding and parsing belong to the screens (`codex-config`,
   * `builder-state`) — this seam only carries the string.
   */
  hash: string;
  /** Change the address without leaving an entry to walk back to. */
  replace(hash: string): void;
  /** Change it leaving one — opening a fiche from the grid. */
  push(hash: string): void;
  /** Walk back one entry THIS TOOL pushed. `false` = there was none, and the
   *  caller should do whatever "back" means from a standing start. */
  back(): boolean;
  /** Switch screen, optionally landing on a specific address. */
  go(screen: MewScreen, hash?: string): void;
  /**
   * Whether walking back also puts the scroll position back on its own.
   *
   * True for the browser, which restores the document scroll after a
   * `history.back()` and does it once layout has settled. False for the memory
   * backing, which has no such machinery — so the tool restores the offset
   * itself there, and ONLY there: doing it in both hosts meant the tool's own
   * two-frame guess raced the browser's accurate one and won, landing the
   * player at 936px of a grid they left at 1500px.
   */
  restoresScroll: boolean;
  /** A link for a person, not for bytes — see `ToolSiteUrl`. */
  shareUrl(screen: MewScreen, hash: string): string;
}

const NavContext = React.createContext<MewNav | null>(null);

export function useMewNav(): MewNav {
  const nav = React.useContext(NavContext);
  if (!nav) throw new Error("useMewNav must be used inside <MewNavProvider>");
  return nav;
}

/** Shared by both backings: the share link is always the public site. */
function buildShareUrl(screen: MewScreen, hash: string): string {
  const path = MEW_ROUTES[screen] + (hash ? (hash.startsWith("#") ? hash : `#${hash}`) : "");
  const resolved = siteUrl(path);
  // `siteUrl` is the identity on the web, so the result is still root-relative
  // there and has to be resolved against the page before it can be pasted.
  return typeof window === "undefined"
    ? resolved
    : new URL(resolved, window.location.origin).toString();
}

/**
 * The launcher's backing: a stack in React state.
 *
 * `push` grows it, `back` pops it, `replace` overwrites the top — the same
 * three operations `window.history` offers, over an array this tool owns, so
 * nothing it does can move the host off the screen the player is on.
 */
function useMemoryNav(initialScreen: MewScreen, initialHash: string): MewNav {
  const [screen, setScreen] = React.useState<MewScreen>(initialScreen);
  // The stack lives in a ref, not in state, because `back()` has to answer
  // "was there anything to go back to?" to its caller SYNCHRONOUSLY — a state
  // updater has not run yet when the handler returns, so a state-backed stack
  // could only guess. `bump` is what turns a mutation into a render.
  const stack = React.useRef<string[]>([initialHash]);
  const [version, bump] = React.useReducer((n: number) => n + 1, 0);
  const hash = stack.current[stack.current.length - 1] ?? "";

  return React.useMemo<MewNav>(
    () => ({
      screen,
      hash,
      replace: (next) => {
        stack.current = [...stack.current.slice(0, -1), next];
        bump();
      },
      push: (next) => {
        stack.current = [...stack.current, next];
        bump();
      },
      back: () => {
        if (stack.current.length <= 1) return false;
        stack.current = stack.current.slice(0, -1);
        bump();
        return true;
      },
      go: (next, nextHash) => {
        stack.current = [nextHash ?? ""];
        setScreen(next);
        bump();
      },
      restoresScroll: false,
      shareUrl: buildShareUrl,
    }),
    [screen, hash, version],
  );
}

/**
 * apps/web's backing: the real address bar.
 *
 * @param screen   which route is mounted — the web host knows this statically,
 *                 because it has one route per screen.
 * @param navigate the host's router push, for screen switches only.
 */
export function useHashMewNav(screen: MewScreen, navigate: (route: string) => void): MewNav {
  const read = () =>
    typeof window === "undefined" ? "" : decodeURIComponent(window.location.hash.slice(1));
  // Starts empty rather than from the hash: reading `location` in the
  // initialiser renders something the server never sent, and next-intl's tree
  // is server-rendered. The mount effect below applies the real address.
  const [hash, setHash] = React.useState("");
  // How many entries this tool put on the stack. Only these may be walked back,
  // which is the whole point — see the header.
  const depth = React.useRef(0);

  React.useEffect(() => {
    setHash(read());
    const sync = () => setHash(read());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  return React.useMemo<MewNav>(() => {
    const url = (next: string) =>
      window.location.pathname + window.location.search + (next ? `#${next}` : "");
    return {
      screen,
      hash,
      replace: (next) => {
        window.history.replaceState(null, "", url(next));
        setHash(next);
      },
      push: (next) => {
        window.history.pushState(null, "", url(next));
        depth.current += 1;
        setHash(next);
      },
      back: () => {
        if (depth.current <= 0) return false;
        depth.current -= 1;
        // `popstate` fires afterwards and syncs `hash`, so nothing is set here.
        window.history.back();
        return true;
      },
      go: (next, nextHash) => {
        navigate(MEW_ROUTES[next] + (nextHash ? `#${nextHash}` : ""));
      },
      restoresScroll: true,
      shareUrl: buildShareUrl,
    };
  }, [screen, hash, navigate]);
}

/**
 * A link between the two screens.
 *
 * It keeps a real `href` so the web keeps everything an anchor gives it — the
 * status bar, middle-click, "copy link address", and a working page for anyone
 * with JS off — while the click itself goes through the seam. A bare `<a href>`
 * would be wrong twice in the launcher: the webview would try to load a page
 * that does not exist there, and there is no router to catch it.
 */
export function MewScreenLink({
  screen,
  hash,
  children,
  ...rest
}: {
  screen: MewScreen;
  hash?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const nav = useMewNav();
  const href = MEW_ROUTES[screen] + (hash ? `#${hash}` : "");
  return (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        rest.onClick?.(event);
        if (event.defaultPrevented) return;
        // Modified clicks are the host's business: on the web they mean "new
        // tab", which is a real feature, and in the launcher they do nothing —
        // which is also what they do today.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        nav.go(screen, hash);
      }}
    >
      {children}
    </a>
  );
}

/**
 * @param nav  The host's address bar. Omit it for the memory backing — which is
 *             what the launcher gets, and what a test or a Storybook would.
 */
export function MewNavProvider({
  nav,
  initialScreen = "codex",
  initialHash = "",
  children,
}: {
  nav?: MewNav;
  initialScreen?: MewScreen;
  initialHash?: string;
  children: React.ReactNode;
}) {
  const memory = useMemoryNav(initialScreen, initialHash);
  const inherited = React.useContext(NavContext);
  // An explicit `nav` wins, then one already above us — so an entry component
  // can mount its own provider unconditionally without stealing the address bar
  // from a host that supplied one.
  return <NavContext.Provider value={nav ?? inherited ?? memory}>{children}</NavContext.Provider>;
}
