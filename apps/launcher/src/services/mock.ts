import type { PackManifest } from "@boffmedia/pack-schema"
import type { ContentFile, DirEntry, World } from "../runtime"
import type {
  CatalogCategory,
  ModFile,
  ModProject,
  ModSearchHit,
  ModSearchPage,
  ResolveSource,
  ResolvedFile,
} from "@boffmedia/ui"

import type {
  Account,
  CrashDiagnosis,
  DeviceCode,
  GameVersion,
  LoaderVersion,
  LogLine,
  PackEntry,
  PackSummary,
  PackVersionSummary,
  ServerStatus,
  Settings,
} from "./types"

// Stand-in data so every screen is real and demoable WITHOUT the Rust side —
// which is the whole point: `pnpm dev:renderer` runs in a browser, where there
// are no Tauri commands and no pack registry to talk to. On desktop these are
// replaced by the real calls in services/packs.ts.

function version(
  id: string,
  name: string,
  createdAt: string,
  fileCount: number,
): PackVersionSummary {
  return {
    id,
    name,
    createdAt,
    minecraft: "1.21.4",
    loader: "neoforge",
    loaderVersion: "21.4.30",
    fileCount,
  }
}

// RF-01/RF-03: boff-smp declares a server so the Quick Play flag and the
// status badge are both demoable from `pnpm dev:renderer`.
const SMP_SERVER = { host: "play.boffmedia.es", port: 25565 }

const PACKS: {
  pack: PackSummary
  latest: PackVersionSummary
  server?: { host: string; port: number }
}[] = [
  {
    pack: {
      id: "pk_smp",
      slug: "boff-smp",
      name: "Boff SMP",
      summary: "El pack principal del servidor. Pixelmon, LittleTiles y utilidades.",
      iconUrl: null,
      accessKind: "allowlist",
    },
    latest: version("v_smp_5", "1.4.2", "2026-07-28T18:04:00Z", 84),
    server: SMP_SERVER,
  },
  {
    pack: {
      id: "pk_creative",
      slug: "boff-creativo",
      name: "Boff Creativo",
      summary: "Construcción: WorldEdit, LittleTiles y esquemas compartidos.",
      iconUrl: null,
      accessKind: "password",
    },
    latest: version("v_cre_2", "0.9.0", "2026-07-11T09:30:00Z", 31),
  },
  {
    pack: {
      id: "pk_eventos",
      slug: "boff-eventos",
      name: "Eventos",
      summary: "Pack ligero para torneos y minijuegos puntuales.",
      iconUrl: null,
      accessKind: "public",
    },
    latest: version("v_evt_1", "2026.7", "2026-07-02T20:00:00Z", 12),
  },
]

export const MOCK_ACCOUNT: Account = {
  uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  username: "Luisca",
  // Notch's skin — a real textures.minecraft.net URL, so dev:renderer exercises
  // the actual crop path rather than only the no-skin fallback.
  skinUrl: "https://textures.minecraft.net/texture/292009a4925b58f02c77dadc3ecef07ea4c7472f64e0fdc32ce5522489362680",
}

export const MOCK_DEVICE_CODE: DeviceCode = {
  userCode: "BOFF-9241",
  verificationUri: "https://www.microsoft.com/link",
  expiresInSeconds: 900,
}

export const MOCK_SETTINGS: Settings = {
  memoryMib: 6144,
  javaPath: null,
  gameDir: "C:\\Users\\luisca\\AppData\\Roaming\\.boff",
  closeOnLaunch: false,
  keepLogs: true,
  retainVersions: 3,
  memoryAuto: false,
}

/** Browser-mode library. The desktop equivalent is `loadPackEntries`, which
 *  goes through the Rust client — access filtering is the SERVER's job, so a
 *  pack the user cannot see never reaches that list in the first place. */
