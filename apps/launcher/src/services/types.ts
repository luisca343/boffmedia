// The launcher's own view models. Deliberately separate from the wire types in
// @boffmedia/pack-schema: a Pack is what the server publishes, an InstalledPack
// is what this machine knows about it, and conflating the two is how launchers
// end up unable to tell "not installed" from "server unreachable".

import type { AppLocale } from "@boffmedia/ui"

export type PackAccessKind = "public" | "password" | "allowlist"

export type GameType = "minecraft" | "emulator" | "zomboid" | "stardew"

/** A promotional gallery image attached to a pack (shown pre-install). For a
 *  managed pack these are public URLs from the registry; for a local pack the
 *  gallery lives on disk (a convention dir), so this stays empty and the
 *  GalleryTab reads the files directly. */
export type PackGalleryImage = {
  url: string
  alt?: string | null
}

/** What the LISTING (§7.2) knows about a pack. Note what is absent: the
 *  allowlist UUIDs are never sent to any launcher, since one member could
 *  otherwise enumerate the whole membership of a pack they can read. */
export type PackSummary = {
  id: string
  slug: string
  name: string
  summary: string | null
  /** Long-form plain-text description shown on the Info panel. */
  description: string | null
  iconUrl: string | null
  /** Managed-pack gallery URLs. Empty for local packs (their gallery is on
   *  disk); the GalleryTab branches on `origin`. */
  gallery: PackGalleryImage[]
  accessKind: PackAccessKind
  /** The type of game this pack targets. Always present — the API resolves it. */
  gameType: GameType
}

/** The listing's view of a version. The file list lives only in a MANIFEST,
 *  which is fetched per-install — never for a list of packs. */
export type PackVersionSummary = {
  id: string
  name: string
  minecraft: string | null
  /** "neoforge" | "forge" | "fabric-loader", or null for vanilla. */
  loader: string | null
  loaderVersion: string | null
  /** For emulator packs: "mgba" | "melonds". For others: null. */
  emulatorKind?: "mgba" | "melonds" | null
  fileCount: number
  createdAt: string
}

/** A file the pack requires the user to provide (e.g., a ROM). */
export type MissingUserFile = {
  path: string
  hint: string
  fileSize: number
}

/** Result of successfully providing a user file. */
export type ProvideFileResult = {
  satisfied: true
}

/** Error when providing a user file. */
export type ProvideFileError = {
  code: "wrong_hash" | "io" | "not_found" | string
  expectedHint?: string
  message: string
}

/** Where an emulator was found and how it was resolved. */
export type EmulatorSource = "override" | "emudeck" | "system" | "path"

/** The resolved status of an emulator (mGBA or melonDS). */
export type EmulatorStatus = {
  /** The emulator was found at this path. */
  resolved?: {
    path: string
    source: EmulatorSource
  }
  /** An override path was set but is no longer valid. Falls through to detection. */
  staleOverride?: string
}

/** Result of scanning for user-provided ROM files. */
export type RomScanResult = {
  satisfied: string[]
  stillMissing: string[]
}

/** Where a pack stands on THIS machine. */
export type InstallState =
  | { kind: "not-installed" }
  | { kind: "installed"; versionId: string; sizeBytes: number; missingUserFiles?: MissingUserFile[] }
  /** Installed, but the server has a newer version. */
  | { kind: "outdated"; versionId: string; latestVersionId: string; sizeBytes: number; missingUserFiles?: MissingUserFile[] }
  | { kind: "installing"; progress: InstallProgress }
  | { kind: "broken"; reason: string }

export type InstallPhase =
  | "resolving"
  | "java"
  | "libraries"
  | "assets"
  | "loader"
  | "mods"
  | "overrides"
  | "verifying"

export type InstallProgress = {
  phase: InstallPhase
  /** 0–1 overall, not per-phase — the UI shows one bar, not eight. */
  fraction: number
  currentFile: string
  downloadedBytes: number
  totalBytes: number
}

export type PackEntry = {
  pack: PackSummary
  /** Null when the pack exists but has no PUBLISHED version — a real state on
   *  a freshly created pack, and one the UI must not render as "installable". */
  latest: PackVersionSummary | null
  state: InstallState
  /** Null until the pack has been launched at least once. */
  lastPlayed: string | null
  /** Total time played, in milliseconds, accumulated across every session.
   *  0 (or absent) until the pack has been launched. */
  playMs?: number
  /** RF-10: "managed" comes from the Boffmedia registry and is read-only in
   *  this launcher; "local" was created/imported on this machine and can be
   *  edited or exported. */
  origin: "managed" | "local"
  /** RF-01/RF-02: present only when the pack declares one — its absence is what
   *  keeps a pack without a server looking exactly as it did before this
   *  feature. `port` is absent for a bare SRV host (the status ping resolves it
   *  via SRV); `host` can be absent on a legacy `{}` row, which still counts as
   *  a server pack but renders as "unavailable". */
  server?: { host?: string | null; port?: number | null }
}

// ── Server List Ping (RF-03/RF-04) ──────────────────────────────────────────
// Mirrors Rust's `status::ServerStatus`, camelCase on the wire.

export type ServerPlayers = {
  online: number
  max: number
}

export type ServerStatus = {
  online: boolean
  players: ServerPlayers | null
  motd: string | null
  latencyMs: number | null
}

export type Account = {
  uuid: string
  username: string
  /** The player's ACTIVE skin sheet on textures.minecraft.net — the whole 64×64
   *  PNG, not a head render. `<PlayerHead>` crops the head out of it in CSS.
   *  Empty when the account has never set a skin. */
  skinUrl: string
}

