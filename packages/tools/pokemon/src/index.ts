/**
 * @boffmedia/tools-pokemon — the Pokémon tool domain.
 *
 * Host-agnostic by contract: no `next/*`, no `next-intl`, no `@/` imports, no
 * `@tauri-apps/*`. Everything host-shaped goes through `@boffmedia/tool-kit`;
 * translation rides on `@boffmedia/ui`'s `configureUi`.
 */

// Tool entry points. Hosts with their own routing (web) import these directly;
// registry-driven hosts (the launcher Tools hub) go through `pokemonTools`.
export { PmdSkyView } from "./pmdsky/PmdSkyView";
export { TcgpApp } from "./tcgpocket/TcgpApp";
export type { TcgpAppProps, TcgpView } from "./tcgpocket/TcgpApp";
export { DamageCalculatorView } from "./vgc/damage-calculator/_components/DamageCalculatorView";
export { SpeedTiersView } from "./vgc/speed/_components/SpeedTiersView";
export { MetaLayoutClient } from "./vgc/meta/_components/MetaLayoutClient";
export { TrackerApp } from "./vgc/tracker/TrackerApp";

// VGC's address bar. A host with real routing (apps/web) builds a `VgcNav` from
// its own router and passes it in; omit it and the provider runs the memory
// router, which is what the desktop app does. See `vgc/routing`.
export { VgcNavProvider, VgcRoot, VgcLink, useVgcNav, matchParams, VGC_BASE } from "./vgc/routing";
export type { VgcNav, VgcParams } from "./vgc/routing";

// Registry manifests (D6).
export {
  pokemonTools,
  pmdSkyTool,
  tcgPocketTool,
  vgcCalcTool,
  vgcSpeedTool,
  vgcMetaTool,
  vgcTrackerTool,
} from "./tools";

// Message-key namespaces + the bound-translator shim, for hosts that merge the
// package catalogs or render tool titles themselves.
export { PMDSKY_NS, TCGP_NS, useToolT } from "./i18n";
export { VGC_NS, useVgcT } from "./vgc/i18n";

// Two VGC utilities that outlived the port's boundary: Battlesim's sprite
// helpers and Torneos' Showdown-paste parser are web-only tools that were
// reaching into the tracker's internals through `@/features/vgc-tracker`. That
// directory is gone, so the package exports them rather than leaving a copy.
export { spriteUrl, handleSpriteError } from "./vgc/tracker-core/types";
export { parseShowdownPaste } from "./vgc/tracker-core/showdown-parse";

// The TCG Pocket UI kit. Exported for the same reason tools-minecraft exports
// its schematic kit: apps/web's styleguide renders these directly.
export * from "./tcgpocket/tcgp-kit";

// The VGC damage-calculator UI kit, for the same reason — apps/web's styles
// gallery has a chapter that renders every one of these in isolation.
export * from "./vgc/damage-calculator/_components/ui";
export { MvType } from "./vgc/meta/_components/MvBits";
export { defaultPokemon } from "./vgc/damage-calculator/_store/slices/calcSlice";
export type { CalcPokemon } from "./vgc/damage-calculator/_types/calculator";
