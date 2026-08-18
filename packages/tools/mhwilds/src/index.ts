/**
 * @boffmedia/tools-mhwilds — the Monster Hunter Wilds tool domain.
 *
 * Host-agnostic by contract (see the plan's §3): no `next/*`, no `next-intl`,
 * no `@/` imports, no `@tauri-apps/*`. Game data goes through
 * `@boffmedia/tool-kit`'s `api` capability; translation rides on
 * `@boffmedia/ui`'s `configureUi`.
 */

// Tool entry points. Hosts with their own routing (web) import these directly;
// registry-driven hosts (the launcher Tools hub) go through `mhwildsTools`.
export { PlannerView } from "./planner/_components/PlannerView";
export { WeaponTreeView } from "./tree/WeaponTreeView";
export { BestiaryView } from "./bestiary/BestiaryView";

// Registry manifests (D6).
export {
  mhwildsTools,
  mhwildsPlannerTool,
  mhwildsTreeTool,
  mhwildsBestiaryTool,
} from "./tools";

// Message-key namespace + the bound-translator shim, for hosts that merge the
// package catalog or render tool titles themselves.
export { MHWILDS_NS, useToolT } from "./i18n";

// The shared MH shell/kit, exported because the web styleguide renders it.
export * from "./ui/mh-kit";
export * from "./ui/mh-helpers";

export type * from "./types";
