import type { IconName } from "@boffmedia/ui"
import type { PackSummary } from "./types"

export type SystemId = "minecraft" | "emulator" | "gba" | "nds" | "zomboid" | "stardew"

/** Map a pack to its system. */
export function systemOf(pack: PackSummary): SystemId {
  switch (pack.gameType) {
    case "minecraft":
      return "minecraft"
    case "emulator":
      // Cycle 2 will read version.emulator.kind for a specific system (gba, nds, etc.)
      // For Cycle 1, we return "emulator" as a placeholder.
      return "emulator"
    case "zomboid":
      return "zomboid"
    case "stardew":
      return "stardew"
  }
}

/** System metadata for UI rendering. */
export const SYSTEMS: Array<{ id: SystemId; labelKey: string; icon: IconName }> = [
  { id: "minecraft", labelKey: "common.systems.minecraft", icon: "gamepad" },
  { id: "emulator", labelKey: "common.systems.emulator", icon: "database" },
  { id: "gba", labelKey: "common.systems.gba", icon: "database" },
  { id: "nds", labelKey: "common.systems.nds", icon: "server" },
  { id: "zomboid", labelKey: "common.systems.zomboid", icon: "shield" },
  { id: "stardew", labelKey: "common.systems.stardew", icon: "tree" },
]
