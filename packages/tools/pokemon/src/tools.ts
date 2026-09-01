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

export const pokemonTools: ToolManifest[] = [pmdSkyTool, tcgPocketTool];
