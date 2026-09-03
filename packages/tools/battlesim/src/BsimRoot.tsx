"use client";

/**
 * The one mounted tree, for both hosts.
 *
 * apps/web has a real route per screen and the launcher has none, so neither
 * host can own the switch: the web supplies a nav backed by the address bar and
 * renders this, the launcher gets the memory backing and renders exactly the
 * same thing. That is what keeps a deep link like `/pokemon/battlesim/replay/x`
 * and the launcher's in-app navigation on one code path instead of two.
 *
 * WHAT CHANGED, AND WHY IT IS NOT A SWITCH ANY MORE. This file used to render
 * exactly ONE screen per `nav.screen`, which made every navigation an unmount —
 * and a local AI battle is a Web Worker owned by the screen it was started
 * from, so "look at my teams" and "destroy the battle" were one gesture. It now
 * renders a LAYER PER OPEN ROOM plus one layer for whatever non-room screen you
 * were last on, and shows the active one. `RoomsProvider` owns the registry;
 * `BsimTabBar` is the control.
 *
 * HOW HIDDEN LAYERS STAY MEASURABLE. Hidden rooms are `visibility:hidden`, NOT
 * `display:none`, and that is load-bearing rather than a style choice: the
 * battle canvas measures its own box with a `ResizeObserver` and publishes the
 * width to the sprite engine (`engine/viewUtils.setCanvasWidth`). A
 * `display:none` element measures 0×0, which would hand the engine — a module
 * singleton shared by every room — a zero scale and leave the canvas collapsed
 * when you switched back. `visibility:hidden` keeps layout, so every layer
 * measures the same real box, every room agrees about the scale, and there is
 * nothing for the singleton to be wrong about. `lib/battle-layout.tsx` holds
 * the second belt: a measurement of 0 never overwrites the last good one.
 *
 * EVERY SCREEN IS `lazy`, and that is not a micro-optimisation. Statically
 * importing them put the battle engine, the scene compositor and the whole of
 * `@pkmn/sim` into one chunk: 8.0 MB, pulled in to show a lobby with three
 * tiles on it. The hub is the screen everyone lands on and the only one that
 * needs none of that, so it must not pay for the others. Measured with
 * `pnpm --filter desktop build:renderer` — check that output again if these
 * imports ever go back to being static.
 */

// Side-effect import, and it must stay FIRST: @pkmn reaches for Node's
// `global` and throws in a browser without this.
import "./lib/node-globals";

import * as React from "react";

import { BsimNavProvider, useBsimNav, type BsimNav, type BsimScreen } from "./nav";
import { isShowdownProxyEnabled } from "./config";
// Mounted eagerly and deliberately: the PvP socket has to OUTLIVE the lobby →
// room navigation, which means it cannot belong to either screen. It costs
// nothing until a PvP screen calls `connect()` — the engine and socket.io are
// behind a dynamic import inside it.
import { PvpSocketProvider } from "./pvp/PvpSocketProvider";
// Same reasoning, one level up: the ROOM registry and the local battle engine
// outlive every screen, so they are mounted above the layers below.
import { RoomsProvider, useBsimRooms, type BsimRoom } from "./rooms/RoomsProvider";
import { BsimTabBar, BSIM_TAB_BAR_H, bsimPinKeyFor } from "./components/BsimTabBar";
// Not lazy, and it must not be: it is what the user looks at WHILE the lazy
// screens download. It costs the design-system chrome, not the engine.
import { BsimScreenSkeleton } from "./components/bsim-kit";
import { RoomVisibleProvider } from "./lib/room-visibility";

