import type { Pack, PackVersion } from "@boffmedia/pack-schema"

import type { Account, DeviceCode, LogLine, PackEntry, Settings } from "./types"

// Stand-in data so every screen is real and demoable before the Rust side
// exists. Each function here maps to a Tauri command that portablemc will back
// — see the TODO on each. Keeping them in one module means the swap is
// mechanical and the screens never change.

const sha = (c: string) => c.repeat(128)

function version(id: string, name: string, createdAt: string, files: number): PackVersion {
  return {
    id,
    name,
    createdAt,
    dependencies: { minecraft: "1.21.4", neoforge: "21.4.30" },
    files: Array.from({ length: files }, (_, i) => ({
      path: `mods/mod-${i}.jar`,
      sha512: sha(String.fromCharCode(97 + (i % 26))),
      fileSize: 1_200_000 + i * 40_000,
      env: { client: "required" as const, server: "required" as const },
      source: { kind: "modrinth" as const, projectId: `proj${i}`, versionId: `ver${i}` },
    })),
  }
}

const PACKS: { pack: Pack; latest: PackVersion }[] = [
  {
    pack: {
      id: "pk_smp",
      slug: "boff-smp",
      name: "Boff SMP",
      summary: "El pack principal del servidor. Pixelmon, LittleTiles y utilidades.",
      access: { kind: "allowlist", uuids: ["069a79f4-44e9-4726-a5be-fca90e38aaf5"] },
      latestVersionId: "v_smp_5",
    },
    latest: version("v_smp_5", "1.4.2", "2026-07-28T18:04:00Z", 84),
  },
  {
    pack: {
      id: "pk_creative",
      slug: "boff-creativo",
      name: "Boff Creativo",
      summary: "Construcción: WorldEdit, LittleTiles y esquemas compartidos.",
      access: { kind: "password" },
      latestVersionId: "v_cre_2",
    },
    latest: version("v_cre_2", "0.9.0", "2026-07-11T09:30:00Z", 31),
  },
  {
    pack: {
      id: "pk_eventos",
      slug: "boff-eventos",
      name: "Eventos",
      summary: "Pack ligero para torneos y minijuegos puntuales.",
      access: { kind: "public" },
      latestVersionId: "v_evt_1",
    },
    latest: version("v_evt_1", "2026.7", "2026-07-02T20:00:00Z", 12),
  },
]

export const MOCK_ACCOUNT: Account = {
  uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  username: "Luisca",
  avatarUrl: "",
  expiresAt: "2026-07-31T16:00:00Z",
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
}

/** TODO(rust): `list_packs` — GET the registry (§7), reconcile against the
 *  instances on disk. Access filtering is the SERVER's job; a pack the user
 *  cannot see must never reach this list. */
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
    },
    {
      ...PACKS[1],
      state: { kind: "installed", versionId: "v_cre_2", sizeBytes: 612_000_000 },
      lastPlayed: "2026-07-20T17:45:00Z",
    },
    { ...PACKS[2], state: { kind: "not-installed" }, lastPlayed: null },
  ]
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

/** TODO(rust): stream real lines over a Tauri event channel; the game writes to
 *  stdout continuously and buffering it all in the renderer would leak. */
export function mockLogs(): LogLine[] {
  const base = Date.now() - LOG_SEED.length * 1400
  return LOG_SEED.map(([level, source, text], i) => ({
    ts: base + i * 1400,
    level,
    source,
    text,
  }))
}
