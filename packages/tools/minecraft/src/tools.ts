/**
 * D6 — this package's registry manifests. Hosts render their tool listings from
 * these; nothing host-shaped (routes aside) appears here.
 *
 * Both components are `lazy`: three.js, the block registries and the worker
 * bundle must not be pulled into a host's initial chunk just because the Tools
 * hub is on screen.
 */

import { lazy } from "react";
import type { ToolManifest } from "@boffmedia/tool-kit";

import { SCHEMATIC_COMPAT_NS, SCHEMATIC_VIEWER_NS } from "./i18n";

export const schematicCompatTool: ToolManifest = {
  id: "minecraft.schematic-compat",
  domain: "minecraft",
  titleKey: `${SCHEMATIC_COMPAT_NS}.appName`,
  descriptionKey: `${SCHEMATIC_COMPAT_NS}.appTagline`,
  icon: "cube",
  route: "/minecraft/schematic-compat",
  // The export flow is the only host-shaped thing either tool does.
  requiredCapabilities: ["saveFile"],
  component: lazy(() =>
    import("./schematic-compat/SchematicCompatTool").then((m) => ({
      default: m.SchematicCompatTool,
    })),
  ),
};

export const schematicViewerTool: ToolManifest = {
  id: "minecraft.schematic-viewer",
  domain: "minecraft",
  titleKey: `${SCHEMATIC_VIEWER_NS}.appName`,
  descriptionKey: `${SCHEMATIC_VIEWER_NS}.appTagline`,
  icon: "cube",
  route: "/minecraft/schematic-viewer",
  component: lazy(() =>
    import("./schematic-viewer/SchematicViewerTool").then((m) => ({
      default: m.SchematicViewerTool,
    })),
  ),
};

export const minecraftTools: ToolManifest[] = [schematicCompatTool, schematicViewerTool];
