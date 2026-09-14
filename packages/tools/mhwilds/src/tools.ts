/**
 * This package's registry manifests. Hosts render their tool listings from
 * these; nothing host-shaped (routes aside) appears here.
 *
 * Separate entries rather than one "MH Wilds" tile with internal tabs:
 * each is a destination in its own right, the same way tools-minecraft
 * registers compat and viewer separately.
 *
 * All components are `lazy` so a host's Tools hub can list them without
 * pulling the planner's calculation code or the bestiary's data into its
 * initial chunk.
 */

import { lazy } from "react";
import type { ToolManifest } from "@boffmedia/tool-kit";

import { MHWILDS_NS } from "./i18n";

/** Catalog screens are fully local; only the bestiary uses the API capability. */
const LOCAL_CAPABILITIES: ToolManifest["requiredCapabilities"] = [];
const API_CAPABILITIES: ToolManifest["requiredCapabilities"] = ["api"];

/** All screens grow with their content and are scrolled by the host: page scroll
 *  on the web, the Tools scrollport in the launcher. */
const LAYOUT: ToolManifest["layout"] = "document";

export const mhwildsPlannerTool: ToolManifest = {
  id: "mhwilds.planner",
  domain: "mhwilds",
  titleKey: `${MHWILDS_NS}.manifest.planner.name`,
  // `description`, not `tagline`: the tagline is the GAME name, which a host
  // that groups its listing by game has already said in the section header.
  descriptionKey: `${MHWILDS_NS}.manifest.planner.description`,
  categoryKey: `${MHWILDS_NS}.manifest.planner.category`,
  icon: "target",
  route: "/mhwilds/builds/planner",
  requiredCapabilities: LOCAL_CAPABILITIES,
  layout: LAYOUT,
  dataPack: { id: "mhwilds" },
  component: lazy(() =>
    import("./planner/_components/PlannerView").then((m) => ({ default: m.PlannerView })),
  ),
};

export const mhwildsTreeTool: ToolManifest = {
  id: "mhwilds.tree",
  domain: "mhwilds",
  titleKey: `${MHWILDS_NS}.manifest.tree.name`,
  descriptionKey: `${MHWILDS_NS}.manifest.tree.description`,
  categoryKey: `${MHWILDS_NS}.manifest.tree.category`,
  icon: "sword",
  route: "/mhwilds/tree",
  requiredCapabilities: LOCAL_CAPABILITIES,
  layout: LAYOUT,
  dataPack: { id: "mhwilds" },
  component: lazy(() =>
    import("./tree/WeaponTreeView").then((m) => ({ default: m.WeaponTreeView })),
  ),
};

export const mhwildsBestiaryTool: ToolManifest = {
  id: "mhwilds.bestiary",
  domain: "mhwilds",
  titleKey: `${MHWILDS_NS}.manifest.bestiary.name`,
  descriptionKey: `${MHWILDS_NS}.manifest.bestiary.description`,
  categoryKey: `${MHWILDS_NS}.manifest.bestiary.category`,
  icon: "skull",
  route: "/mhwilds/monsters",
  requiredCapabilities: API_CAPABILITIES,
  layout: LAYOUT,
  dataPack: { id: "mhwilds" },
  component: lazy(() =>
    import("./bestiary/BestiaryView").then((m) => ({ default: m.BestiaryView })),
  ),
};

export const mhwildsArmorTool: ToolManifest = {
  id: "mhwilds.armor",
  domain: "mhwilds",
  titleKey: `${MHWILDS_NS}.manifest.armor.name`,
  descriptionKey: `${MHWILDS_NS}.manifest.armor.description`,
  categoryKey: `${MHWILDS_NS}.manifest.armor.category`,
  icon: "shield",
  route: "/mhwilds/armor",
  requiredCapabilities: LOCAL_CAPABILITIES,
  layout: LAYOUT,
  dataPack: { id: "mhwilds" },
  component: lazy(() =>
    import("./armor/ArmorCatalogView").then((m) => ({ default: m.ArmorCatalogView })),
  ),
};

export const mhwildsWishlistTool: ToolManifest = {
  id: "mhwilds.wishlist",
  domain: "mhwilds",
  titleKey: `${MHWILDS_NS}.manifest.wishlist.name`,
  descriptionKey: `${MHWILDS_NS}.manifest.wishlist.description`,
  categoryKey: `${MHWILDS_NS}.manifest.wishlist.category`,
  icon: "list",
  route: "/mhwilds/wishlist",
  requiredCapabilities: LOCAL_CAPABILITIES,
  layout: LAYOUT,
  dataPack: { id: "mhwilds" },
  component: lazy(() =>
    import("./planner/_components/WishlistView").then((m) => ({ default: m.WishlistView })),
  ),
};

export const mhwildsTools: ToolManifest[] = [
  mhwildsPlannerTool,
  mhwildsWishlistTool,
  mhwildsTreeTool,
  mhwildsBestiaryTool,
  mhwildsArmorTool,
];
