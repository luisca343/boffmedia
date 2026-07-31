import { invoke } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"

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

/** Rust serialises these with serde's snake_case field names. */
type RawVersion = {
  id: string
  name: string
  minecraft: string
  loader: string | null
  loader_version: string | null
  file_count: number
  created_at: string
}

type RawPack = {
  id: string
  slug: string
  name: string
  summary: string | null
  icon_url: string | null
  access_kind: LauncherPack["accessKind"]
  latest_version: RawVersion | null
}

function toPack(raw: RawPack): LauncherPack {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    summary: raw.summary,
    iconUrl: raw.icon_url,
    accessKind: raw.access_kind,
    latestVersion: raw.latest_version && {
      id: raw.latest_version.id,
      name: raw.latest_version.name,
      minecraft: raw.latest_version.minecraft,
      loader: raw.latest_version.loader,
      loaderVersion: raw.latest_version.loader_version,
      fileCount: raw.latest_version.file_count,
      createdAt: raw.latest_version.created_at,
    },
  }
}

/** Every pack this UUID may install. Throws an {@link AuthFailure}. */
export async function packsList(): Promise<LauncherPack[]> {
  try {
    const raw = await invoke<RawPack[]>("packs_list")
    return raw.map(toPack)
  } catch (err) {
    throw asFailure(err)
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