export function mockPackEntries(): PackEntry[] {
  return [
    {
      ...PACKS[0],
      state: {
        kind: "outdated",
        versionId: "v_smp_4",
        latestVersionId: "v_smp_5",
        sizeBytes: 1_284_000_000,
      },
      lastPlayed: "2026-07-29T21:12:00Z",
      origin: "managed",
    },
    {
      ...PACKS[1],
      state: { kind: "installed", versionId: "v_cre_2", sizeBytes: 612_000_000 },
      lastPlayed: "2026-07-20T17:45:00Z",
      origin: "managed",
    },
    { ...PACKS[2], state: { kind: "not-installed" }, lastPlayed: null, origin: "managed" },
    ...mockLocalPacks().map((manifest) => ({
      pack: {
        id: manifest.pack.id,
        slug: manifest.pack.slug,
        name: manifest.pack.name,
        summary: manifest.pack.summary ?? null,
        iconUrl: manifest.pack.iconUrl ?? null,
        accessKind: manifest.pack.access.kind,
      },
      latest: {
        id: manifest.version.id,
        name: manifest.version.name,
        minecraft: manifest.version.dependencies.minecraft,
        loader: null,
        loaderVersion: null,
        fileCount: manifest.version.files.length,
        createdAt: manifest.version.createdAt,
      },
      state: { kind: "not-installed" as const },
      lastPlayed: null,
      origin: "local" as const,
      server: manifest.pack.server,
    })),
  ]
}

/** RF-05..RF-09 in browser mode: a small in-memory library so the create/edit,
 *  export and import flows are all developable from `pnpm dev:renderer`. */
const localLibrary: PackManifest[] = [
  {
    formatVersion: 1,
    pack: {
      id: "local:local-mi-pack",
      slug: "local-mi-pack",
      name: "Mi pack",
      access: { kind: "public" },
    },
    version: {
      id: "local-v1",
      name: "local",
      createdAt: "2026-07-15T10:00:00Z",
      dependencies: { minecraft: "1.21.4" },
      files: [],
    },
  },
]

export function mockLocalPacks(): PackManifest[] {
  return localLibrary.map((m) => structuredClone(m))
}

/** Browser mode has no Rust to reach Mojang, so the pickers get a short,
 *  static list — enough to exercise both selects without a network call. */
export function mockGameVersions(): GameVersion[] {
  return [
    { id: "1.21.4", type: "release", releaseTime: "2024-12-03T10:00:00Z", latest: true },
    { id: "1.21.1", type: "release", releaseTime: "2024-08-08T10:00:00Z", latest: false },
    { id: "1.20.4", type: "release", releaseTime: "2023-12-07T10:00:00Z", latest: false },
    { id: "1.20.1", type: "release", releaseTime: "2023-06-12T10:00:00Z", latest: false },
    { id: "1.19.4", type: "release", releaseTime: "2023-03-14T10:00:00Z", latest: false },
  ]
}

export function mockLoaderVersions(): LoaderVersion[] {
  return [
    { version: "21.4.30", stable: true, latest: true, recommended: true },
    { version: "21.4.29", stable: true, latest: false, recommended: false },
    { version: "21.4.28-beta", stable: false, latest: false, recommended: false },
  ]
}

/** RF-03/RF-04 in browser mode: one clearly online server (players + MOTD) and
 *  one offline one, so both badge states are visible without a real ping. */
export function mockServerStatus(host: string): ServerStatus {
  if (host === SMP_SERVER.host) {
    return {
      online: true,
      players: { online: 10, max: 32 },
      motd: "Test Server",
      latencyMs: 34,
    }
  }
  return { online: false, players: null, motd: null, latencyMs: null }
}

const LOG_SEED: [LogLine["level"], LogLine["source"], string][] = [
  ["info", "launcher", "Resolviendo versión 1.21.4 (neoforge 21.4.30)"],
  ["info", "launcher", "Java 21 encontrado en el sistema — se omite la descarga"],
  ["info", "launcher", "84 archivos verificados, 3 pendientes de descarga"],
  ["debug", "launcher", "classpath: 214 entradas"],
  ["info", "game", "[main/INFO] Setting user: Luisca"],
  ["info", "game", "[Render thread/INFO] OpenGL: NVIDIA 560.94"],
  ["warn", "game", "[Worker-1/WARN] Mod 'oldmod' usa una API obsoleta"],
  ["info", "game", "[Render thread/INFO] Sound engine started"],
  ["error", "game", "[Worker-2/ERROR] No se pudo cargar la textura boff:items/missing"],
  ["info", "game", "[Render thread/INFO] Created: 1024x512 textures-atlas"],
]

/** Browser-mode stand-in for the tail of a crashed session, plus the verdict
 *  `install/crash.rs` produces for exactly these lines. Keeping the two in one
 *  place is what makes `dev:renderer` a real preview of the crash UI (§9). */
