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

// Most formats return an in-memory byte buffer; `prefab` returns a streamed Blob
// (its dense document can be multiple GB, so it's never fully resident — see
// {@link writePrefab}). The worker wraps a Uint8Array in a Blob and passes a Blob
// straight through.
export function exportStructure(structure: SchematicStructure, format: ExportFormat): Uint8Array | Blob {
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
