/**
 * @boffmedia/tools-battlesim
 *
 * Battle Simulator tool — play against AI, battle other players, or connect to
 * Pokémon Showdown. Headless battle engine in @boffmedia/battle-core; this
 * package is the React host with UI components and routing.
 *
 * Exports organized by audience:
 * - **For tool registration**: battlesimTools, battlesimToolsFor, BATTLESIM_NS
 * - **For hosting (web/desktop)**: navigation (useBsimNav, BsimNavProvider)
 * - **For components**: sprites (spriteUrl, avatarUrl, cryUrl), storage, asset
 * - **For i18n**: useToolT, useToolRichT, useLocale, BATTLESIM_NS
 */

// Manifests & registration
export { battlesimTool, battlesimTools, battlesimToolsFor } from "./tools";

// The mounted tree, for hosts that own their routing (apps/web).
export { BsimRoot } from "./BsimRoot";

// Screens, for a host that renders one directly.
export { BsimApp } from "./hub/BsimApp";
export { BsimPlayView } from "./play/PlayView";
export { BsimPvpView } from "./pvp/PvpLobbyView";
export { BsimPvpRoomView } from "./pvp/PvpRoomView";
export { BsimShowdownView } from "./showdown/ShowdownLobbyView";
export { BsimShowdownRoomView } from "./showdown/ShowdownRoomView";
export { BsimReplayView } from "./replay/ReplayLobbyView";
export { BsimReplayDetailView } from "./replay/ReplayDetailView";
export { TeamsView } from "./teambuilder/TeamsView";

// D5 host opt-in.
export { setShowdownProxyEnabled, isShowdownProxyEnabled } from "./config";

// Rooms — the open-tab registry and the lifted local-battle engine.
export { RoomsProvider, useBsimRooms, useBsimRoomsMaybe, shortRoomId, roomKeyFor, formatLabelFor } from "./rooms/RoomsProvider";
export type { BsimRoom, BsimRoomKind, BsimRoomTone, BsimRoomsApi } from "./rooms/RoomsProvider";
export { BsimTabBar, BSIM_TAB_BAR_H, bsimPinKeyFor } from "./components/BsimTabBar";

// Navigation
export { useBsimNav, BsimNavProvider, useHashBsimNav, useBsimBackOrHub, matchBsimRoute } from "./nav";
export type { BsimNav, BsimScreen, BsimNavigate } from "./nav";
export { BSIM_ROUTES } from "./nav";

// i18n
export { useToolT, useToolRichT, useLocale, BATTLESIM_NS } from "./i18n";

// Asset & sprite resolution
export { battlesimAssetUrl } from "./asset";
export { spriteUrl, avatarUrl, cryUrl, terasFormeUrl, useSpriteSource, handleSpriteError } from "./sprites";

// Storage
export {
  battlesimDb,
  battlesimOutbox,
  listReplays,
  getReplay,
  saveReplay,
  removeReplay,
  listTeams,
  saveTeam,
  getPref,
  setPref,
} from "./storage";

// Utilities
export { cn } from "./lib/cn";
export { useViewportWidth } from "./lib/useViewportWidth";

// Note: Components (battle views, elements, etc.) are imported by the route pages.
// Engine types and utilities are re-exported only if needed by the hosting app.

// The replay player, used by SmartRotom's liga camaralucha and the pasaporte
// replay modal as well as by this tool's own replay screen.
export { Game } from "./components/replay/Game";

// The BX presentational kit. Exported because apps/web's styles gallery renders
// these directly against hand-written records, with no battle behind them.
export * from "./components/bx-kit";
// The screen-level kit: focus recipes, section card, error states, skeleton.
export * from "./components/bsim-kit";
export * from "./lib/bx-helpers";