export const MOCK_CRASH_LOG: [LogLine["level"], LogLine["source"], string][] = [
  ["error", "game", "[main/ERROR] Incompatible mods found!"],
  [
    "error",
    "game",
    "net.fabricmc.loader.impl.FormattedException: Some of your mods are incompatible!",
  ],
  [
    "error",
    "game",
    "\tMod 'Sodium' (sodium) 0.5.8 requires any version of fabric api, which is missing!",
  ],
]

export const MOCK_DIAGNOSIS: CrashDiagnosis = {
  kind: "missing-dependency",
  title: "Falta Fabric API",
  explanation: "Uno de los mods necesita Fabric API y no está instalado en esta instancia.",
  action:
    "Repara la instalación desde la ficha del pack; si el problema sigue, avisa a los " +
    "administradores del pack: falta un mod obligatorio en el manifiesto.",
  evidence: [MOCK_CRASH_LOG[2][2].trim()],
}

/** Browser-mode stand-in for the `game://log` stream. On desktop the real lines
 *  arrive one at a time from the game's stdout. */
export function mockLogs(): LogLine[] {
  const base = Date.now() - LOG_SEED.length * 1400
  return LOG_SEED.map(([level, source, text], i) => ({
    ts: base + i * 1400,
    level,
    source,
    text,
  }))
}

// ── Mod catalog ────────────────────────────────────────────────────────────
// `pnpm --filter launcher dev:renderer` has no Rust and therefore no Modrinth.
// These fixtures are what let the whole picker — browse, detail, files,
// dependency resolution — be built and reviewed in a plain browser tab.

const catalogHits: ModSearchHit[] = [
  {
    platform: "modrinth",
    projectId: "P7dR8mSH",
    slug: "fabric-api",
    iconUrl: "https://cdn.modrinth.com/data/P7dR8mSH/icon.png",
    name: "Fabric API",
    summary: "Lightweight and modular API providing common hooks and intercompatibility.",
    downloads: 4_200_000,
    author: "modmuss50",
    categories: ["library", "fabric"],
    updatedAt: "2026-06-01T10:00:00Z",
    clientSide: "required",
    serverSide: "required",
  },
  {
    platform: "modrinth",
    projectId: "AANobbMI",
    slug: "sodium",
    iconUrl: "https://cdn.modrinth.com/data/AANobbMI/icon.png",
    name: "Sodium",
    summary: "A modern rendering engine that greatly improves frame rates.",
    downloads: 3_100_000,
    author: "jellysquid3",
    categories: ["optimization", "fabric"],
    updatedAt: "2026-05-20T10:00:00Z",
    clientSide: "required",
    serverSide: "unsupported",
  },
  {
    platform: "modrinth",
    projectId: "gvQqBUqZ",
    slug: "lithium",
    iconUrl: "https://cdn.modrinth.com/data/gvQqBUqZ/icon.png",
    name: "Lithium",
    summary: "No-compromises game logic and server optimisation mod.",
    downloads: 1_800_000,
    author: "jellysquid3",
    categories: ["optimization", "fabric"],
    updatedAt: "2026-04-11T10:00:00Z",
    clientSide: "optional",
    serverSide: "optional",
  },
]

export function mockCatalogSearch(query?: string): ModSearchPage {
  const needle = (query ?? "").trim().toLowerCase()
  const hits = needle
    ? catalogHits.filter((h) => h.name.toLowerCase().includes(needle))
    : catalogHits
  return { hits: structuredClone(hits), total: hits.length }
}

export function mockCatalogCategories(): CatalogCategory[] {
  return [
    { id: "optimization", name: "optimization" },
    { id: "library", name: "library" },
    { id: "adventure", name: "adventure" },
  ]
}

export function mockCatalogProject(projectId: string): ModProject | null {
  const hit = catalogHits.find((h) => h.projectId === projectId)
  if (!hit) return null
  return {
    ...structuredClone(hit),
    description: `${hit.summary}\n\nFixture description for browser mode.`,
    gameVersions: ["1.21.4", "1.21.1"],
    loaders: ["fabric", "quilt"],
    gallery: [],
    sourceUrl: `https://github.com/example/${hit.slug}`,
    clientSide: hit.clientSide ?? "unknown",
    serverSide: hit.serverSide ?? "unknown",
  }
}

