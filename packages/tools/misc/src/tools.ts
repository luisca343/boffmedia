/**
 * This package's registry manifests. Hosts render their tool listings from
 * these; nothing host-shaped (routes aside) appears here.
 *
 * The components are `lazy` so a host's Tools hub can list five tools without
 * pulling five tool bodies — the giveaways draw engine among them — into its
 * initial chunk.
 *
 * Every one of these is `layout: "document"`. None owns a canvas or a fixed
 * frame: each grows with its content — a table of ROMs, a grid of store cards,
 * a roster that gets longer as names are pasted in — and is scrolled by the
 * host. Declaring `viewport` here would clip them into a box they cannot scroll
 * inside, which fails silently and totally.
 *
 * Every one is also `gutter: true`, and for a related reason: all five were
 * written for the site, where `ToolShell` pads the content and nothing in the
 * tool's own markup ever needed a horizontal inset. The launcher has no such
 * wrapper, so without this they render flush to both window edges.
 */

import { lazy } from "react";
import type { ToolManifest } from "@boffmedia/tool-kit";

import { MISC_NS } from "./i18n";

const manifestKeys = (tool: string) => ({
  titleKey: `${MISC_NS}.manifest.${tool}.name`,
  descriptionKey: `${MISC_NS}.manifest.${tool}.description`,
  categoryKey: `${MISC_NS}.manifest.${tool}.category`,
});

export const sorteosTool: ToolManifest = {
  id: "misc.sorteos",
  domain: "misc",
  ...manifestKeys("sorteos"),
  icon: "gift",
  route: "/otros/sorteos",
  // The only one of the five that never calls the API: the draw runs entirely
  // in the page. `storage` keeps the roster, the history and the three toggles
  // across visits; `saveFile` is the history CSV export, which without it is a
  // button that does nothing.
  requiredCapabilities: ["storage", "saveFile"],
  layout: "document",
  // No gutter of its own: on the site `ToolShell` supplies one. See `gutter`.
  gutter: true,
  component: lazy(() =>
    import("./sorteos/SorteosView").then((m) => ({ default: m.SorteosView })),
  ),
};

export const keysTool: ToolManifest = {
  id: "misc.keys",
  domain: "misc",
  ...manifestKeys("keys"),
  icon: "key",
  route: "/otros/keys",
  requiredCapabilities: ["api"],
  // The inventory is Boffmedia's own, not the viewer's. `/steamkeys` is gated
  // to BOFF_ADMIN in `apps/api`, which is what actually enforces this; the
  // declaration here only keeps the tile out of a hub where every click would
  // end in a 403.
  requiredRoles: ["BOFF_ADMIN"],
  layout: "document",
  // No gutter of its own: on the site `ToolShell` supplies one. See `gutter`.
  gutter: true,
  component: lazy(() =>
    import("./keys/KeysView").then((m) => ({ default: m.KeysView })),
  ),
};

export const steamFreeTool: ToolManifest = {
  id: "misc.steamfree",
  domain: "misc",
  ...manifestKeys("steamfree"),
  icon: "gift",
  route: "/otros/steamfree",
  requiredCapabilities: ["api"],
  isNew: true,
  layout: "document",
  // No gutter of its own: on the site `ToolShell` supplies one. See `gutter`.
  gutter: true,
  component: lazy(() =>
    import("./steamfree/SteamFreeView").then((m) => ({ default: m.SteamFreeView })),
  ),
};

export const bibliotecaTool: ToolManifest = {
  id: "misc.biblioteca",
  domain: "misc",
  ...manifestKeys("biblioteca"),
  icon: "book",
  route: "/otros/biblioteca",
  // `apiUrl` and `openUrl` are the download: the file is served with a
  // `Content-Disposition: attachment` and can be several GB, so the host opens
  // an absolute url rather than the tool fetching bytes it would have to hold.
  requiredCapabilities: ["api", "apiUrl", "openUrl"],
  layout: "document",
  // No gutter of its own: on the site `ToolShell` supplies one. See `gutter`.
  gutter: true,
  component: lazy(() =>
    import("./biblioteca/BibliotecaView").then((m) => ({ default: m.BibliotecaView })),
  ),
};

export const myrientTool: ToolManifest = {
  id: "misc.myrient",
  domain: "misc",
  ...manifestKeys("myrient"),
  icon: "download",
  route: "/otros/myrient",
  // `api` covers the stream too — `ToolApi.stream` is part of that capability,
  // and the bulk download reports its progress through it for as long as the
  // job runs.
  requiredCapabilities: ["api"],
  layout: "document",
  // No gutter of its own: on the site `ToolShell` supplies one. See `gutter`.
  gutter: true,
  component: lazy(() =>
    import("./myrient/MyrientDownloader").then((m) => ({ default: m.MyrientDownloader })),
  ),
};

export const miscTools: ToolManifest[] = [
  bibliotecaTool,
  keysTool,
  myrientTool,
  sorteosTool,
  steamFreeTool,
];
