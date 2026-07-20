import type { ExportFormat } from "@/lib/schematic/types";

const EXT: Record<ExportFormat, string> = {
  schem: "schem",
  schem3: "schem",
  litematic: "litematic",
  nbt: "nbt",
  prefab: "prefab.json",
};

export function convertedFilename(original: string, format: ExportFormat): string {
  // Strip a trailing extension (and the `.prefab` of `.prefab.json`).
  const base = original.replace(/\.prefab\.json$/i, "").replace(/\.[^.]+$/, "") || "schematic";
  return `${base}-converted.${EXT[format]}`;
}

/**
 * A prefab too large for one file comes back as a .zip of part prefabs (the
 * worker sets the Blob type), so the extension has to follow.
 */
export function partsArchiveName(name: string): string {
  return name.replace(/\.prefab\.json$/i, "-parts.zip");
}