const BsimApp = React.lazy(() => import("./hub/BsimApp").then((m) => ({ default: m.BsimApp })));
const BsimPlayView = React.lazy(() => import("./play/PlayView").then((m) => ({ default: m.BsimPlayView })));
const BsimPvpView = React.lazy(() => import("./pvp/PvpLobbyView").then((m) => ({ default: m.BsimPvpView })));
const BsimPvpRoomView = React.lazy(() => import("./pvp/PvpRoomView").then((m) => ({ default: m.BsimPvpRoomView })));
const BsimShowdownView = React.lazy(() => import("./showdown/ShowdownLobbyView").then((m) => ({ default: m.BsimShowdownView })));
const BsimShowdownRoomView = React.lazy(() => import("./showdown/ShowdownRoomView").then((m) => ({ default: m.BsimShowdownRoomView })));
const BsimReplayView = React.lazy(() => import("./replay/ReplayLobbyView").then((m) => ({ default: m.BsimReplayView })));
const BsimReplayDetailView = React.lazy(() => import("./replay/ReplayDetailView").then((m) => ({ default: m.BsimReplayDetailView })));
const BsimTeamsView = React.lazy(() => import("./teambuilder/TeamsView").then((m) => ({ default: m.TeamsView })));

/** One screen, by name. Both the base layer and every room layer go through it. */
function Screen({ screen }: { screen: BsimScreen }) {
  switch (screen) {
    case "play":
      return <BsimPlayView />;
    case "pvp":
      return <BsimPvpView />;
    case "pvpRoom":
      return <BsimPvpRoomView />;
    // D5: present in the bundle, unreachable unless the host asked for it. A
    // restored address pointing here in the launcher lands on the hub instead.
    case "showdown":
      return isShowdownProxyEnabled() ? <BsimShowdownView /> : <BsimApp />;
    case "showdownRoom":
      return isShowdownProxyEnabled() ? <BsimShowdownRoomView /> : <BsimApp />;
    case "replay":
      return <BsimReplayView />;
    case "replayDetail":
      return <BsimReplayDetailView />;
    // M3: teambuilder screens
    case "teams":
    case "teamEdit":
      return <BsimTeamsView />;
    case "hub":
    default:
      return <BsimApp />;
  }
}

/**
 * One stacked layer.
 *
 * `visibility:hidden` rather than `display:none` — see the file header; this is
 * what keeps the battle canvas measurable while it is off screen. `inert` takes
 * the whole subtree out of the tab order and out of the accessibility tree, so
 * a hidden battle's dock is not something a keyboard can wander into.
 */
function Layer({ tabKey, visible, children }: { tabKey: string | null; visible: boolean; children: React.ReactNode }) {
  // A layer is a `tabpanel` only when a tab actually points at it. The play
  // SETUP screen and the three lobbies are reachable without being a tab, and
  // labelling them against an id no tab carries is a broken relationship, not
  // an approximate one.
  const owned = tabKey != null;
  return (
    <div
      // A stable handle for anything that has to find "the layer on screen"
      // without knowing which one it is — the UI tests, and a devtools search.
      data-bsim-layer={tabKey ?? "base"}
      id={owned ? `bsim-panel-${tabKey}` : undefined}
      role={owned ? "tabpanel" : undefined}
      aria-labelledby={owned ? `bsim-tab-${tabKey}` : undefined}
      inert={!visible}
      className={
        // `invisible`, never `hidden`: a `display:none` layer measures 0×0 and
        // poisons the shared canvas scale. See the file header.
        visible
          ? "absolute inset-0 flex min-h-0 min-w-0 flex-col overflow-y-auto overflow-x-hidden"
          : "pointer-events-none invisible absolute inset-0 flex min-h-0 min-w-0 flex-col overflow-y-auto overflow-x-hidden"
      }
    >
      {/* Anything a screen binds to the WINDOW — the dock's 1-4 move hotkeys,
          most of all — has to know whether its room is the one on screen.
          `inert` does not cover that: it governs focus and the a11y tree, not
          a global listener. */}
      <RoomVisibleProvider value={visible}>
        <React.Suspense fallback={<BsimScreenSkeleton />}>{children}</React.Suspense>
      </RoomVisibleProvider>
    </div>
  );
}

