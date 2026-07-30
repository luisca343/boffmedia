import type { Pack, PackVersion } from "@boffmedia/pack-schema"

// The launcher's own view models. Deliberately separate from the wire types in
// @boffmedia/pack-schema: a Pack is what the server publishes, an InstalledPack
// is what this machine knows about it, and conflating the two is how launchers
// end up unable to tell "not installed" from "server unreachable".

export type { Pack, PackVersion }

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
  pack: Pack
  latest: PackVersion
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