export function mockCatalogVersions(projectId: string): ModFile[] {
  const hit = catalogHits.find((h) => h.projectId === projectId)
  if (!hit) return []
  // Sodium depends on Fabric API here so the dependency walk has something to
  // walk in browser mode.
  const dependencies =
    projectId === "AANobbMI"
      ? [{ platform: "modrinth" as const, projectId: "P7dR8mSH", relation: "required" as const }]
      : []
  return [
    {
      platform: "modrinth",
      fileId: `${projectId}-v1`,
      versionNumber: "1.0.0",
      displayName: `${hit.name} 1.0.0`,
      fileName: `${hit.slug}-1.0.0.jar`,
      fileSize: 512 * 1024,
      gameVersions: ["1.21.4"],
      releaseType: "release",
      datePublished: "2026-06-01T10:00:00Z",
      sha512: "a".repeat(128),
      downloadable: true,
      loaders: ["fabric"],
      dependencies,
    },
  ]
}

export function mockCatalogResolve(source: ResolveSource): ResolvedFile | null {
  if (source.kind === "curseforge") return null
  const fileName =
    source.kind === "url"
      ? (source.url.split("?")[0].split("/").filter(Boolean).pop() ?? "file.jar")
      : `${source.versionId}.jar`
  return { sha512: "a".repeat(128), fileSize: 512 * 1024, fileName, source }
}

// ── Instance content / files / worlds ──────────────────────────────────────
// Browser mode has no instance on disk, so these stand in for one that is
// installed, has a disabled mod, and has been played.

export function mockContent(): ContentFile[] {
  return [
    {
      path: "mods/fabric-api-0.115.0.jar",
      size: 2_100_000,
      isMod: true,
      optional: false,
      enabled: true,
      installed: true,
      source: { kind: "modrinth", versionId: "P7dR8mSH-v1" },
    },
    {
      path: "mods/sodium-0.6.0.jar",
      size: 1_400_000,
      isMod: true,
      optional: true,
      // Disabled on purpose: the toggle's "off" rendering is otherwise never
      // exercised in browser mode.
      enabled: false,
      installed: true,
      source: { kind: "modrinth", versionId: "AANobbMI-v1" },
    },
    {
      path: "config/sodium-options.json",
      size: 4_200,
      isMod: false,
      optional: false,
      enabled: true,
      installed: true,
      source: { kind: "override", sha512: "b".repeat(128) },
    },
    {
      path: "mods/legacy-tweaks.jar",
      size: 380_000,
      isMod: true,
      optional: false,
      enabled: true,
      installed: false,
      source: { kind: "url", url: "https://example.com/legacy-tweaks.jar" },
    },
  ]
}

export function mockDirEntries(rel: string): DirEntry[] {
  if (rel === "") {
    return [
      { path: "config", name: "config", isDir: true, size: 0, modified: 1_760_000_000_000 },
      { path: "mods", name: "mods", isDir: true, size: 0, modified: 1_760_000_000_000 },
      { path: "saves", name: "saves", isDir: true, size: 0, modified: 1_762_000_000_000 },
      { path: "options.txt", name: "options.txt", isDir: false, size: 3_400, modified: 1_761_000_000_000 },
    ]
  }
  if (rel === "mods") {
    return [
      { path: "mods/fabric-api-0.115.0.jar", name: "fabric-api-0.115.0.jar", isDir: false, size: 2_100_000, modified: 1_760_000_000_000 },
      { path: "mods/sodium-0.6.0.jar.disabled", name: "sodium-0.6.0.jar.disabled", isDir: false, size: 1_400_000, modified: 1_760_000_000_000 },
    ]
  }
  return []
}

export function mockWorlds(): World[] {
  return [
    {
      folder: "Nuevo-mundo",
      name: "Nuevo mundo",
      lastPlayed: 1_762_000_000_000,
      sizeBytes: 184_000_000,
      gameMode: "survival",
      hardcore: false,
      version: "1.21.4",
      hasIcon: false,
    },
    {
      folder: "creativo",
      name: "Pruebas creativo",
      lastPlayed: 0,
      sizeBytes: 12_000_000,
      gameMode: "creative",
      hardcore: false,
      version: "1.21.4",
      hasIcon: false,
    },
  ]
}
