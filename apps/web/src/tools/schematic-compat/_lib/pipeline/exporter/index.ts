/**
 * Export dispatch — serialise a {@link SchematicStructure} back to a file in the
 * requested format. The structure passed in is already version-converted
 * (resolutions applied) by the worker; this layer only handles serialisation.
 */
import type { SchematicStructure } from "../../types";
import { writeSchem } from "./schem-writer";
import { writeLitematic } from "./litematic-writer";
import { writeNbtStruct } from "./nbt-writer";
import { writePrefab } from "./prefab-writer";

export type ExportFormat = "schem" | "schem3" | "litematic" | "nbt" | "prefab";

export function exportStructure(structure: SchematicStructure, format: ExportFormat): Uint8Array {
  switch (format) {
    case "schem":
      return writeSchem(structure, 2);
    case "schem3":
      return writeSchem(structure, 3);
    case "litematic":
      return writeLitematic(structure);
    case "nbt":
      return writeNbtStruct(structure);
    case "prefab":
      return writePrefab(structure);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
