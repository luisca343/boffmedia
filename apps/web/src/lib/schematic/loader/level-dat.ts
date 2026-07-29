/**
 * Reads a pre-1.13 world's numeric block-id table out of its `level.dat`.
 *
 * Before the flattening, a modded world assigned every block an integer id at
 * first launch and recorded the assignment in its own `level.dat` — so the same
 * id means different blocks in two worlds, *even under the same modpack*
 * (verified live: id 2178 was `rustic:granite_pillar` in one save and a
 * LittleTiles block in another). A schematic stores only those integers, which
 * is why loading a modded `.schematic` needs the table from the world it was
 * cut in; anything else produces confidently wrong block names.
 *
 * Two on-disk shapes are handled:
 *   Forge 1.8–1.12   `FML.Registries["minecraft:blocks"].ids` → [{K: name, V: id}]
 *   Forge ≤ 1.7.10   `FML.ItemData`                           → [{K: "name", V: id}]
 */
import { parseNBT, type NbtCompound, type NbtValue } from "../parsers/nbt";
import { ERR, codedError } from "../errors";
import type { LegacyIdMap } from "../types";

export interface WorldIdTable {
  ids: LegacyIdMap;
  /** `Data.LevelName` — shown in the UI so a mismatched world is noticeable. */
  worldName?: string;
  /** Entries in `FML.ModList`, purely informational. */
  modCount?: number;
  source: "registries" | "itemdata";
}

function isCompound(v: NbtValue | undefined): v is NbtCompound {
  return typeof v === "object" && v !== null && !Array.isArray(v) && !ArrayBuffer.isView(v);
}

/** `[{K: name, V: id}, …]` → Map, dropping malformed rows. */
function collectPairs(list: NbtValue[], stripMarker: boolean): LegacyIdMap {
  const out: LegacyIdMap = new Map();
  for (const entry of list) {
    if (!isCompound(entry)) continue;
    const name = entry.K;
    const id = entry.V;
    if (typeof name !== "string" || typeof id !== "number") continue;
    // 1.7.10 prefixes each key with a type marker byte ( block,  item).
    if (stripMarker) {
      if (name.charCodeAt(0) !== 1) continue;
      out.set(id, name.slice(1));
    } else {
      out.set(id, name);
    }
  }
  return out;
}

/**
 * Parse a `level.dat` into its block id table.
 *
 * Throws {@link ERR.levelDatNoRegistry} for a vanilla (unmodded) `level.dat`,
 * which carries no id table at all — there is nothing to resolve and the caller
 * should say so rather than silently continue with an empty map.
 */
export function parseLevelDat(buffer: Uint8Array): WorldIdTable {
  let root: NbtCompound;
  try {
    root = parseNBT(buffer);
  } catch {
    throw codedError(ERR.levelDatUnreadable, "This file is not a readable level.dat.");
  }

  const data = isCompound(root.Data) ? root.Data : undefined;
  const worldName = typeof data?.LevelName === "string" ? data.LevelName : undefined;
  const fml = isCompound(root.FML) ? root.FML : isCompound(root.fml) ? root.fml : undefined;
  const modCount = Array.isArray(fml?.ModList) ? fml.ModList.length : undefined;

  const registries = isCompound(fml?.Registries) ? fml.Registries : undefined;
  const blockReg = isCompound(registries?.["minecraft:blocks"])
    ? (registries["minecraft:blocks"] as NbtCompound)
    : undefined;
  if (Array.isArray(blockReg?.ids)) {
    const ids = collectPairs(blockReg.ids, false);
    if (ids.size) return { ids, worldName, modCount, source: "registries" };
  }

  if (Array.isArray(fml?.ItemData)) {
    const ids = collectPairs(fml.ItemData, true);
    if (ids.size) return { ids, worldName, modCount, source: "itemdata" };
  }

  throw codedError(
    ERR.levelDatNoRegistry,
    "This level.dat carries no Forge block registry — it is either vanilla or from a version that stores ids elsewhere.",
  );
}