/** HANDOFF §5.1 — the device-code flow the user completes in a browser. */
export type DeviceCode = {
  userCode: string
  verificationUri: string
  expiresInSeconds: number
}

/** HANDOFF §9 — what the Rust classifier (`install/crash.rs`) recognised in the
 *  tail of the game log. Mirrors `CrashKind`; kebab-case on the wire. */
export type CrashKind =
  | "missing-dependency"
  | "loader-mismatch"
  | "mixin-failure"
  | "out-of-memory"
  | "wrong-java"
  | "corrupt-mod-jar"
  | "duplicate-mod"

export type CrashDiagnosis = {
  id: string
  kind: CrashKind
  title: string
  explanation: string
  action: string
  /** The verbatim log lines that produced the verdict. Always rendered: a
   *  diagnosis with no evidence is unfalsifiable and unescalatable. */
  evidence: string[]
}

export type GameState =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "running"; pid: number; since: number }
  /** `diagnosis` is null when the crash matched no known signature — the UI
   *  must then say so rather than guess. */
  | { kind: "crashed"; exitCode: number; diagnosis: CrashDiagnosis | null }

export type LogLine = {
  ts: number
  level: "info" | "warn" | "error" | "debug"
  source: "launcher" | "game"
  text: string
}

export type Settings = {
  /** MiB. Handoff §6.3: wrong Java is the #1 support ticket, so surface it. */
  memoryMib: number
  javaPath: string | null
  gameDir: string
  closeOnLaunch: boolean
  keepLogs: boolean
  /** HANDOFF §9 — how many previous versions stay one-click revertible.
   *  Cheap: a retained version is one marker, never a copy of the instance. */
  retainVersions: number
  /** HANDOFF §9 — when on, `memoryMib` is ignored and the heap is sized from
   *  the pack's mod count and this machine's RAM. A separate flag rather than a
   *  sentinel in `memoryMib`, so turning it off restores the chosen number. */
  memoryAuto: boolean
  /** UI language. Persisted so the choice survives a relaunch; applied on boot
   *  through the i18n store. Absent in a settings.json from before i18n, which
   *  the Rust `#[serde(default)]` fills with "es". */
  locale: AppLocale
  /** Whether to automatically backup saves/config before updating a pack. */
  backupBeforeUpdate: boolean
}

/** Total playtime in milliseconds per pack, keyed by pack id. */
export type Playtime = Record<string, number>

/** HANDOFF §9 — why a resolved value is what it is. Mirrors Rust's
 *  `install::runtime::RuntimeSource`. */
export type RuntimeSource = "global" | "override" | "auto"

/** This pack's heap choice. Three states, not two: "heredar" and "automático"
 *  are different intents, and a null could only express one of them. */
export type MemoryChoice =
  | { mode: "inherit" }
  | { mode: "auto" }
  | { mode: "fixed"; mib: number }

/** This pack's Java choice. `auto` is NOT `inherit`: it means "ignore the
 *  global path for this pack", which is the fix for a Java 8 path kept for one
 *  old pack breaking every new one. */
export type JavaChoice =
  | { mode: "inherit" }
  | { mode: "auto" }
  | { mode: "custom"; path: string }

/** What a launch would actually use, plus what fed the heuristic. */
export type ResolvedRuntime = {
  heapMib: number
  memorySource: RuntimeSource
  /** Null = the launcher installs and manages the JVM (§6.3). */
  javaPath: string | null
  javaSource: RuntimeSource
  modCount: number
  totalRamMib: number
  /** What the heuristic would pick even when an explicit value won. */
  recommendedMib: number
}

/** HANDOFF §9 — the per-pack runtime panel's whole state. Mirrors Rust's
 *  `install::InstanceRuntime`. */
export type InstanceRuntime = {
  over: { memory: MemoryChoice; java: JavaChoice }
  effective: ResolvedRuntime
  globalMemoryMib: number
  globalMemoryAuto: boolean
  globalJavaPath: string | null
}

/** HANDOFF §9 — a version this machine can roll back to. Mirrors Rust's
 *  `instance::RetainedVersion`. */
export type RetainedVersion = {
  versionId: string
  versionName: string
  minecraft: string
  loader: string | null
  loaderVersion: string | null
  installedAt: string
  fileCount: number
  /** The version currently on disk; never offered as a revert target. */
  current: boolean
  /** False for a version installed before the launcher recorded file lists —
   *  there is nothing to replay, so the UI must not offer the button. */
  revertible: boolean
}

/** HANDOFF §9 — one `env.client: "optional"` file and whether it is switched
 *  on. Optional-ness comes from the manifest, so this is empty until the pack
 *  has been installed once. */
export type OptionalFile = {
  path: string
  name: string
  size: number
  enabled: boolean
}

// ── Version metadata (local pack pickers) ──────────────────────────────────

/** One entry of Mojang's version manifest. `latest` marks Mojang's own latest
 *  release AND latest snapshot, so at most two entries carry it. */
export type GameVersion = {
  id: string
  type: "release" | "snapshot" | "old_beta" | "old_alpha"
  releaseTime: string
  latest: boolean
}

/** One build of a modloader for a given Minecraft version, newest first.
 *  `recommended` is the one the picker should preselect. */
export type LoaderVersion = {
  version: string
  stable: boolean
  latest: boolean
  recommended: boolean
}
