/**
 * D6 — tool discovery is registry-driven. Domain packages export manifest
 * entries; hosts render their listings from the registry so porting tool #2..N
 * costs a manifest entry and a catalog merge, not per-tool host wiring.
 *
 * The manifest stays DECLARATIVE on purpose (ids, message keys, a lazy
 * component, capabilities). No logic lives here — that is what keeps the
 * registry from becoming a dumping ground.
 */

import type { ComponentType, LazyExoticComponent } from "react";

import type { ToolCapability } from "./host";

export type ToolDomain = "minecraft" | "pokemon" | "mhwilds" | "misc";

export interface ToolManifest {
  /** Stable, host-independent identifier, e.g. `minecraft.schematic-compat`. */
  id: string;
  domain: ToolDomain;
  /** Message keys resolved through `@boffmedia/ui`'s `useTranslate`. */
  titleKey: string;
  descriptionKey: string;
  /** Lucide-style icon name; hosts map it to their own icon set. */
  icon: string;
  component: LazyExoticComponent<ComponentType<Record<string, never>>>;
  /** Hosts hide (or disable) a tool whose capabilities they cannot provide. */
  requiredCapabilities?: ToolCapability[];
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
