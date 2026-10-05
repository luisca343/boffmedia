import { lazy } from "react"
import type { ToolManifest } from "@boffmedia/tool-kit"

export const tierListTool: ToolManifest = {
  id: "misc.tier-lists",
  domain: "misc",
  titleKey: "tierLists.hubTitle",
  descriptionKey: "tierLists.hubLead",
  categoryKey: "tools.misc.manifest.sorteos.category",
  icon: "list",
  route: "/tier-lists",
  requiredCapabilities: ["data", "api", "saveFile", "assetUrl", "uploadImage"],
  layout: "document",
  gutter: true,
  component: lazy(() => import("./TierListsView").then((module) => ({ default: module.TierListsView }))),
}

export const tierListTools = [tierListTool]
