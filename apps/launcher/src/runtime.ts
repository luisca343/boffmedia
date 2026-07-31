import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { getCurrentWindow } from "@tauri-apps/api/window"

import { MOCK_SETTINGS, mockLogs } from "./services/mock"
import type {
  GameState,
  InstallPhase,
  InstallState,
  LogLine,
  Settings,
} from "./services/types"

// The single boundary between the renderer and the Rust shell. Keeping it in
// one module means the six screens never import @tauri-apps directly, so they
// stay runnable in a plain browser — which is where most UI work happens, since
// the desktop build needs a Windows machine or WSLg.

export type RuntimeInfo = {
  platform: string
  arch: string
  tauri: string
  appVersion: string
}

/** True when running inside the Tauri shell rather than a browser tab. */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

export async function getRuntimeInfo(): Promise<RuntimeInfo | null> {
  if (!isDesktop()) return null
  try {
    const info = await invoke<{
      platform: string
      arch: string
      tauri: string
      app_version: string
    }>("runtime_info")
    return {
      platform: info.platform,
      arch: info.arch,
      tauri: info.tauri,
      appVersion: info.app_version,
    }
  } catch {
    // Never let a shell failure blank the UI — browser mode is a valid state.
    return null
  }
}

// ── Auth (HANDOFF §5) ──────────────────────────────────────────────────────
// The Rust side owns every token. What crosses this boundary is a code to show
// the user and, afterwards, a uuid + username — never an access or refresh
// token.

export type DeviceCode = {
  userCode: string
  verificationUri: string
  expiresIn: number
}

export type Account = {
  uuid: string
  username: string
}

/** Rust serialises with serde's snake_case field names. */
type RawDeviceCode = {
  user_code: string
  verification_uri: string
  expires_in: number
}

export type AuthFailure = { message: string; needsSignin: boolean }

function asFailure(err: unknown): AuthFailure {
  // Tauri rejects with the serialised AuthFailure; anything else is a bug in
  // the bridge rather than something the player can act on.
  const e = err as { message?: string; needs_signin?: boolean }
  return {
    message: e?.message ?? "Error inesperado al iniciar sesión.",
    needsSignin: e?.needs_signin ?? true,
  }
}

/** Step 1 — the code the user types at microsoft.com/link. */
export async function authBegin(): Promise<DeviceCode> {
  const raw = await invoke<RawDeviceCode>("auth_begin")
  return {
    userCode: raw.user_code,
    verificationUri: raw.verification_uri,
    expiresIn: raw.expires_in,
  }
}

/** Step 2 — resolves only once the user finishes in the browser. Long-running:
 *  the device code stays valid for about fifteen minutes. */
export async function authAwait(): Promise<Account> {
  try {
    return await invoke<Account>("auth_await")
  } catch (err) {
    throw asFailure(err)
  }
}

/** Silent sign-in from the stored refresh token. `null` = no stored session.
 *  A THROW means the credential store itself failed, which §5.7 insists must
 *  not be mistaken for a first run. */
export async function authRestore(): Promise<Account | null> {
  if (!isDesktop()) return null
  try {
    return await invoke<Account | null>("auth_restore")
  } catch (err) {
    throw asFailure(err)
  }
}

export async function authLogout(): Promise<void> {
  if (!isDesktop()) return
  await invoke("auth_logout")
}

/** Open Microsoft's page in the SYSTEM browser, with the code pre-filled.
 *  Never navigate the launcher window there: an embedded Microsoft login is
 *  precisely what the device-code flow exists to avoid. */
export async function authOpenVerification(fallbackUrl: string): Promise<void> {
  if (!isDesktop()) {
    window.open(fallbackUrl, "_blank", "noopener,noreferrer")
    return
  }
  try {
    await invoke("auth_open_verification")
  } catch (err) {
    throw asFailure(err)
  }
}

/** Copy text, working in the Tauri webview and in a plain browser tab.
 *  Returns false rather than throwing so the UI can just say "copy failed"
 *  next to a code the user can still select by hand. */