/** What a room's layer renders. Its own address, pinned, so the screen reads it. */
function RoomLayer({ room, visible, nav }: { room: BsimRoom; visible: boolean; nav: BsimNav }) {
  // The layer's nav is the ROOM's address, not the current one: two AI battles
  // both render `PlayView`, and each has to see its own `roomId`. Writes still
  // go through the real seam — only `screen`/`params` are overridden.
  const pinned = React.useMemo<BsimNav>(() => ({ ...nav, screen: room.screen, params: room.params }), [nav, room.screen, room.params]);
  return (
    <Layer tabKey={room.id} visible={visible}>
      <BsimNavProvider nav={pinned}>
        <Screen screen={room.screen} />
      </BsimNavProvider>
    </Layer>
  );
}

/**
 * The tool's frame: the tab bar, then the layers.
 *
 * The bar eats vertical space, so `--tool-vh` is REDECLARED for everything
 * below it — the host's box minus the bar. That is deliberately the one place
 * it happens: every screen keeps reading the same token it always read
 * (`BattleShell`'s `h-[var(--tool-vh)]`, `DkApp`'s `min-h-[var(--tool-vh)]`)
 * and keeps fitting, with no per-screen arithmetic to get wrong. `--bsim-vh`
 * captures the host's value first so the redeclaration cannot refer to itself.
 */
function BsimShell() {
  const nav = useBsimNav();
  const { rooms, activeRoomId } = useBsimRooms();

  // The non-room screen the user was last on, kept so the hub does not lose its
  // section (or the teambuilder its list) the moment a battle is in front of
  // it. Written during render because it is a pure projection of the address.
  // `activeRoomId` is what the ADDRESS names; `activeRoom` is what is actually
  // open. They differ for exactly one beat — an address pointing at a battle
  // whose session is gone — and the base layer has to be the thing on screen
  // for that beat, or the tool renders nothing at all.
  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? null;
  const base = React.useRef<{ screen: BsimScreen; params: Record<string, string> }>({ screen: "hub", params: {} });
  if (!activeRoomId) base.current = { screen: nav.screen, params: nav.params };
  const baseScreen = base.current.screen;
  const baseParams = base.current.params;
  const baseNav = React.useMemo<BsimNav>(() => ({ ...nav, screen: baseScreen, params: baseParams }), [nav, baseScreen, baseParams]);

  return (
    <div
      className="flex h-[var(--tool-vh,100dvh)] min-h-0 w-full flex-col overflow-hidden bg-base text-txt"
      style={{ "--bsim-vh": "var(--tool-vh, 100dvh)", "--bsim-tab-h": BSIM_TAB_BAR_H } as React.CSSProperties}
    >
      <BsimTabBar />
      <div
        className="relative min-h-0 min-w-0 flex-1"
        // `--tool-sticky-top` goes to zero for the same reason. On the web it is
        // the site nav's height, because the PAGE was the scroller a tool's
        // sticky bar had to clear. This box is the scroller now, so a screen's
        // own bar sticks to the top of it — leave the old value in place and
        // every screen bar floats one nav-height down, with its content
        // running underneath.
        style={{ "--tool-vh": "calc(var(--bsim-vh) - var(--bsim-tab-h))", "--tool-sticky-top": "0px" } as React.CSSProperties}
      >
        <Layer tabKey={bsimPinKeyFor(baseScreen, baseParams)} visible={!activeRoom}>
          <BsimNavProvider nav={baseNav}>
            <Screen screen={baseScreen} />
          </BsimNavProvider>
        </Layer>
        {rooms.map((room) => (
          <RoomLayer key={room.id} room={room} visible={room.id === activeRoom?.id} nav={nav} />
        ))}
      </div>
    </div>
  );
}

/**
 * @param nav a host-supplied address bar. Omit it — as the launcher does — to
 *            get the in-memory backing, which is what makes every screen
 *            reachable in a host that has no URLs.
 */
export function BsimRoot({ nav }: { nav?: BsimNav } = {}) {
  return (
    <BsimNavProvider nav={nav}>
      <RoomsProvider>
        <PvpSocketProvider>
          <BsimShell />
        </PvpSocketProvider>
      </RoomsProvider>
    </BsimNavProvider>
  );
}

/** The registry entry point: no props, because a manifest component takes none. */
export default function BsimTool() {
  return <BsimRoot />;
}
