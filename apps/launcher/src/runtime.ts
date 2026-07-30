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
