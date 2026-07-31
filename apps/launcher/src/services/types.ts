// The launcher's own view models. Deliberately separate from the wire types in
// @boffmedia/pack-schema: a Pack is what the server publishes, an InstalledPack
// is what this machine knows about it, and conflating the two is how launchers
// end up unable to tell "not installed" from "server unreachable".

export type PackAccessKind = "public" | "password" | "allowlist"

/** What the LISTING (§7.2) knows about a pack. Note what is absent: the
 *  allowlist UUIDs are never sent to any launcher, since one member could
 *  otherwise enumerate the whole membership of a pack they can read. */
export type PackSummary = {
  id: string
  slug: string
  name: string
  summary: string | null
  iconUrl: string | null
  accessKind: PackAccessKind
}

/** The listing's view of a version. The file list lives only in a MANIFEST,
 *  which is fetched per-install — never for a list of packs. */
export type PackVersionSummary = {
  id: string
  name: string
  minecraft: string
  /** "neoforge" | "forge" | "fabric-loader", or null for vanilla. */
  loader: string | null
  loaderVersion: string | null
  fileCount: number
  createdAt: string
}

/** Where a pack stands on THIS machine. */
export type InstallState =
  | { kind: "not-installed" }
  | { kind: "installed"; versionId: string; sizeBytes: number }
  /** Installed, but the server has a newer version. */
  | { kind: "outdated"; versionId: string; latestVersionId: string; sizeBytes: number }
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
}

export type Account = {
  uuid: string
  username: string
  /** Mojang skin head, 8×8 scaled — rendered from the UUID. */
  avatarUrl: string
  /** Only ever a display hint; the token itself lives in the OS keychain. */
  expiresAt: string
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
}

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
