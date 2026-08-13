/**
 * @boffmedia/tools-minecraft — the Minecraft tool domain.
 *
 * Host-agnostic by contract (see the plan's §3): no `next/*`, no `next-intl`,
 * no `@/` imports, no `@tauri-apps/*`. Everything host-shaped goes through
 * `@boffmedia/tool-kit`; translation rides on `@boffmedia/ui`'s `configureUi`.
 */

// Tool entry points. Hosts with their own routing (web) import these directly;
// registry-driven hosts (the launcher Tools hub) go through `minecraftTools`.
export { SchematicCompatTool } from "./schematic-compat/SchematicCompatTool";
export { SchematicViewerTool } from "./schematic-viewer/SchematicViewerTool";

// Registry manifests (D6).
export { minecraftTools, schematicCompatTool, schematicViewerTool } from "./tools";

// Message-key namespaces + the bound-translator shim, for hosts that merge the
// package catalogs or render tool titles themselves.
export { SCHEMATIC_COMPAT_NS, SCHEMATIC_VIEWER_NS, useToolT } from "./i18n";

// The shared schematic UI kit. Exported because the web styleguide renders it
// directly, and because a future minecraft tool will build on it.
export * from "./ui";
