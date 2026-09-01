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

// Registry manifests (D6).
export { pokemonTools, pmdSkyTool } from "./tools";

// Message-key namespaces + the bound-translator shim, for hosts that merge the
// package catalogs or render tool titles themselves.
export { PMDSKY_NS, useToolT } from "./i18n";
