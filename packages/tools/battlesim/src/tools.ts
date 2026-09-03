/**
 * This package's registry manifest. Hosts render their tool listings from it;
 * nothing host-shaped (the route aside) appears here.
 *
 * The component is `lazy` so a Tools hub can list battlesim without pulling the
 * battle engine, the scene compositor and the @pkmn data tables into its
 * initial chunk — this is the heaviest tool in the repo by some margin.
 */

import { lazy } from "react";
import type { ToolManifest } from "@boffmedia/tool-kit";

import { BATTLESIM_NS } from "./i18n";
import { setShowdownProxyEnabled } from "./config";

export const battlesimTool: ToolManifest = {
  id: "pokemon.battlesim",
  domain: "pokemon",
  titleKey: `${BATTLESIM_NS}.manifest.title`,
  descriptionKey: `${BATTLESIM_NS}.manifest.description`,
  categoryKey: `${BATTLESIM_NS}.manifest.category`,
  icon: "sword",
  route: "/pokemon/battlesim",
  // `storage` is the offline core: replays of AI battles are written locally and
  // played back with no network at all. PvP, replay upload and team sync are
  // gated at RUNTIME on `useToolOnline()` + `useToolSession()` instead of being
  // declared here — a tool that lists `api` disappears from a host that cannot
  // provide it, and battlesim's whole point is that it still works offline.
  requiredCapabilities: ["storage"],
  // A bounded box the battle canvas fills exactly, with the hub scrolling its
  // own pane inside it. Declaring `document` here would let the host size the
  // canvas to its content and grow a second scrollbar around the first.
  layout: "viewport",
  gutter: false,
  dataPack: { id: "battlesim", labelKey: `${BATTLESIM_NS}.manifest.pack` },
  component: lazy(() => import("./BsimRoot").then((m) => ({ default: m.default }))),
};

/**
 * The manifests for a host, given what that host can offer.
 *
 * @param showdownProxy web passes `true`; the launcher passes `false` (D5). This
 *        is not cosmetic — it is what makes the Showdown screens unreachable
 *        rather than merely unlisted, since the nav seam can be driven to a
 *        screen directly by a restored address.
 */
export function battlesimToolsFor({ showdownProxy }: { showdownProxy: boolean }): ToolManifest[] {
  setShowdownProxyEnabled(showdownProxy);
  return [battlesimTool];
}

/** Registry-driven hosts (the launcher) import this. Showdown stays off. */
export const battlesimTools: ToolManifest[] = battlesimToolsFor({ showdownProxy: false });

export default battlesimTools;
