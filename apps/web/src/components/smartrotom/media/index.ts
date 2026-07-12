// Shared media design system (Mewtube + Mewtwitch) — shell + theme.
// Primitives live in the `./ui` barrel.
export { MediaShell } from "./MediaShell"
export { Sidebar } from "./Sidebar"
export { Topbar } from "./Topbar"
export { ChipRail } from "./ChipRail"
export {
  MediaAppProvider,
  useMediaTheme,
  MEDIA_THEMES,
  type MediaAppId,
  type MediaTheme,
} from "./_theme"