export async function copyText(text: string): Promise<boolean> {
  try {
    // Requires a secure context; tauri://localhost qualifies, but a plain
    // http:// dev server on a LAN address does not — hence the fallback.
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement("textarea")
      el.value = text
      el.setAttribute("readonly", "")
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}

// ── Pack registry (HANDOFF §7) ─────────────────────────────────────────────
// The HTTP lives in Rust: minting a pack session needs the Minecraft access
// token for Mojang's join handshake, and that token never crosses this
// boundary. What comes back is already access-filtered by the server.

export type LauncherVersion = {
  id: string
  name: string
  minecraft: string
  loader: string | null
  loaderVersion: string | null
  fileCount: number
  createdAt: string
}

export type LauncherPack = {
  id: string
  slug: string
  name: string
  summary: string | null
  iconUrl: string | null
  accessKind: "public" | "password" | "allowlist"
  latestVersion: LauncherVersion | null
}

/** Every pack this UUID may install. Throws an {@link AuthFailure}.
 *  `LauncherPack`/`LauncherVersion` carry `#[serde(rename_all = "camelCase")]`
 *  on the Rust side, so the payload is already in this shape — mapping it from
 *  snake_case silently produced a library of packs with no version. */
export async function packsList(): Promise<LauncherPack[]> {
  try {
    return await invoke<LauncherPack[]>("packs_list")
  } catch (err) {
    throw asFailure(err)
  }
}

/** ISO timestamps of the last launch, keyed by pack id. Never throws: a
 *  missing play history is cosmetic. */
export async function playsGet(): Promise<Record<string, string>> {
  try {
    return await invoke<Record<string, string>>("plays_get")
  } catch {
    return {}
  }
}

/** The manifest to install from — already validated against the generated
 *  schema types on the Rust side, so this is the exact shape §6 will read. */
export async function packManifest(
  packId: string,
  password?: string,
): Promise<unknown> {
  try {
    return await invoke<unknown>("pack_manifest", {
      packId,
      password: password ?? null,
    })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Redeem an invite code (§7.3); resolves to the pack id it unlocked. */
export async function inviteRedeem(code: string): Promise<string> {
  try {
    return await invoke<string>("invite_redeem", { code })
  } catch (err) {
    throw asFailure(err)
  }
}

// ── Install / launch (HANDOFF §6) ──────────────────────────────────────────
// Progress and game output arrive as Tauri events, never as return values: an
// install is minutes long and the renderer must paint while it runs.
//
// In a browser there is no Rust side, so the same event names are served by a
// tiny in-process bus that the mock install and launch below publish to. The
// reducer therefore has ONE code path, and `dev:renderer` keeps a moving
// progress bar and a live log.

export const EVENT_INSTALL_PROGRESS = "install://progress"
export const EVENT_INSTALL_DONE = "install://done"
export const EVENT_GAME_LOG = "game://log"
export const EVENT_GAME_STATE = "game://state"

export type InstallProgressEvent = {
  packId: string
  phase: InstallPhase
  fraction: number
  file: string
  downloadedBytes: number
  totalBytes: number
}

export type InstallDoneEvent = { packId: string }

/** Everything `instance_scan` and `install_pack` can report. `installing` is
 *  absent by design: only the renderer, which holds the progress events, can
 *  know a pack is mid-install. */
export type ScannedInstallState = Exclude<InstallState, { kind: "installing" }>

export type Unsubscribe = () => void

type Handler = (payload: never) => void

const bus = new Map<string, Set<Handler>>()

function busEmit<T>(event: string, payload: T): void {
  for (const fn of bus.get(event) ?? []) (fn as (p: T) => void)(payload)
}

/** Subscribe to a shell event. The returned function is safe to call twice and
 *  safe to call before the underlying `listen` has resolved — which is exactly
 *  what React StrictMode does on every mount in dev. */
function subscribe<T>(event: string, handler: (payload: T) => void): Unsubscribe {
  if (!isDesktop()) {
    const set = bus.get(event) ?? new Set<Handler>()
    bus.set(event, set)
    set.add(handler as Handler)
    return () => {
      set.delete(handler as Handler)
    }
  }

  let stop: Unsubscribe | null = null
  let cancelled = false
  void listen<T>(event, (e) => {
    if (!cancelled) handler(e.payload)
  })
    .then((unlisten) => {
      if (cancelled) unlisten()
      else stop = unlisten
    })
    .catch(() => {
      /* no shell, no events — browser mode is a valid state */
    })

  return () => {
    cancelled = true
    stop?.()
    stop = null
  }
}

export const onInstallProgress = (fn: (e: InstallProgressEvent) => void) =>
  subscribe<InstallProgressEvent>(EVENT_INSTALL_PROGRESS, fn)
export const onInstallDone = (fn: (e: InstallDoneEvent) => void) =>
  subscribe<InstallDoneEvent>(EVENT_INSTALL_DONE, fn)
export const onGameLog = (fn: (line: LogLine) => void) =>
  subscribe<LogLine>(EVENT_GAME_LOG, fn)
export const onGameState = (fn: (state: GameState) => void) =>
  subscribe<GameState>(EVENT_GAME_STATE, fn)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const MOCK_PHASES: InstallPhase[] = [
  "resolving",
  "java",
  "libraries",
  "assets",
  "loader",
  "mods",
  "overrides",
  "verifying",
]

async function mockInstall(packId: string): Promise<ScannedInstallState> {
  const total = 1_284_000_000
  for (const [i, phase] of MOCK_PHASES.entries()) {
    for (let step = 0; step < 4; step++) {
      const fraction = (i * 4 + step + 1) / (MOCK_PHASES.length * 4)
      busEmit<InstallProgressEvent>(EVENT_INSTALL_PROGRESS, {
        packId,
        phase,
        fraction,
        file: `${phase}/archivo-${step + 1}`,
        downloadedBytes: Math.round(fraction * total),
        totalBytes: total,
      })
      await sleep(110)
    }
  }
  busEmit<InstallDoneEvent>(EVENT_INSTALL_DONE, { packId })
  return { kind: "installed", versionId: "mock", sizeBytes: total }
}

/** Install or update a pack. `manifest` is what {@link packManifest} returned;
 *  `packId` is only used to address the browser-mode simulation. */
export async function installPack(
  packId: string,
  manifest: unknown,
): Promise<ScannedInstallState> {
  if (!isDesktop()) return mockInstall(packId)
  try {
    return await invoke<ScannedInstallState>("install_pack", { manifest })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Verify, then spawn. Resolves to the OS pid; `game://state` carries the rest,
 *  including the crash exit code the pid alone cannot tell you about. */
export async function launchPack(packId: string, manifest: unknown): Promise<number> {
  if (!isDesktop()) {
    busEmit<GameState>(EVENT_GAME_STATE, { kind: "preparing" })
    await sleep(600)
    await mockInstall(packId)
    busEmit<GameState>(EVENT_GAME_STATE, { kind: "running", pid: 4821, since: Date.now() })
    for (const line of mockLogs()) busEmit<LogLine>(EVENT_GAME_LOG, line)
    return 4821
  }
  try {
    return await invoke<number>("launch_pack", { manifest })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Idempotent: stopping a pack that already exited is the normal race. */
export async function stopGame(packId: string): Promise<void> {
  if (!isDesktop()) {
    busEmit<GameState>(EVENT_GAME_STATE, { kind: "idle" })
    return
  }
  try {
    await invoke("stop_game", { packId })
  } catch (err) {
    throw asFailure(err)
  }
}

/** What is on disk for one pack. `latestVersionId` is what turns `installed`
 *  into `outdated`, so omitting it can never offer an update to nothing. */
export async function instanceScan(
  slug: string,
  latestVersionId: string | null,
): Promise<ScannedInstallState> {
  if (!isDesktop()) return { kind: "not-installed" }
  try {
    return await invoke<ScannedInstallState>("instance_scan", {
      slug,
      latestVersionId,
    })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Drop the managed files (mods, config, bin, marker) so the next install
 *  rebuilds them. Saves and options are left alone by the Rust side. */
export async function repairInstance(slug: string): Promise<ScannedInstallState> {
  if (!isDesktop()) return { kind: "not-installed" }
  try {
    return await invoke<ScannedInstallState>("repair_instance", { slug })
  } catch (err) {
    throw asFailure(err)
  }
}

// ── Settings ───────────────────────────────────────────────────────────────

export async function settingsGet(): Promise<Settings> {
  if (!isDesktop()) return MOCK_SETTINGS
  try {
    return await invoke<Settings>("settings_get")
  } catch (err) {
    throw asFailure(err)
  }
}

export async function settingsSet(settings: Settings): Promise<Settings> {
  if (!isDesktop()) return settings
  try {
    return await invoke<Settings>("settings_set", { settings })
  } catch (err) {
    throw asFailure(err)
  }
}

/** The window is created hidden so the user never sees an unstyled white
 *  flash; this reveals it once React has painted. No-op in a browser. */
export async function revealWindow(): Promise<void> {
  if (!isDesktop()) return
  try {
    await getCurrentWindow().show()
  } catch {
    /* a visible window is not worth crashing over */
  }
}
