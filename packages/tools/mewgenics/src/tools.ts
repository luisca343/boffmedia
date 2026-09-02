/**
 * This package's registry manifests. Hosts render their tool listings from
 * these; nothing host-shaped (routes aside) appears here.
 *
 * The components are `lazy` so a host's Tools hub can list them without pulling
 * the codex's twelve category views, the normaliser and the cat compositor into
 * its initial chunk.
 */

import { lazy } from "react";
import type { ToolManifest } from "@boffmedia/tool-kit";

import { MEWGENICS_NS } from "./i18n";

/**
 * Two entries rather than one tile with a tab, for the same reason VGC is four:
 * someone opening the builder to dress a cat is not browsing the codex, and a
 * hub that hides a destination behind another gets searched instead of browsed.
 * They share one mounted tree all the same — see `MewRoot`.
 */
export const mewgenicsCodexTool: ToolManifest = {
  id: "misc.mewgenics-codex",
  domain: "misc",
  titleKey: `${MEWGENICS_NS}.manifest.codex.name`,
  descriptionKey: `${MEWGENICS_NS}.manifest.codex.description`,
  categoryKey: `${MEWGENICS_NS}.manifest.codex.category`,
  icon: "book",
  route: "/otros/mewgenics",
  // No API and no account: the whole dataset is static JSON under the shared
  // asset tree, which the launcher serves from its own on-disk cache. What it
  // does need is somewhere to keep the trail, the favourites and the three
  // toggles, and a public url to build a share link out of.
  requiredCapabilities: ["storage", "siteUrl"],
  // Grows with its content — a grid of a few hundred cards, then a fiche taller
  // than any window — and is scrolled by the host. Its sticky chrome parks at
  // `--tool-sticky-top`, which is the other half of that deal.
  layout: "document",
  // Shares the heavy-art bundle with the builder below — one pack, both tools.
  // No labelKey: the gate/settings copy (K09/K10) falls back to the tool's own
  // titleKey until those i18n keys land.
  dataPack: { id: "mewgenics" },
  component: lazy(() => import("./MewRoot").then((m) => ({ default: m.MewCodexTool }))),
};

export const mewgenicsBuilderTool: ToolManifest = {
  id: "misc.mewgenics-builder",
  domain: "misc",
  titleKey: `${MEWGENICS_NS}.manifest.builder.name`,
  descriptionKey: `${MEWGENICS_NS}.manifest.builder.description`,
  categoryKey: `${MEWGENICS_NS}.manifest.builder.category`,
  icon: "paw",
  route: "/otros/mewgenics/builder",
  // `saveFile` is the PNG export — the one capability here that is not
  // optional: without it the export button is the button that does nothing.
  // `storage` is added alongside it because the shared MewRoot persists trail
  // / favourites / toggles the same way the codex does — declaring it here is
  // what makes that persistence honest rather than a silent capability miss.
  requiredCapabilities: ["saveFile", "storage", "siteUrl"],
  // Three columns and a drawer inside a fixed frame, each scrolling its own
  // pane. A host that scrolled it as well would size it to content and grow a
  // second scrollbar around the first.
  layout: "viewport",
  // Shares the heavy-art bundle with the codex above — one pack, both tools.
  dataPack: { id: "mewgenics" },
  component: lazy(() => import("./MewRoot").then((m) => ({ default: m.MewBuilderTool }))),
};

export const mewgenicsTools: ToolManifest[] = [mewgenicsCodexTool, mewgenicsBuilderTool];
