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

/** What the LISTING knows about a pack. Note what is absent: the
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
  /** How many things the player can switch on or off. Zero for a pack that
   *  installs everything it has, which is most of them. */
  optionalFeatureCount?: number
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

/** How an emulator was invoked. */
export type EmulatorVia = "standalone" | "retroarch"

/** The resolved status of an emulator (mGBA or melonDS). */
export type EmulatorStatus = {
  /** The emulator was found at this path. */
  resolved?: {
    path: string
    source: EmulatorSource
    via: EmulatorVia
    core?: string
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
  | { kind: "installed"; versionId: string; sizeBytes: number; missingUserFiles?: MissingUserFile[]; randomizerBlocked?: boolean }
  /** Installed, but the server has a newer version. */
  | { kind: "outdated"; versionId: string; latestVersionId: string; sizeBytes: number; missingUserFiles?: MissingUserFile[]; randomizerBlocked?: boolean }
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
  /** Present only when the pack declares one; its absence is what keeps a pack
   *  without a server rendering as an ordinary pack. `port` is absent for a bare
   *  SRV host (the status ping resolves it via SRV); `host` can be absent on a
   *  `{}` row, which still counts as a server pack but renders as
   *  "unavailable". */
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

/** The device-code flow the user completes in a browser. */
export type DeviceCode = {
  userCode: string
  verificationUri: string
  expiresInSeconds: number
}

/** What the Rust classifier (`install/crash.rs`) recognised in the
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
  source: "app" | "game"
  text: string
}

export type Settings = {
  /** MiB. Wrong Java is the #1 support ticket, so surface it. */
  memoryMib: number
  javaPath: string | null
  gameDir: string
  closeOnLaunch: boolean
  keepLogs: boolean
  /** How many previous versions stay one-click revertible.
   *  Cheap: a retained version is one marker, never a copy of the instance. */
  retainVersions: number
  /** When on, `memoryMib` is ignored and the heap is sized from
   *  the pack's mod count and this machine's RAM. A separate flag rather than a
   *  sentinel in `memoryMib`, so turning it off restores the chosen number. */
  memoryAuto: boolean
  /** UI language. Persisted so the choice survives a relaunch; applied on boot
   *  through the i18n store. Absent in a settings.json from before i18n, which
   *  the Rust `#[serde(default)]` fills with "es". */
  locale: AppLocale
  /** Pack-grid layout. A view preference; persisted with the rest so it survives relaunch. */
  packLayout: "card" | "compact" | "row"
  /** Whether to automatically backup saves/config before updating a pack. */
  backupBeforeUpdate: boolean
  /** Webview zoom factor. Applied through the webview's own `setZoom`, not
   *  through CSS: every size in the UI is a hardcoded px value in a Tailwind
   *  arbitrary class, which no root font-size can move. */
  uiScale: UiScale
}

/** The offered zoom steps. A closed set rather than a free number so every value
 *  is one a layout was actually looked at, and so the control can be a segmented
 *  picker instead of a slider landing text on half-pixels. */
export const UI_SCALES = [0.9, 1, 1.1, 1.25] as const
export type UiScale = (typeof UI_SCALES)[number]

/** Total playtime in milliseconds per pack, keyed by pack id. */
export type Playtime = Record<string, number>

/** Why a resolved value is what it is. Mirrors Rust's
 *  `install::runtime::RuntimeSource`. */
export type RuntimeSource = "global" | "override" | "auto"

/** This pack's heap choice. Three states, not two: "heredar" and "automático"
 *  are different intents, and a null could only express one of them. */
export type MemoryChoice =
  | { mode: "inherit" }
  | { mode: "auto" }
  | { mode: "fixed"; mib: number }

/** This pack's Java choice. `auto` is NOT `inherit`: it means "ignore the
 *  global path for this pack", so a Java 8 path kept for one legacy pack does
 *  not break every other one. */
export type JavaChoice =
  | { mode: "inherit" }
  | { mode: "auto" }
  | { mode: "custom"; path: string }

/** What a launch would actually use, plus what fed the heuristic. */
export type ResolvedRuntime = {
  heapMib: number
  memorySource: RuntimeSource
  /** Null = the launcher installs and manages the JVM. */
  javaPath: string | null
  javaSource: RuntimeSource
  modCount: number
  totalRamMib: number
  /** What the heuristic would pick even when an explicit value won. */
  recommendedMib: number
}

/** The per-pack runtime panel's whole state. Mirrors Rust's
 *  `install::InstanceRuntime`. */
export type InstanceRuntime = {
  over: { memory: MemoryChoice; java: JavaChoice }
  effective: ResolvedRuntime
  globalMemoryMib: number
  globalMemoryAuto: boolean
  globalJavaPath: string | null
}

/** A version this machine can roll back to. Mirrors Rust's
 *  `instance::RetainedVersion`. */
export type RetainedVersion = {
  versionId: string
  versionName: string
  /** `null` for an emulator version — Rust's `minecraft` marker field is
   *  `Option<String>`, absent on non-Minecraft packs. */
  minecraft: string | null
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

/** One `env.client: "optional"` file and whether it is switched
 *  on. Optional-ness comes from the manifest, so this is empty until the pack
 *  has been installed once. */
export type OptionalFile = {
  path: string
  name: string
  size: number
  enabled: boolean
}

// ── Optional content ───────────────────────────────────────────────────────
//
// Re-exported rather than redeclared. The same shapes are rendered by the
// launcher's chooser, the web admin's editor and a pack's public page, so they
// live in `@boffmedia/ui` where all three can reach them — and a second copy
// here would be a second thing to keep in step with Rust's
// `install/optional.rs`, which is what actually serialises them.
export type {
  Activation,
  BreakReason,
  BrokenDep,
  DepEdge,
  ModGraph,
  ModJar,
  MissingRequires,
  OptionalFeature,
  OptionalGroup,
  OptionalSelect,
} from "@boffmedia/ui"

import type { OptionalGroup as OptionalGroupShape } from "@boffmedia/ui"

/** What one toggle did. A toggle is rarely one feature: group exclusivity and
 *  `requires` mean switching Shaders on can move three. Launcher-only — it
 *  describes a change to an INSTALLED instance, which is the one surface the
 *  web has no equivalent of. */
export type FeatureSetResult = {
  /** The whole model again, so the caller re-renders from one source of truth
   *  rather than patching the row it guessed at. */
  groups: OptionalGroupShape[]
  /** Feature ids whose effective state changed, including the one asked for. */
  changed: string[]
  /** Paths now wanted that are not on disk. Feed these to
   *  `instanceInstallFiles` to fetch them without a full install pass. */
  missing: string[]
  /** The choice is saved but its config edit waits for the next launch:
   *  Minecraft rewrites `options.txt` from memory when it exits, so anything
   *  written while it is open would vanish silently (D3). */
  deferred: boolean
}

// ── Publishing a local pack ────────────────────────────────────────────────

/** The preflight the publish screen renders, before anything leaves the machine.
 *
 *  Every field answers a question worth having in advance: is the pack valid at
 *  all, how many megabytes are ACTUALLY about to move (the server may already
 *  hold most of the blobs), and does this create a pack or add a version to one
 *  that already exists. */
export type PublishPlan = {
  slug: string
  packName: string
  versionName: string
  /** Empty when the manifest is valid. Each entry is one schema violation, in
   *  the words the shared schema itself produced — the same schema the API runs,
   *  so a clean preflight means the upload will not be refused for shape. */
  errors: string[]
  /** Non-fatal. A datapack shipped without a global loader is the current one. */
  warnings: string[]
  fileCount: number
  overrideCount: number
  /** The actual upload list: overrides the server does not have yet. */
  missingBlobs: string[]
  uploadBytes: number
  existingPackId: string | null
  hasIcon: boolean
  optionalFeatureCount: number
}

export type PublishResult = {
  packId: string
  versionId: string
  /** False means it landed as a draft — created, stored, and invisible to every
   *  launcher until someone publishes it. */
  published: boolean
  uploadedBlobs: number
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
