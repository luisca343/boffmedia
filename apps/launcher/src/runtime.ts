import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { getCurrentWindow } from "@tauri-apps/api/window"

import {
  MOCK_ACCOUNT,
  MOCK_CRASH_LOG,
  MOCK_DIAGNOSIS,
  MOCK_SETTINGS,
  mockCatalogCategories,
  mockContent,
  mockDirEntries,
  mockWorlds,
  mockCatalogProject,
  mockCatalogResolve,
  mockCatalogSearch,
  mockCatalogVersions,
  mockGameVersions,
  mockLoaderVersions,
  mockLocalPacks,
  mockLogs,
  mockServerStatus,
} from "./services/mock"
import type { PackManifest } from "@boffmedia/pack-schema"
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
  GameState,
  GameVersion,
  InstallPhase,
  InstallState,
  InstanceRuntime,
  JavaChoice,
  LoaderVersion,
  LogLine,
  MemoryChoice,
  OptionalFile,
  ResolvedRuntime,
  RetainedVersion,
  RuntimeSource,
  ServerStatus,
  Settings,
} from "./services/types"

export type {
  GameVersion,
  InstanceRuntime,
  JavaChoice,
  LoaderVersion,
  MemoryChoice,
  OptionalFile,
  PackManifest,
  ResolvedRuntime,
  RetainedVersion,
  RuntimeSource,
  ServerStatus,
}

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

// Re-exported rather than redeclared. Two separate definitions of "an account"
// had already drifted apart — this one lacked the skin the other required — and
// the only reason it type-checked was that every call site rebuilt the object
// by hand. There is one wire shape; this is it.
export type { Account }

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

/** Enter offline mode as the last active account. Only succeeds when that
 *  account really signed in on this machine before — the Rust side checks the
 *  credential store, see `auth_offline`. The session it returns can launch
 *  installed packs into singleplayer and nothing else. */
export async function authOffline(): Promise<Account> {
  if (!isDesktop()) return MOCK_ACCOUNT
  try {
    return await invoke<Account>("auth_offline")
  } catch (err) {
    throw asFailure(err)
  }
}

/** Signs out of EVERY account and forgets them. Per-account sign-out is
 *  `authRemove`. */
export async function authLogout(): Promise<void> {
  if (!isDesktop()) return
  await invoke("auth_logout")
}

/** A row in the account switcher. Only the `active` one has a live session
 *  behind it; the rest are names the launcher can resolve on demand. */
export type AccountEntry = Account & { active: boolean }

/** Offline and cheap — reads the roster, never the network. */
export async function authAccounts(): Promise<AccountEntry[]> {
  if (!isDesktop()) return []
  try {
    return await invoke<AccountEntry[]>("auth_accounts")
  } catch {
    // The switcher degrades to "just the account you are signed in as" rather
    // than blocking the whole shell on a roster it could not read.
    return []
  }
}

/** Make a known account active. Runs the full refresh chain, so it is as slow
 *  as a silent sign-in — the caller should show progress. */
