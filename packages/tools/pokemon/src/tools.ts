/**
 * This package's registry manifests. Hosts render their tool listings from
 * these; nothing host-shaped (routes aside) appears here.
 *
 * The component is `lazy` so a host's Tools hub can list the tool without
 * pulling the Wonder Mail generator and its item/dungeon/species tables — some
 * 3k lines of static data — into its initial chunk.
 */

import { lazy } from "react";
import type { ToolManifest } from "@boffmedia/tool-kit";

import { PMDSKY_NS, TCGP_NS } from "./i18n";
import { VGC_NS } from "./vgc/i18n";

export const pmdSkyTool: ToolManifest = {
  id: "pokemon.pmdsky",
  domain: "pokemon",
  titleKey: `${PMDSKY_NS}.manifest.name`,
  descriptionKey: `${PMDSKY_NS}.manifest.description`,
  categoryKey: `${PMDSKY_NS}.manifest.category`,
  icon: "compass",
  route: "/pokemon/pmdsky",
  // No capabilities at all: the generator is pure client-side arithmetic and
  // the portraits resolve through a static map (see `pmdsky/portraits.ts`), so
  // this tool works with no API and no network — like the schematic pair, and
  // unlike everything else in the pokemon domain will be.
  requiredCapabilities: [],
  // Grows with its content (four stacked sections plus the ticket column) and
  // is scrolled by the host: page scroll on the web, the Tools scrollport in
  // the launcher.
  layout: "document",
  component: lazy(() =>
    import("./pmdsky/PmdSkyView").then((m) => ({ default: m.PmdSkyView })),
  ),
};

export const tcgPocketTool: ToolManifest = {
  id: "pokemon.tcgpocket",
  domain: "pokemon",
  titleKey: `${TCGP_NS}.manifest.name`,
  descriptionKey: `${TCGP_NS}.manifest.description`,
  categoryKey: `${TCGP_NS}.manifest.category`,
  icon: "cards",
  route: "/pokemon/tcgpocket",
  // The card database comes from the API. The COLLECTION does not — it is read
  // from and written to the local store, and synced through the outbox — so a
  // player with no connection still has a working collection, just not a
  // browsable card list they have never loaded.
  requiredCapabilities: ["api"],
  layout: "document",
  component: lazy(() => import("./tcgpocket/TcgpApp").then((m) => ({ default: m.TcgpApp }))),
};

/**
 * The four VGC screens are four registry entries, not one "VGC" tile with tabs.
 * A player opening the damage calculator on a Saturday morning is not looking
 * for the tracker, and a hub that hides three destinations behind a fourth is a
 * hub that gets searched instead of browsed.
 *
 * All four render inside `VgcNavProvider` — they keep their state in the URL on
 * the web and in the memory router in the desktop app (see `vgc/routing`).
 */
export const vgcCalcTool: ToolManifest = {
  id: "pokemon.vgc-calc",
  domain: "pokemon",
  titleKey: `${VGC_NS}.manifest.calc.name`,
  descriptionKey: `${VGC_NS}.manifest.calc.description`,
  categoryKey: `${VGC_NS}.manifest.calc.category`,
  icon: "calc",
  route: "/pokemon/vgc/damage-calculator",
  // Legality lists and the Gen 9 data tables come from the API. The arithmetic
  // itself is local, so a cached regulation keeps the calculator working.
  requiredCapabilities: ["api"],
  layout: "document",
  component: lazy(() =>
    import("./vgc/damage-calculator/_components/DamageCalculatorView").then((m) => ({
      default: m.DamageCalculatorView,
    })),
  ),
};

export const vgcSpeedTool: ToolManifest = {
  id: "pokemon.vgc-speed",
  domain: "pokemon",
  titleKey: `${VGC_NS}.manifest.speed.name`,
  descriptionKey: `${VGC_NS}.manifest.speed.description`,
  categoryKey: `${VGC_NS}.manifest.speed.category`,
  icon: "bolt",
  route: "/pokemon/vgc/speed",
  requiredCapabilities: ["api"],
  layout: "document",
  component: lazy(() =>
    import("./vgc/speed/_components/SpeedTiersView").then((m) => ({ default: m.SpeedTiersView })),
  ),
};

export const vgcMetaTool: ToolManifest = {
  id: "pokemon.vgc-meta",
  domain: "pokemon",
  titleKey: `${VGC_NS}.manifest.meta.name`,
  descriptionKey: `${VGC_NS}.manifest.meta.description`,
  categoryKey: `${VGC_NS}.manifest.meta.category`,
  icon: "chart",
  route: "/pokemon/vgc/meta",
  // Usage snapshots are the whole tool; there is nothing to show without them.
  requiredCapabilities: ["api"],
  layout: "document",
  component: lazy(() =>
    import("./vgc/meta/_components/MetaLayoutClient").then((m) => ({ default: m.MetaLayoutClient })),
  ),
};

export const vgcTrackerTool: ToolManifest = {
  id: "pokemon.vgc-tracker",
  domain: "pokemon",
  titleKey: `${VGC_NS}.manifest.tracker.name`,
  descriptionKey: `${VGC_NS}.manifest.tracker.description`,
  categoryKey: `${VGC_NS}.manifest.tracker.category`,
  icon: "list",
  route: "/pokemon/vgc/tracker",
  // `api` for the sync, and that is ALL it is for: sessions, matches and series
  // are written to the local store first and queued, so the tracker records a
  // full tournament with no connection and no account. This is the tool that
  // most needs to be true offline — it is used at live events.
  requiredCapabilities: ["api"],
  layout: "document",
  component: lazy(() =>
    import("./vgc/tracker/TrackerApp").then((m) => ({ default: m.TrackerApp })),
  ),
};

export const pokemonTools: ToolManifest[] = [
  pmdSkyTool,
  tcgPocketTool,
  vgcCalcTool,
  vgcSpeedTool,
  vgcMetaTool,
  vgcTrackerTool,
];
