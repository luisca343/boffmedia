/**
 * This package's registry manifests. Hosts render their tool listings from
 * these; nothing host-shaped (routes aside) appears here.
 *
 * Both components are `lazy`: three.js, the block registries and the worker
 * bundle must not be pulled into a host's initial chunk just because the Tools
 * hub is on screen.
 */

import { lazy } from "react";
import type { ToolManifest } from "@boffmedia/tool-kit";

import { SCHEMATIC_COMPAT_NS, SCHEMATIC_VIEWER_NS, SEED_FINDER_NS } from "./i18n";

export const schematicCompatTool: ToolManifest = {
  id: "minecraft.schematic-compat",
  domain: "minecraft",
  titleKey: `${SCHEMATIC_COMPAT_NS}.appName`,
  descriptionKey: `${SCHEMATIC_COMPAT_NS}.appTagline`,
  icon: "cube",
  route: "/minecraft/schematic-compat",
  // A WebGL canvas cannot size itself from content: these two want a bounded
  // box and scroll their own panes inside it.
  layout: "viewport",
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
  // A WebGL canvas cannot size itself from content: these two want a bounded
  // box and scroll their own panes inside it.
  layout: "viewport",
  component: lazy(() =>
    import("./schematic-viewer/SchematicViewerTool").then((m) => ({
      default: m.SchematicViewerTool,
    })),
  ),
};

export const seedFinderTool: ToolManifest = {
  id: "minecraft.seeds",
  domain: "minecraft",
  titleKey: `${SEED_FINDER_NS}.appName`,
  descriptionKey: `${SEED_FINDER_NS}.appTagline`,
  icon: "cube",
  route: "/minecraft/seeds",
  // The map owns the screen: controls sit beside it and only the sidebar
  // scrolls, so nothing here belongs in a scrolling document. This also gives
  // the wheel back to the map — in a document layout a wheel over a large map
  // either zooms and traps the page, or scrolls and makes the map inert.
  layout: "viewport",
  // Exporting a spec writes a file, and an `<a download>` is inert in the
  // launcher's webview — the settings modal goes through the host instead.
  requiredCapabilities: ["saveFile"],
  component: lazy(() =>
    import("./seeds/SeedFinderTool").then((m) => ({
      default: m.SeedFinderTool,
    })),
  ),
};

export const minecraftTools: ToolManifest[] = [schematicCompatTool, schematicViewerTool, seedFinderTool];
