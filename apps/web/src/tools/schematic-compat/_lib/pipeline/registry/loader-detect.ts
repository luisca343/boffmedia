import type { ModInfo } from "../../types";

export type ModLoader = ModInfo["loader"];

export interface InstanceInfo {
  version: string;
  modLoader?: ModLoader;
  instanceName?: string;
  /** Which launcher layout the metadata came from — surfaced in the UI. */
  launcher?: string;
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

/** A plausible Minecraft release string ("1.20", "1.21.1"), not a loader build. */
function isVersionLike(v: unknown): v is string {
  return typeof v === "string" && /^\d+\.\d+(\.\d+)?$/.test(v.trim());
}

// ─── Per-launcher detectors ───────────────────────────────────────────────────
// Each takes the lowercased-basename → text map and returns InstanceInfo or
// undefined. Order in DETECTORS is priority: the most specific//reliable layout
// wins when a folder carries several metadata files (common when a pack was
// imported between launchers).

type Detector = (metas: Map<string, string>) => InstanceInfo | undefined;

/** CurseForge runtime instance file. */
const curseForgeInstance: Detector = (metas) => {
  const text = metas.get("minecraftinstance.json");
  if (!text) return undefined;
  const data = tryParse(text) as
    | { gameVersion?: string; name?: string; baseModLoader?: { name?: string } }
    | undefined;
  if (!data?.gameVersion) return undefined;
  return {
    version: data.gameVersion,
    modLoader: normalizeLoader(data.baseModLoader?.name),
    instanceName: data.name,
    launcher: "CurseForge",
  };
};

/** CurseForge / modpack-export manifest. */
const curseForgeManifest: Detector = (metas) => {
  const text = metas.get("manifest.json");
  if (!text) return undefined;
  const data = tryParse(text) as
    | {
        name?: string;
        minecraft?: { version?: string; modLoaders?: Array<{ id?: string; primary?: boolean }> };
      }
    | undefined;
  const version = data?.minecraft?.version;
  if (!version) return undefined;
  const loaders = data?.minecraft?.modLoaders ?? [];
  const primary = loaders.find((l) => l.primary) ?? loaders[0];
  return {
    version,
    modLoader: normalizeLoader(primary?.id),
    instanceName: data?.name,
    launcher: "CurseForge",
  };
};

/**
 * MultiMC / Prism Launcher / PolyMC. `mmc-pack.json` lists one component per
 * dependency — the game itself under `net.minecraft`, the loader under
 * `net.minecraftforge` / `net.fabricmc.fabric-loader` / `net.neoforged`. The
 * instance's display name lives in the INI-style `instance.cfg`.
 */
const multiMC: Detector = (metas) => {
  const text = metas.get("mmc-pack.json");
  if (!text) return undefined;
  const data = tryParse(text) as
    | { components?: Array<{ uid?: string; version?: string; cachedName?: string }> }
    | undefined;
  const components = data?.components;
  if (!Array.isArray(components)) return undefined;
  const game = components.find((c) => c.uid === "net.minecraft");
  if (!game?.version) return undefined;
  const loaderUid = components.find(
    (c) => typeof c.uid === "string" && c.uid !== "net.minecraft" && normalizeLoader(c.uid),
  )?.uid;
  return {
    version: game.version,
    modLoader: normalizeLoader(loaderUid),
    instanceName: readCfgName(metas.get("instance.cfg")),
    launcher: "MultiMC / Prism",
  };
};

/** Pull `name=…` out of MultiMC's INI-style instance.cfg. */
function readCfgName(cfg: string | undefined): string | undefined {
  if (!cfg) return undefined;
  for (const line of cfg.split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    if (line.slice(0, eq).trim().toLowerCase() === "name") {
      const value = line.slice(eq + 1).trim();
      if (value) return value;
    }
  }
  return undefined;
}

/**
 * Modrinth App. `profile.json` carries the game version and a `loader` string;
 * older builds nest the same fields under `metadata`.
 */
const modrinth: Detector = (metas) => {
  const text = metas.get("profile.json");
  if (!text) return undefined;
  const data = tryParse(text) as
    | {
        name?: string;
        game_version?: string;
        loader?: string;
        metadata?: { name?: string; game_version?: string; loader?: string };
      }
    | undefined;
  const meta = data?.metadata ?? data;
  const version = meta?.game_version;
  if (!version) return undefined;
  return {
    version,
    modLoader: normalizeLoader(meta?.loader),
    instanceName: meta?.name ?? data?.name,
    launcher: "Modrinth",
  };
};

/**
 * ATLauncher. `instance.json` holds the version under `id`, with the loader
 * described by `launcher.loaderVersion.type`.
 */
const atLauncher: Detector = (metas) => {
  const text = metas.get("instance.json");
  if (!text) return undefined;
  const data = tryParse(text) as
    | {
        id?: string;
        launcher?: { name?: string; loaderVersion?: { type?: string } };
      }
    | undefined;
  if (!isVersionLike(data?.id)) return undefined;
  return {
    version: data!.id!.trim(),
    modLoader: normalizeLoader(data?.launcher?.loaderVersion?.type),
    instanceName: data?.launcher?.name,
    launcher: "ATLauncher",
  };
};

/**
 * Plain `.minecraft` (vanilla launcher). `launcher_profiles.json` has no single
 * "this instance is version X" field — profiles each name their own version — so
 * we take the newest release-like `lastVersionId` across profiles. Loader
 * profiles ("fabric-loader-0.15-1.20.1") also carry the game version at the end.
 */
const vanillaLauncher: Detector = (metas) => {
  const text = metas.get("launcher_profiles.json");
  if (!text) return undefined;
  const data = tryParse(text) as
    | { profiles?: Record<string, { lastVersionId?: string; name?: string }> }
    | undefined;
  const profiles = Object.values(data?.profiles ?? {});
  if (profiles.length === 0) return undefined;

  let best: { version: string; loader?: ModLoader } | undefined;
  for (const p of profiles) {
    const raw = p.lastVersionId;
    if (typeof raw !== "string") continue;
    // Matches both a bare release ("1.20.1") and a loader profile that ends in
    // one ("fabric-loader-0.15.11-1.20.1").
    const version = raw.trim().match(/(\d+\.\d+(?:\.\d+)?)$/)?.[1];
    if (!version) continue;
    if (!best || compareVersions(version, best.version) > 0) {
      best = { version, loader: normalizeLoader(raw) };
    }
  }
  if (!best) return undefined;
  return {
    version: best.version,
    modLoader: best.loader,
    instanceName: ".minecraft",
    launcher: "Minecraft Launcher",
  };
};

/** Numeric version compare; returns >0 when `a` is newer than `b`. */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

const DETECTORS: Detector[] = [
  curseForgeInstance,
  multiMC,
  modrinth,
  atLauncher,
  curseForgeManifest,
  vanillaLauncher,
];

/** Every metadata filename any detector reads (lowercased). */
export const INSTANCE_META_FILENAMES: readonly string[] = [
  "minecraftinstance.json",
  "manifest.json",
  "mmc-pack.json",
  "instance.cfg",
  "profile.json",
  "instance.json",
  "launcher_profiles.json",
];

/**
 * Detect the Minecraft version + mod loader of an instance from whatever
 * launcher metadata the picked folder carries. Supports CurseForge, MultiMC /
 * Prism / PolyMC, the Modrinth App, ATLauncher and a plain `.minecraft`.
 *
 * `metas` maps a lowercased base filename → file text. Returns `undefined` when
 * no layout matched — the caller falls back to asking the user directly, which
 * is what makes an arbitrary folder usable.
 */
export function detectInstance(metas: Map<string, string>): InstanceInfo | undefined {
  for (const detect of DETECTORS) {
    const info = detect(metas);
    if (info) return info;
  }
  return undefined;
}