export async function authSwitch(uuid: string): Promise<Account> {
  if (!isDesktop()) throw asFailure({ message: "Cambiar de cuenta solo funciona en la aplicación de escritorio." })
  try {
    return await invoke<Account>("auth_switch", { uuid })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Forget one account. Resolves to whoever is active afterwards, or null when
 *  that was the last one and the sign-in screen is due. */
export async function authRemove(uuid: string): Promise<Account | null> {
  if (!isDesktop()) throw asFailure({ message: "Quitar cuentas solo funciona en la aplicación de escritorio." })
  try {
    return await invoke<Account | null>("auth_remove", { uuid })
  } catch (err) {
    throw asFailure(err)
  }
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
  /** Null for a non-Minecraft version. */
  minecraft: string | null
  loader: string | null
  loaderVersion: string | null
  fileCount: number
  createdAt: string
}

export type LauncherGalleryImage = {
  url: string
  alt?: string | null
}

export type LauncherPack = {
  id: string
  slug: string
  name: string
  summary: string | null
  description?: string | null
  iconUrl: string | null
  gallery?: LauncherGalleryImage[]
  accessKind: "public" | "password" | "allowlist"
  /** Always sent by the Rust side (defaulted to "minecraft" for an older API). */
  gameType: "minecraft" | "emulator"
  /** The Quick Play target — set only for server packs (from the registry).
   *  `port` is absent for a bare SRV host; `host` can be absent on a legacy
   *  `{}` row, which still counts as a server pack (shown "unavailable"). */
  server?: { host?: string | null; port?: number | null } | null
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

/** Total playtime in milliseconds per pack. Never throws: missing playtime is
 *  cosmetic. */
export async function playtimeGet(): Promise<Record<string, number>> {
  try {
    return await invoke<Record<string, number>>("playtime_get")
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
    // §9 — `?crash=1` replays a crashed session so the diagnosis UI is
    // developable in a browser. Opt-in, because the default mock must still
    // exercise the running state.
    if (new URLSearchParams(location.search).get("crash") === "1") {
      void (async () => {
        await sleep(1200)
        for (const [level, source, text] of MOCK_CRASH_LOG) {
          busEmit<LogLine>(EVENT_GAME_LOG, { ts: Date.now(), level, source, text })
        }
        busEmit<GameState>(EVENT_GAME_STATE, {
          kind: "crashed",
          exitCode: 1,
          diagnosis: MOCK_DIAGNOSIS,
        })
      })()
    }
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

// ── §9: locked vs. user space, and version rollback ────────────────────────
// The Rust side keeps a MANAGED file set in the instance marker: everything the
// launcher installed. Anything else under `.minecraft` is the player's and is
// never touched, which is what lets an update delete a mod that left the pack
// without eating the minimap they added themselves.
//
// Browser mode gets a module-scoped simulation rather than a constant, so the
// toggle and revert screens are actually developable in `dev:renderer`.

const mockOptional: OptionalFile[] = [
  { path: "mods/journeymap.jar", name: "journeymap.jar", size: 4_200_000, enabled: true },
  { path: "mods/shaders.jar", name: "shaders.jar", size: 1_800_000, enabled: false },
]

const mockVersions: RetainedVersion[] = [
  {
    versionId: "mock-3",
    versionName: "1.4.0",
    minecraft: "1.21.4",
    loader: "neoforge",
    loaderVersion: "21.4.30",
    installedAt: new Date(Date.now() - 3_600_000).toISOString(),
    fileCount: 182,
    current: true,
    revertible: true,
  },
  {
    versionId: "mock-2",
    versionName: "1.3.2",
    minecraft: "1.21.4",
    loader: "neoforge",
    loaderVersion: "21.4.30",
    installedAt: new Date(Date.now() - 86_400_000).toISOString(),
    fileCount: 180,
    current: false,
    revertible: true,
  },
]

/** Versions still on this machine, newest first. Never throws: an empty
 *  rollback list is a normal state, not an error worth a red banner. */
export async function instanceVersions(slug: string): Promise<RetainedVersion[]> {
  if (!isDesktop()) return mockVersions
  try {
    return await invoke<RetainedVersion[]>("instance_versions", { slug })
  } catch {
    return []
  }
}

/** One-click rollback. Replays the retained version's recorded file list from
 *  the content-addressed cache, and PINS the instance so the next Play does not
 *  quietly reinstall the version that broke. */
export async function instanceRevert(
  slug: string,
  versionId: string,
  password?: string,
): Promise<ScannedInstallState> {
  if (!isDesktop()) {
    for (const v of mockVersions) v.current = v.versionId === versionId
    return { kind: "installed", versionId, sizeBytes: 1_284_000_000 }
  }
  try {
    return await invoke<ScannedInstallState>("instance_revert", {
      slug,
      versionId,
      password: password ?? null,
    })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Follow the server's latest version again. */
export async function instanceUnpin(slug: string): Promise<ScannedInstallState> {
  if (!isDesktop()) return { kind: "not-installed" }
  try {
    return await invoke<ScannedInstallState>("instance_unpin", { slug })
  } catch (err) {
    throw asFailure(err)
  }
}

/** The pack's optional files. Empty before the first install — optional-ness
 *  is a manifest fact the marker remembers, not something the disk can show. */
export async function instanceOptional(slug: string): Promise<OptionalFile[]> {
  if (!isDesktop()) return mockOptional.map((f) => ({ ...f }))
  try {
    return await invoke<OptionalFile[]>("instance_optional", { slug })
  } catch {
    return []
  }
}

/** Switch one optional file on or off. Applied by the next install, update or
 *  launch — all three run the same payload pass, so there is no apply button. */
export async function instanceOptionalSet(
  slug: string,
  path: string,
  enabled: boolean,
): Promise<OptionalFile[]> {
  if (!isDesktop()) {
    const hit = mockOptional.find((f) => f.path === path)
    if (hit) hit.enabled = enabled
    return mockOptional.map((f) => ({ ...f }))
  }
  try {
    return await invoke<OptionalFile[]>("instance_optional_set", { slug, path, enabled })
  } catch (err) {
    throw asFailure(err)
  }
}

// ── §9: per-instance Java runtime + memory ─────────────────────────────────
// The numbers are decided in Rust (install/runtime.rs), which is the only side
// that can read physical RAM and the instance marker. What follows is the
// bridge, plus a browser-mode simulation faithful enough that the three-state
// panel is developable in `dev:renderer` — the mock mirrors the SAME formula so
// the UI never learns to expect numbers the shell would not produce.

const MOCK_TOTAL_RAM_MIB = 16384

/** Mirrors `recommended_heap_mib` in src-tauri/src/install/runtime.rs. Browser
 *  mode only — the desktop build never runs this, and the Rust unit tests are
 *  the authority on the formula. */
function mockRecommend(modCount: number, totalRamMib: number): number {
  const want = 2560 + 12 * Math.min(modCount, 4096)
  const ceiling = Math.min(Math.floor((totalRamMib * 3) / 5), totalRamMib - 2048)
  const chosen = Math.min(want, ceiling, 16384)
  return Math.max(Math.floor(chosen / 512) * 512, 1024)
}

const mockRuntime: { memory: MemoryChoice; java: JavaChoice } = {
  memory: { mode: "inherit" },
  java: { mode: "inherit" },
}

function mockResolve(): InstanceRuntime {
  const modCount = 214
  const recommendedMib = mockRecommend(modCount, MOCK_TOTAL_RAM_MIB)
  const globalMemoryMib = MOCK_SETTINGS.memoryMib

  const [heapMib, memorySource]: [number, RuntimeSource] =
    mockRuntime.memory.mode === "fixed"
      ? [mockRuntime.memory.mib, "override"]
      : mockRuntime.memory.mode === "auto"
        ? [recommendedMib, "auto"]
        : MOCK_SETTINGS.memoryAuto
          ? [recommendedMib, "auto"]
          : [globalMemoryMib, "global"]

  const [javaPath, javaSource]: [string | null, RuntimeSource] =
    mockRuntime.java.mode === "custom"
      ? [mockRuntime.java.path.trim() || null, "override"]
      : mockRuntime.java.mode === "auto"
        ? [null, "override"]
        : [MOCK_SETTINGS.javaPath, "global"]

  return {
    over: { ...mockRuntime },
    effective: {
      heapMib,
      memorySource,
      javaPath,
      javaSource,
      modCount,
      totalRamMib: MOCK_TOTAL_RAM_MIB,
      recommendedMib,
    },
    globalMemoryMib,
    globalMemoryAuto: MOCK_SETTINGS.memoryAuto,
    globalJavaPath: MOCK_SETTINGS.javaPath,
  }
}

/** This pack's Java/memory choice and what it currently resolves to. Never
 *  throws: a runtime panel that cannot render is worse than one showing the
 *  inherited defaults. */
export async function instanceRuntime(slug: string): Promise<InstanceRuntime> {
  if (!isDesktop()) return mockResolve()
  try {
    return await invoke<InstanceRuntime>("instance_runtime", { slug })
  } catch {
    return mockResolve()
  }
}

/** Set this pack's Java and memory choice. Applied by the next install, update
 *  or launch — all three re-resolve, so there is no apply button. */
export async function instanceRuntimeSet(
  slug: string,
  memory: MemoryChoice,
  java: JavaChoice,
): Promise<InstanceRuntime> {
  if (!isDesktop()) {
    mockRuntime.memory = memory
    mockRuntime.java = java
    return mockResolve()
  }
  try {
    return await invoke<InstanceRuntime>("instance_runtime_set", { slug, memory, java })
  } catch (err) {
    throw asFailure(err)
  }
}

// ── Auto-update ────────────────────────────────────────────────────────────
// The whole updater lives in Rust (src-tauri/src/updates.rs) so the feed host
// can follow BOFF_API_URL like every other API call does. Here there is only
// the bridge.

export const EVENT_UPDATE_PROGRESS = "update://progress"

export type UpdateInfo = {
  version: string
  currentVersion: string
  notes: string | null
  date: string | null
}

export type UpdateProgressEvent = {
  downloadedBytes: number
  /** null until the server's Content-Length is known. */
  totalBytes: number | null
}

/** `null` = up to date (the feed answers 204) or no shell. THROWS a string when
 *  the check itself failed — the startup path swallows that so an offline
 *  player sees nothing, while a manual check can say so. */
export async function updatesCheck(): Promise<UpdateInfo | null> {
  if (!isDesktop()) return null
  return await invoke<UpdateInfo | null>("updates_check")
}

/** Download + verify + install + relaunch. Never resolves on success — the
 *  process is replaced. Throws a plain string message on failure. */
export async function updatesInstall(): Promise<void> {
  if (!isDesktop()) throw "Las actualizaciones solo funcionan en la aplicación de escritorio."
  await invoke("updates_install")
}

export const onUpdateProgress = (fn: (e: UpdateProgressEvent) => void) =>
  subscribe<UpdateProgressEvent>(EVENT_UPDATE_PROGRESS, fn)

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

// ── Server List Ping (RF-03/RF-04) ─────────────────────────────────────────
// Rust never throws here (status.rs folds every failure into `online: false`),
// so the bridge does not either — a card that cannot ping shows offline, not
// an error state.

export async function serverStatus(host: string, port?: number): Promise<ServerStatus> {
  if (!isDesktop()) return mockServerStatus(host)
  try {
    return await invoke<ServerStatus>("server_status", { host, port: port ?? null })
  } catch {
    return { online: false, players: null, motd: null, latencyMs: null }
  }
}

// ── Local packs (RF-05..RF-10) ──────────────────────────────────────────────
// A local pack is a full PackManifest, the same document a managed pack
// downloads (spec D3) — install_pack/launch_pack take it as-is. `slug` always
// carries the reserved `local-` prefix (local_packs.rs), which is what keeps
// a local pack from ever addressing a managed one.

export async function localPacksList(): Promise<PackManifest[]> {
  if (!isDesktop()) return mockLocalPacks()
  try {
    return await invoke<PackManifest[]>("local_packs_list")
  } catch {
    return []
  }
}

export async function localPackGet(slug: string): Promise<PackManifest | null> {
  if (!isDesktop()) return mockLocalPacks().find((m) => m.pack.slug === slug) ?? null
  try {
    return await invoke<PackManifest>("local_pack_get", { slug })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Create (no existing local slug) or save-in-place (an existing one). The
 *  Rust side assigns a fresh, collision-free `local-` slug for a new pack. */
export async function localPackSave(manifest: unknown): Promise<PackManifest> {
  if (!isDesktop()) return manifest as PackManifest
  try {
    return await invoke<PackManifest>("local_pack_save", { manifest })
  } catch (err) {
    throw asFailure(err)
  }
}

export async function localPackDelete(slug: string): Promise<void> {
  if (!isDesktop()) return
  try {
    await invoke("local_pack_delete", { slug })
  } catch (err) {
    throw asFailure(err)
  }
}

// ── Version metadata (local pack pickers) ──────────────────────────────────
// Rust talks to Mojang/Fabric/Quilt/Forge/NeoForge directly — see meta.rs for
// why this does not go through the API like the dashboard's picker does.

export async function minecraftVersions(): Promise<GameVersion[]> {
  if (!isDesktop()) return mockGameVersions()
  try {
    return await invoke<GameVersion[]>("meta_minecraft_versions")
  } catch (err) {
    throw asFailure(err)
  }
}

export async function loaderVersions(loader: string, minecraft: string): Promise<LoaderVersion[]> {
  if (!loader) return []
  if (!isDesktop()) return mockLoaderVersions()
  try {
    return await invoke<LoaderVersion[]>("meta_loader_versions", { loader, minecraft })
  } catch (err) {
    throw asFailure(err)
  }
}

// ── Mod catalog (RF-11) ────────────────────────────────────────────────────
// Modrinth only, and reached from Rust rather than from here — see catalog.rs
// for why CurseForge cannot be offered to a desktop client at all, and why the
// User-Agent Modrinth asks for is impossible to set from a webview.

export async function catalogSearch(input: {
  query?: string
  gameVersion?: string
  loader?: string
  projectType?: string
  sort?: string
  category?: string
  page?: number
  pageSize?: number
}): Promise<ModSearchPage> {
  if (!isDesktop()) return mockCatalogSearch(input.query)
  try {
    return await invoke<ModSearchPage>("catalog_search", input)
  } catch {
    return { hits: [], total: 0 }
  }
}

export async function catalogCategories(projectType: string): Promise<CatalogCategory[]> {
  if (!isDesktop()) return mockCatalogCategories()
  try {
    return await invoke<CatalogCategory[]>("catalog_categories", { projectType })
  } catch {
    return []
  }
}

export async function catalogProject(projectId: string): Promise<ModProject | null> {
  if (!isDesktop()) return mockCatalogProject(projectId)
  try {
    return await invoke<ModProject>("catalog_project", { projectId })
  } catch {
    return null
  }
}

export async function catalogProjectSummaries(ids: string[]): Promise<ModSearchHit[]> {
  if (!isDesktop()) return mockCatalogSearch().hits.filter((h) => ids.includes(h.projectId))
  try {
    return await invoke<ModSearchHit[]>("catalog_project_summaries", { ids })
  } catch {
    return []
  }
}

export async function catalogVersions(
  projectId: string,
  filters: { gameVersion?: string; loader?: string },
): Promise<ModFile[]> {
  if (!isDesktop()) return mockCatalogVersions(projectId)
  try {
    return await invoke<ModFile[]>("catalog_versions", { projectId, ...filters })
  } catch {
    return []
  }
}

/** Modrinth publishes sha512 and size with the version, so this costs one
 *  metadata request. A raw URL has no hash to borrow and must be downloaded to
 *  be hashed, which is why it is a separate, slower command. */
export async function catalogResolve(source: ResolveSource): Promise<ResolvedFile | null> {
  if (!isDesktop()) return mockCatalogResolve(source)
  try {
    if (source.kind === "modrinth") {
      return await invoke<ResolvedFile>("catalog_resolve_modrinth", {
        projectId: source.projectId,
        versionId: source.versionId,
      })
    }
    if (source.kind === "url") {
      return await invoke<ResolvedFile>("catalog_resolve_url", { url: source.url })
    }
    // CurseForge never reaches this launcher: it has no key and must not have
    // one. The dashboard authors those entries.
    return null
  } catch (err) {
    throw asFailure(err)
  }
}

// ── Instance content, files and worlds (pack detail tabs) ──────────────────

/** A file the pack declares, with this instance's view of it. `installed` and
 *  `enabled` are independent: a file can be declared but not yet downloaded,
 *  or downloaded and switched off. */
export type ContentFile = {
  path: string
  size: number
  isMod: boolean
  /** Whether the pack OFFERS the choice — not whether it is currently on. */
  optional: boolean
  enabled: boolean
  installed: boolean
  source:
    | { kind: "url"; url: string }
    | { kind: "modrinth"; versionId: string }
    | { kind: "curseforge"; projectId: number; fileId: number }
    | { kind: "override"; sha512: string }
    | { kind: "userProvided"; hint: string }
}

/** One file the pack expects the player to supply (a ROM dump). Mirrors Rust's
 *  `install::UserFile`. */
export type UserFile = {
  path: string
  hint: string
  sha512: string
  size: number
  satisfied: boolean
}

/** The `user-provided` files this manifest declares, with their local status.
 *  Empty for every Minecraft pack published so far, so callers can gate the
 *  whole section on `length > 0`. */
export async function instanceUserFiles(manifest: unknown): Promise<UserFile[]> {
  if (!isDesktop()) return []
  try {
    return await invoke<UserFile[]>("instance_user_files", { manifest })
  } catch {
    return []
  }
}

/** Ask the player for one `user-provided` file. The native picker opens on the
 *  Rust side (like every picker in this app); the file is hash-verified there
 *  and rejected with a clear message when it is the wrong dump. Resolves to the
 *  refreshed checklist. */
export async function instanceProvideUserFile(
  manifest: unknown,
  path: string,
): Promise<UserFile[]> {
  if (!isDesktop())
    throw asFailure({ message: "Aportar archivos solo funciona en la aplicación de escritorio." })
  try {
    return await invoke<UserFile[]>("instance_provide_user_file", { manifest, path })
  } catch (err) {
    throw asFailure(err)
  }
}

export type DirEntry = {
  path: string
  name: string
  isDir: boolean
  size: number
  modified: number
}

export type World = {
  folder: string
  name: string
  lastPlayed: number
  sizeBytes: number
  gameMode: "survival" | "creative" | "adventure" | "spectator" | "unknown"
  hardcore: boolean
  version: string | null
  hasIcon: boolean
}

/** What the Content tab renders. Empty before the first install — there is no
 *  marker to read, and a LOCAL pack's own manifest is the fallback the caller
 *  layers on top. */
export async function instanceContent(slug: string): Promise<ContentFile[]> {
  if (!isDesktop()) return mockContent()
  try {
    return await invoke<ContentFile[]>("instance_content", { slug })
  } catch {
    return []
  }
}

export async function instanceBrowse(slug: string, rel: string): Promise<DirEntry[]> {
  if (!isDesktop()) return mockDirEntries(rel)
  try {
    return await invoke<DirEntry[]>("instance_browse", { slug, rel })
  } catch (err) {
    throw asFailure(err)
  }
}

export async function instanceDeletePath(slug: string, rel: string): Promise<void> {
  if (!isDesktop()) return
  try {
    await invoke("instance_delete_path", { slug, rel })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Reveal a path in the OS file manager. `rel` may be "" for the game folder. */
export async function instanceReveal(slug: string, rel: string): Promise<void> {
  if (!isDesktop()) return
  try {
    await invoke("instance_reveal", { slug, rel })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Uninstall a MANAGED pack: delete its instance directory so the next library
 *  scan reports it "not installed" again. The pack stays in the library and its
 *  backups are kept — this is not the whole-pack deletion `localPackDelete` is.
 *  The caller must not offer this while the game is running. */
export async function instanceDelete(slug: string): Promise<void> {
  if (!isDesktop()) return
  try {
    await invoke("instance_delete", { slug })
  } catch (err) {
    throw asFailure(err)
  }
}

/** A screenshot on disk. `rel` is the handle `screenshotImage` takes back. */
export type Screenshot = {
  name: string
  rel: string
  size: number
  modified: number
}

/** Every screenshot in this instance, newest first. */
export async function instanceScreenshots(slug: string): Promise<Screenshot[]> {
  if (!isDesktop()) return []
  try {
    return await invoke<Screenshot[]>("instance_screenshots", { slug })
  } catch {
    return []
  }
}

/** One screenshot as a data: URL, or null if it is gone. Never throws — a
 *  thumbnail that will not load is cosmetic. */
export async function screenshotImage(slug: string, rel: string): Promise<string | null> {
  if (!isDesktop()) return rel
  try {
    return await invoke<string | null>("screenshot_image", { slug, rel })
  } catch {
    return null
  }
}

export async function instanceWorlds(slug: string): Promise<World[]> {
  if (!isDesktop()) return mockWorlds()
  try {
    return await invoke<World[]>("instance_worlds", { slug })
  } catch {
    return []
  }
}

/** Fetch a world's icon as a data: URL, or null if not present. Never throws:
 *  a missing icon is cosmetic. */
export async function worldIcon(slug: string, folder: string): Promise<string | null> {
  if (!isDesktop()) return null
  try {
    return await invoke<string | null>("world_icon", { slug, folder })
  } catch {
    return null
  }
}

/** Map Modrinth version ids back to their projects. The install marker records
 *  a version id and nothing else, so this is the only way an installed managed
 *  pack can show a mod's name, icon or author. */
export async function catalogVersionsByIds(ids: string[]): Promise<ModFile[]> {
  if (!isDesktop() || ids.length === 0) return []
  try {
    return await invoke<ModFile[]>("catalog_versions_by_ids", { ids })
  } catch {
    return []
  }
}

/** Cache a remote icon on disk and return an `asset:` URL the webview may
 *  actually render. In browser mode there is no CSP to work around, so the
 *  original URL is already correct and is handed straight back. Never throws:
 *  a missing icon is cosmetic and the caller falls back on its own. */
/** Where icon failures go. The provider points this at the launcher log; until
 *  it does, and in the browser, it is a no-op.
 *
 *  This exists because a release build has NO devtools: `console.error` is
 *  written to a console nobody can open, so "the icons are blank" had no
 *  observable cause at all. The Logs screen is the diagnostic surface a player
 *  (and whoever is debugging their report) can actually reach. */
let iconFailureSink: ((message: string) => void) | null = null

export function setIconFailureSink(sink: ((message: string) => void) | null): void {
  iconFailureSink = sink
}

/** Reports an icon the WEBVIEW refused, as opposed to one the cache could not
 *  produce. Deliberately separate from the failure above: the cache writing the
 *  file and the webview agreeing to render it are different things, and a bug
 *  in either one shows up as the same blank square. */
export function reportIconFailure(attemptedSrc: string, remoteUrl: string): void {
  // A data: URL carries the whole image; log its head, never the payload.
  const shown = attemptedSrc.length > 120 ? `${attemptedSrc.slice(0, 120)}…` : attemptedSrc
  iconFailureSink?.(
    `El webview rechazó el icono. URL generada: ${shown || "(vacía)"} — origen: ${remoteUrl || "(desconocido)"}`,
  )
}

/** Logged once per session so the shape of the generated URL is on the record.
 *  Every remaining explanation for "the bytes exist but nothing renders" is a
 *  property of this string — the scheme, the MIME — and it has never been
 *  visible anywhere. */
let loggedFirstIconUrl = false

/** Resolves catalog art to a `data:` URL via the on-disk cache (icons.rs).
 *  Nothing here touches the asset protocol: data: URLs need no scope, which is
 *  the property the previous two icon systems lacked. */
export async function iconSrc(url: string): Promise<string | null> {
  if (!isDesktop()) return url
  try {
    const data = await invoke<string>("icon_cache", { url })
    if (!loggedFirstIconUrl) {
      loggedFirstIconUrl = true
      const head = data.slice(0, data.indexOf(",") + 1)
      iconFailureSink?.(`Diagnóstico: primer icono servido como ${head}… (${data.length} caracteres)`)
    }
    return data
  } catch (err) {
    // Non-fatal — the caller falls back to the remote URL — but no longer
    // invisible. Three different faults (the command missing, the download
    // failing, the cache being unwritable) all used to look like a blank
    // square, and only this message tells them apart.
    const detail = (err as { message?: string })?.message ?? String(err)
    console.error("icon_cache failed for", url, err)
    iconFailureSink?.(`No se pudo cachear el icono ${url}: ${detail}`)
    return null
  }
}

/** Opens the native save dialog itself (no file-picker plugin on this side of
 *  the boundary); resolves to the chosen path, or throws if the player
 *  cancelled. */
export async function exportMrpack(slug: string): Promise<string> {
  if (!isDesktop()) throw asFailure({ message: "La exportación solo funciona en la aplicación de escritorio." })
  try {
    return await invoke<string>("export_mrpack", { slug })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Like {@link exportMrpack}, but drops every file whose `env.server` is
 *  "unsupported" — a server-ready pack minus the client-only mods. Same native
 *  save dialog; resolves to the chosen path, or throws if cancelled. */
export async function exportServerMrpack(slug: string): Promise<string> {
  if (!isDesktop()) throw asFailure({ message: "La exportación solo funciona en la aplicación de escritorio." })
  try {
    return await invoke<string>("export_server_mrpack", { slug })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Fork a local pack: new manifest, new slug, and a copy of the installed
 *  files. Local packs only — see the Rust side for why a managed pack cannot
 *  be duplicated in place. */
export async function localPackDuplicate(slug: string, name: string): Promise<PackManifest> {
  if (!isDesktop()) throw asFailure({ message: "Duplicar solo funciona en la aplicación de escritorio." })
  try {
    return await invoke<PackManifest>("local_pack_duplicate", { slug, name })
  } catch (err) {
    throw asFailure(err)
  }
}

export type Backup = {
  id: string
  kind: "instance" | "world"
  label: string
  createdAt: string
  world?: string
  sizeBytes: number
}

/** Snapshot the whole instance, or one world when `world` names a save folder. */
export async function backupCreate(
  slug: string,
  label: string,
  world?: string,
): Promise<Backup> {
  if (!isDesktop()) throw asFailure({ message: "Las copias solo funcionan en la aplicación de escritorio." })
  try {
    return await invoke<Backup>("backup_create", { slug, world: world ?? null, label })
  } catch (err) {
    throw asFailure(err)
  }
}

export async function backupList(slug: string): Promise<Backup[]> {
  if (!isDesktop()) return []
  try {
    return await invoke<Backup[]>("backup_list", { slug })
  } catch {
    // A listing that throws would leave the panel stuck on its spinner; an
    // empty list at least renders the "no backups yet" state.
    return []
  }
}

export async function backupRestore(slug: string, id: string): Promise<void> {
  if (!isDesktop()) throw asFailure({ message: "Las copias solo funcionan en la aplicación de escritorio." })
  try {
    await invoke("backup_restore", { slug, id })
  } catch (err) {
    throw asFailure(err)
  }
}

export async function backupDelete(slug: string, id: string): Promise<void> {
  if (!isDesktop()) throw asFailure({ message: "Las copias solo funcionan en la aplicación de escritorio." })
  try {
    await invoke("backup_delete", { slug, id })
  } catch (err) {
    throw asFailure(err)
  }
}

export type ImportMrpackResult = {
  manifest: PackManifest
  /** True when the imported pack's name collided with one already in the
   *  library and was renamed with a suffix (spec D4) — show a non-blocking
   *  notice, never a silent rename. */
  renamed: boolean
}

/** Opens the native file-picker itself; throws if the player cancelled, the
 *  file was not a valid .mrpack, or its loader is unsupported. Accepts both a
 *  pack this launcher exported and a plain Modrinth one, which the Rust side
 *  converts. */
export async function importMrpack(): Promise<ImportMrpackResult> {
  if (!isDesktop()) throw asFailure({ message: "La importación solo funciona en la aplicación de escritorio." })
  try {
    return await invoke<ImportMrpackResult>("import_mrpack")
  } catch (err) {
    throw asFailure(err)
  }
}

/** Import straight off Modrinth. `source` may be a modpack page URL, a version
 *  URL, a bare project slug, or a direct link to a .mrpack. Downloading happens
 *  on the Rust side, so no CSP allowance is needed for the CDN. */
export async function importMrpackUrl(source: string): Promise<ImportMrpackResult> {
  if (!isDesktop()) throw asFailure({ message: "La importación solo funciona en la aplicación de escritorio." })
  try {
    return await invoke<ImportMrpackResult>("import_mrpack_url", { url: source })
  } catch (err) {
    throw asFailure(err)
  }
}

// ── Local pack metadata (icon & gallery) ──────────────────────────────────

/** Open the native image picker and set a local pack's icon. Resolves to
 *  `true` when a file was chosen, `false` if the player cancelled. */
export async function localPackIconSet(slug: string): Promise<boolean> {
  if (!isDesktop()) return false
  try {
    return await invoke<boolean>("local_pack_icon_set", { slug })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Clear a local pack's icon. */
export async function localPackIconClear(slug: string): Promise<void> {
  if (!isDesktop()) return
  try {
    await invoke("local_pack_icon_clear", { slug })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Get a local pack's icon as a data: URL, or null if not set. */
export async function localPackIcon(slug: string): Promise<string | null> {
  if (!isDesktop()) return null
  try {
    return await invoke<string | null>("local_pack_icon", { slug })
  } catch {
    return null
  }
}

/** List gallery images for a local pack (filenames in gallery/ dir). */
export async function localPackGalleryList(slug: string): Promise<string[]> {
  if (!isDesktop()) return []
  try {
    return await invoke<string[]>("local_pack_gallery_list", { slug })
  } catch {
    return []
  }
}

/** Open the native image picker and add the chosen image to a local pack's
 *  gallery. Resolves to the stored filename, or `null` if cancelled. */
export async function localPackGalleryAdd(slug: string): Promise<string | null> {
  if (!isDesktop()) throw asFailure({ message: "Solo funciona en la aplicación de escritorio." })
  try {
    return await invoke<string | null>("local_pack_gallery_add", { slug })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Remove an image from a local pack's gallery. */
export async function localPackGalleryRemove(slug: string, filename: string): Promise<void> {
  if (!isDesktop()) return
  try {
    await invoke("local_pack_gallery_remove", { slug, filename })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Get a gallery image as a data: URL, or null if not found. */
export async function localPackGalleryImage(slug: string, filename: string): Promise<string | null> {
  if (!isDesktop()) return null
  try {
    return await invoke<string | null>("local_pack_gallery_image", { slug, filename })
  } catch {
    return null
  }
}

// ── Local pack worlds (bundled in pack, extracted on first install) ───────

/** Open the native .zip picker and add the chosen archive as a bundled world
 *  under `folder`. Resolves to `true` when added, `false` if cancelled. */
export async function localPackWorldAddZip(slug: string, folder: string): Promise<boolean> {
  if (!isDesktop()) throw asFailure({ message: "Solo funciona en la aplicación de escritorio." })
  try {
    return await invoke<boolean>("local_pack_world_add_zip", { slug, folder })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Promote an installed world into a local pack's bundled worlds. */
export async function localPackWorldPromote(slug: string, worldFolder: string): Promise<void> {
  if (!isDesktop()) throw asFailure({ message: "Solo funciona en la aplicación de escritorio." })
  try {
    await invoke("local_pack_world_promote", { slug, worldFolder })
  } catch (err) {
    throw asFailure(err)
  }
}

/** Remove a bundled world from a local pack. */
export async function localPackWorldRemove(slug: string, folder: string): Promise<void> {
  if (!isDesktop()) return
  try {
    await invoke("local_pack_world_remove", { slug, folder })
  } catch (err) {
    throw asFailure(err)
  }
}
