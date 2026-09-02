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
   * Roles an account must hold for a host to LIST this tool. Any one of them
   * is enough; absent (the normal case) means everybody sees it.
   *
   * Listing, and only listing. The API is what refuses the request — every
   * endpoint behind a tool declared here carries its own role guard, and would
   * refuse an unauthorised caller whether or not the tile was ever drawn. What
   * this buys is a hub that does not advertise a door nobody can open, which
   * is the whole of the problem: an admin-only tool sitting in a player's Tools
   * grid reads as a bug long before anyone clicks it.
   *
   * A host that cannot resolve roles at all treats every entry here as "hide",
   * because offering a tool whose every call 403s is the worse of the two
   * wrong answers.
   */
  requiredRoles?: string[];
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
   * The tool has NO gutter of its own and wants the host to supply its
   * standard one. Absent (the default) means the tool pads itself.
   *
   * This exists because the two hosts disagree, and the disagreement is
   * invisible until a tool is opened in the second one. `apps/web` wraps every
   * tool in `ToolShell`, which pads by DEFAULT and is escaped per route with
   * `bleed`. The launcher pads NOTHING: it hands the tool the full width and
   * expects it to bring its own — which most do, out of their chassis
   * (`--dk-pad` in the datakit, `--mew-gutter` in Mewgenics).
   *
   * A tool written for the web alone therefore has no gutter in its own markup
   * and renders flush to both window edges in the launcher, looking broken
   * while type-checking perfectly. The five `misc.*` tools were exactly that.
   *
   * Opt-IN rather than a flipped default on purpose: nine shipped tools already
   * pad themselves, and making the launcher pad by default would have doubled
   * every one of their gutters to fix five.
   */
  gutter?: boolean;
  /**
   * Route segment used by hosts that have URLs (web). The launcher keys its
   * view state off `id` instead.
   */
  route?: string;
  /**
   * Declares that the tool has an optional heavy-art bundle it can fetch as a
   * single versioned archive instead of many individual asset requests. Purely
   * declarative data — this package does no downloading — read by a host that
   * knows how to gate on it (the desktop launcher's pack manager) and ignored
   * by hosts that do not (the web, which serves the loose tree directly).
   */
  dataPack?: {
    /** Matches the `tool` key the pack manager and the pack index use. */
    id: string;
    /** Message key for the pack's display name in gate/settings UI. */
    labelKey?: string;
  };
}

const registry = new Map<string, ToolManifest>();

export function registerTools(manifests: ToolManifest[]): void {
  for (const manifest of manifests) {
    registry.set(manifest.id, manifest);
  }
}

/**
 * Whether an account holding `roles` may SEE this tool. See
 * {@link ToolManifest.requiredRoles} — visibility, never permission.
 *
 * Note the default: with no roles supplied, a role-gated tool is hidden. That
 * asymmetry is deliberate. Every existing call site passes nothing, and the
 * safe reading of "I do not know who this is" for an admin tool is "not them".
 */
export function isToolVisibleTo(manifest: ToolManifest, roles?: string[]): boolean {
  if (!manifest.requiredRoles?.length) return true;
  if (!roles?.length) return false;
  return manifest.requiredRoles.some((role) => roles.includes(role));
}

export function listTools(filter?: { domain?: ToolDomain; roles?: string[] }): ToolManifest[] {
  const all = [...registry.values()];
  const scoped = filter?.domain ? all.filter((t) => t.domain === filter.domain) : all;
  const visible = scoped.filter((t) => isToolVisibleTo(t, filter?.roles));
  return visible.sort((a, b) => a.id.localeCompare(b.id));
}

export function getTool(id: string): ToolManifest | undefined {
  return registry.get(id);
}
