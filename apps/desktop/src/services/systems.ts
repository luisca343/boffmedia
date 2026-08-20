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
      // A specific system (gba, nds, …) would come from version.emulator.kind;
      // until that is wired, "emulator" is the placeholder.
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

/** System metadata for UI rendering. `labelKey` is RELATIVE to the `common`
 *  namespace (consumers call `useT("common")`), so it must not repeat the
 *  prefix — `common.systems.x` resolved as `common.common.systems.x` and
 *  rendered the raw dotted key. Icons are the dedicated system glyphs in
 *  @boffmedia/ui (original line drawings; real console logos are trademarks). */
export const SYSTEMS: Array<{ id: SystemId; labelKey: string; icon: IconName }> = [
  { id: "minecraft", labelKey: "systems.minecraft", icon: "cube" },
  { id: "emulator", labelKey: "systems.emulator", icon: "handheld" },
  { id: "gba", labelKey: "systems.gba", icon: "handheld" },
  { id: "nds", labelKey: "systems.nds", icon: "dualscreen" },
  { id: "zomboid", labelKey: "systems.zomboid", icon: "skull" },
  { id: "stardew", labelKey: "systems.stardew", icon: "tree" },
]
