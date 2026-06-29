import type { ModInfo } from "../../types";

export type ModLoader = ModInfo["loader"];

export interface InstanceInfo {
  version: string;
  modLoader?: ModLoader;
  instanceName?: string;
}

/** Normalize a launcher loader label ("forge", "neoForge", "fabric-loader") → our enum. */
function normalizeLoader(raw: string | undefined): ModLoader | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase();
  if (s.includes("neoforge")) return "neoforge";
  if (s.includes("forge")) return "forge";
  if (s.includes("fabric") || s.includes("quilt")) return "fabric";
  return undefined;
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Detect the Minecraft version + mod loader of an instance from its launcher
 * metadata files. Supports the two common shapes:
 *   - `minecraftinstance.json` (CurseForge runtime metadata)
 *   - `manifest.json` (CurseForge modpack export)
 *
 * `metas` maps a lowercased base filename → file text.
 */
export function detectInstance(metas: Map<string, string>): InstanceInfo | undefined {
  // CurseForge runtime instance file.
  const instanceText = metas.get("minecraftinstance.json");
  if (instanceText) {
    const data = tryParse(instanceText) as
      | { gameVersion?: string; name?: string; baseModLoader?: { name?: string } }
      | undefined;
    if (data?.gameVersion) {
      return {
        version: data.gameVersion,
        modLoader: normalizeLoader(data.baseModLoader?.name),
        instanceName: data.name,
      };
    }
  }

  // CurseForge modpack manifest.
  const manifestText = metas.get("manifest.json");
  if (manifestText) {
    const data = tryParse(manifestText) as
      | {
          name?: string;
          minecraft?: { version?: string; modLoaders?: Array<{ id?: string; primary?: boolean }> };
        }
      | undefined;
    const version = data?.minecraft?.version;
    if (version) {
      const loaders = data?.minecraft?.modLoaders ?? [];
      const primary = loaders.find((l) => l.primary) ?? loaders[0];
      return {
        version,
        modLoader: normalizeLoader(primary?.id),
        instanceName: data?.name,
      };
    }
  }

  return undefined;
}
