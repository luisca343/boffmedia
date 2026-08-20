/**
 * This package's registry manifests. Hosts render their tool listings from
 * these; nothing host-shaped (routes aside) appears here.
 *
 * Three separate entries rather than one "MH Wilds" tile with internal tabs:
 * each is a destination in its own right, the same way tools-minecraft
 * registers compat and viewer separately.
 *
 * All three components are `lazy` so a host's Tools hub can list them without
 * pulling the planner's calculation code or the bestiary's data into its
 * initial chunk.
 */

import { lazy } from "react";
import type { ToolManifest } from "@boffmedia/tool-kit";

import { MHWILDS_NS } from "./i18n";

/** Every screen loads its game data from the API, hence `api` on all three. */
const CAPABILITIES: ToolManifest["requiredCapabilities"] = ["api"];

/** All three grow with their content and are scrolled by the host: page scroll
 *  on the web, the Tools scrollport in the launcher. */
const LAYOUT: ToolManifest["layout"] = "document";

export const mhwildsPlannerTool: ToolManifest = {
  id: "mhwilds.planner",
  domain: "mhwilds",
  titleKey: `${MHWILDS_NS}.manifest.planner.name`,
  descriptionKey: `${MHWILDS_NS}.manifest.planner.tagline`,
  icon: "target",
  route: "/mhwilds/builds/planner",
  requiredCapabilities: CAPABILITIES,
  layout: LAYOUT,
  component: lazy(() =>
    import("./planner/_components/PlannerView").then((m) => ({ default: m.PlannerView })),
  ),
};

export const mhwildsTreeTool: ToolManifest = {
  id: "mhwilds.tree",
  domain: "mhwilds",
  titleKey: `${MHWILDS_NS}.manifest.tree.name`,
  descriptionKey: `${MHWILDS_NS}.manifest.tree.tagline`,
  icon: "sword",
  route: "/mhwilds/tree",
  requiredCapabilities: CAPABILITIES,
  layout: LAYOUT,
  component: lazy(() =>
    import("./tree/WeaponTreeView").then((m) => ({ default: m.WeaponTreeView })),
  ),
};

export const mhwildsBestiaryTool: ToolManifest = {
  id: "mhwilds.bestiary",
  domain: "mhwilds",
  titleKey: `${MHWILDS_NS}.manifest.bestiary.name`,
  descriptionKey: `${MHWILDS_NS}.manifest.bestiary.tagline`,
  icon: "skull",
  route: "/mhwilds/monsters",
  requiredCapabilities: CAPABILITIES,
  layout: LAYOUT,
  component: lazy(() =>
    import("./bestiary/BestiaryView").then((m) => ({ default: m.BestiaryView })),
  ),
};

export const mhwildsTools: ToolManifest[] = [
  mhwildsPlannerTool,
  mhwildsTreeTool,
  mhwildsBestiaryTool,
];
