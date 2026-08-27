/**
 * Tool discovery is registry-driven. Domain packages export manifest entries;
 * hosts render their listings from the registry, so adding a tool costs a
 * manifest entry and a catalog merge, not per-tool host wiring.
 *
 * The manifest stays DECLARATIVE on purpose (ids, message keys, a lazy
 * component, capabilities). No logic lives here — that is what keeps the
 * registry from becoming a dumping ground.
 */

import type { ComponentType, LazyExoticComponent } from "react";

import type { ToolCapability } from "./host";

export type ToolDomain = "minecraft" | "pokemon" | "mhwilds" | "misc";

/** See `ToolManifest.layout`. */
export type ToolLayout = "document" | "viewport";

export interface ToolManifest {
  /** Stable, host-independent identifier, e.g. `minecraft.schematic-compat`. */
  id: string;
  domain: ToolDomain;
  /** Message keys resolved through `@boffmedia/ui`'s `useTranslate`. */
  titleKey: string;
  descriptionKey: string;
  /** Lucide-style icon name; hosts map it to their own icon set. */
  icon: string;
  /**
   * Message key for the short kind-of-thing label a listing shows above the
   * title ("Bestiary", "Planner", "3D viewer").
   *
   * Declarative like the rest of the manifest: a host that groups tools by
   * domain still needs to tell two tools in the same domain apart at a glance,
   * and deriving that from the id would encode a naming convention no package
   * has agreed to.
   */
  categoryKey?: string;
  /** Flags the tool as new in a host's listing. */
  isNew?: boolean;
  component: LazyExoticComponent<ComponentType<Record<string, never>>>;
  /** Hosts hide (or disable) a tool whose capabilities they cannot provide. */
  requiredCapabilities?: ToolCapability[];
  /**
   * How the tool expects to be sized and scrolled — the one structural thing a
   * host cannot guess from the manifest alone.
   *
   * `"document"` (the default): the tool GROWS with its content and needs an
   * ancestor to scroll it, the way a web page does. Its chrome sticks to the
   * top of whatever box the host gives it. Every tool converted to page scroll
   * on the web is this shape.
   *
   * `"viewport"`: the tool wants a BOUNDED box that it fills exactly and
   * scrolls its own panes inside. A WebGL canvas needs this — it cannot size
   * itself from content.
   *
   * Getting this wrong is silent and total: a `"document"` tool dropped into a
   * clipped box cannot scroll AT ALL. That is exactly what happened to the MH
   * Wilds tools, because the launcher had assumed every tool was `"viewport"`
   * (true of the only two that existed at the time).
   */
  layout?: ToolLayout;
  /**
   * Route segment used by hosts that have URLs (web). The launcher keys its
   * view state off `id` instead.
   */
  route?: string;
}

const registry = new Map<string, ToolManifest>();

export function registerTools(manifests: ToolManifest[]): void {
  for (const manifest of manifests) {
    registry.set(manifest.id, manifest);
  }
}

export function listTools(filter?: { domain?: ToolDomain }): ToolManifest[] {
  const all = [...registry.values()];
  const scoped = filter?.domain ? all.filter((t) => t.domain === filter.domain) : all;
  return scoped.sort((a, b) => a.id.localeCompare(b.id));
}

export function getTool(id: string): ToolManifest | undefined {
  return registry.get(id);
}
