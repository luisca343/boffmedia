import type { IconName } from "@boffmedia/ui"
import type { PackSummary, PackEntry } from "./types"

export type SystemId = "minecraft" | "emulator" | "gba" | "nds" | "zomboid" | "stardew"

/** Map a pack to its system. For emulator packs, this returns "emulator" as a
 *  placeholder — call systemOfEntry instead if you have the version summary. */
export function systemOf(pack: PackSummary): SystemId {
  switch (pack.gameType) {
    case "minecraft":
      return "minecraft"
    case "emulator":
      // Cycle 2 will read version.emulator.kind for a specific system (gba, nds, etc.)
      // For now, we return "emulator" as a placeholder.
      return "emulator"
    case "zomboid":
      return "zomboid"
    case "stardew":
      return "stardew"
  }
}

/** Map a pack entry (with version) to its system. Handles emulator kind mapping. */
export function systemOfEntry(entry: PackEntry): SystemId {
  switch (entry.pack.gameType) {
    case "minecraft":
      return "minecraft"
    case "emulator":
      // Map emulatorKind from the version summary to the specific system
      if (!entry.latest) return "emulator"
      switch (entry.latest.emulatorKind) {
        case "mgba":
          return "gba"
        case "melonds":
          return "nds"
        default:
          return "emulator"
      }
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
