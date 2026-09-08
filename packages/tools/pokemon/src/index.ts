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
export type { PmdSkyViewProps } from "./pmdsky/PmdSkyView";
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

// PMD Sky URL state encoder/decoder. Used by web routing layer (PmdSkyRouted)
// to preserve form state in URL for sharing and back-button support.
export { encodePmdSkyUrl, decodePmdSkyUrl } from "./pmdsky/_lib/pmdSkyUrlSerializer";
export type { UrlState as PmdSkyUrlState } from "./pmdsky/_lib/pmdSkyUrlSerializer";

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

// Shared teambuilder surfaces. The builder remains visually owned by its
// working implementation in tools-battlesim, while its canonical item lookup
// and team shelf are available to VGC and other Pokémon tools.
export { itemIconStyle } from "./teambuilder/item-icon";
export {
  listBuilderTeams,
  getBuilderTeam,
  mergeBuilderTeamsFromServer,
  TEAM_BUILDER_STORE,
  TEAM_COLLECTION,
} from "./teambuilder/storage";

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

// The damage engine itself, as opposed to the screen around it.
//
// `smogonAdapter` is the only module in this package that knows how a
// `CalcPokemon` becomes a @smogon/calc `Pokemon`, and it is pure: no React, no
// store, no host. Battlesim's in-battle panel calls it with a spread it
// extracted from the live field, which is why it is exported rather than
// copied — a second implementation of "how do we ask @smogon/calc" is exactly
// how the two surfaces would start disagreeing about the same damage roll.
export { calcDamage, calcAllMoves, getKOVerdict, getDamageColorClass } from "./vgc/damage-calculator/_lib/smogonAdapter";
export { DEFAULT_FIELD } from "./vgc/damage-calculator/_store/slices/calcSlice";
export type {
  CalcField,
  CalcMove,
  DamageResult,
  MoveSlots,
  SideConditions,
  StatKey,
  StatValues,
  BoostKey,
  StatBoosts,
  Weather,
  Terrain,
  GameFormat,
} from "./vgc/damage-calculator/_types/calculator";

// The 25 natures. Static Gen-3+ mechanics, and the one table that decides which
// stat a nature raises — battlesim's in-battle panel solves a live spread
// against it, so a second copy would be a second answer to "is Adamant +atk".
export { NATURES, natureEffect, probeNature } from "./vgc/damage-calculator/_lib/natures";
export type { NatureData, NatureEffect } from "./vgc/damage-calculator/_lib/natures";

// Spreads. `solveSpread` inverts the stat formula from the final stats a live
// battle publishes; `minSpread`/`maxSpread` are the admitted guesses for the
// side of the field nobody can see. See the header of `_lib/spread.ts` — the
// distinction between the two is the difference between a useful in-battle
// number and a confidently wrong one.
export { solveSpread, spreadStats, minSpread, maxSpread } from "./vgc/damage-calculator/_lib/spread";
export type { KnownStats, SolvedSpread, SpreadGuess } from "./vgc/damage-calculator/_lib/spread";
