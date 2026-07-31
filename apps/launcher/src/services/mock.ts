import type {
  Account,
  CrashDiagnosis,
  DeviceCode,
  LogLine,
  PackEntry,
  PackSummary,
  PackVersionSummary,
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

const PACKS: { pack: PackSummary; latest: PackVersionSummary }[] = [
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
