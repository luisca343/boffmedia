// Shared data-tool kit (dk-*): the common chassis for VGC Meta, Torneos and the
// VGC Tracker. Import from the package barrel:
//   import { DkApp, DkBar, DkStat, DkTrend } from "@boffmedia/ui"
//
// It lives in the design system rather than beside one of its consumers
// because those consumers now span hosts: VGC ships in @boffmedia/tools-pokemon
// (web AND the desktop app), while Torneos and the profile pages are web-only.
// Its strings sit beside the primitives' under the host's `common` namespace.
export * from "./utils"
export * from "./hooks"
export * from "./DkSprite"
export * from "./DkFlag"
export * from "./DkLive"
export * from "./DkBracket"
export * from "./DkShell"
export * from "./DkControls"
export * from "./DkSelect"
export * from "./DkStat"
export * from "./DkCharts"
export * from "./DkFeedback"
export * from "./DkTable"
export * from "./DkBarList"
export * from "./DkType"
export * from "./DkTeam"
export * from "./DkCopy"
export * from "./DkExtras"
