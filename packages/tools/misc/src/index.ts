/**
 * `@boffmedia/tools-misc` — the five tools that belong to no game: the Steam
 * key inventory, the Steam giveaway board, the giveaway drawer, and the two
 * halves of the ROM library (what the server holds, and what it can fetch).
 *
 * Hosts render these from `./tools`' manifests. This barrel exists for the ones
 * that ALSO have their own routes — apps/web has a page per tool — and for the
 * handful of types those pages touch.
 *
 * Importing from here pulls every tool in. `./tools` deliberately does not: its
 * manifests hold `lazy()` references so a Tools hub can list all five without
 * loading any.
 */

export { BibliotecaView } from "./biblioteca/BibliotecaView";
export { MyrientDownloader } from "./myrient/MyrientDownloader";
export { KeysView } from "./keys/KeysView";
export { SorteosView } from "./sorteos/SorteosView";
export { SteamFreeView } from "./steamfree/SteamFreeView";

export {
  bibliotecaTool,
  keysTool,
  miscTools,
  myrientTool,
  sorteosTool,
  steamFreeTool,
} from "./tools";

export {
  BIBLIOTECA_NS,
  KEYS_NS,
  MISC_NS,
  MYRIENT_NS,
  SORTEOS_NS,
  STEAMFREE_NS,
} from "./i18n";
