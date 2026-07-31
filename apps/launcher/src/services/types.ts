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

export type GameState =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "running"; pid: number; since: number }
  | { kind: "crashed"; exitCode: number }

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
}
