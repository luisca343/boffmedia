import { useSyncExternalStore } from "react"

import {
  onUpdateProgress,
  updatesCheck,
  updatesInstall,
  type UpdateInfo,
} from "../runtime"

// Auto-update state, kept in a module-level store rather than a React context
// on purpose: the banner and the Settings row are on opposite sides of the
// screen tree, and a provider would have to wrap the SignIn screen too — which
// is exactly the thing the update check must not gate.

export type UpdatePhase = "idle" | "checking" | "available" | "installing" | "failed"

export type UpdateStore = {
  phase: UpdatePhase
  update: UpdateInfo | null
  /** 0–1, or null while the download size is still unknown. */
  progress: number | null
  /** Only ever set by a MANUAL check or a failed install. The startup check
   *  leaves this null so an offline player sees no error. */
  error: string | null
  dismissed: boolean
}

let state: UpdateStore = {
  phase: "idle",
  update: null,
  progress: null,
  error: null,
  dismissed: false,
}

const listeners = new Set<() => void>()

function set(patch: Partial<UpdateStore>): void {
  state = { ...state, ...patch }
  for (const fn of listeners) fn()
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function message(err: unknown): string {
  if (typeof err === "string") return err
  const e = err as { message?: string }
  return e?.message ?? "No se pudo comprobar si hay actualizaciones."
}

let started = false

/** Fire the startup check exactly once, in the background. Never rejects, never
 *  sets `error`: a launcher that cannot reach the update feed must behave
 *  exactly like one that is already up to date. */
export function startUpdateCheck(): void {
  if (started) return
  started = true
  void checkForUpdates(false)
}

/** `manual` = the user pressed «Buscar actualizaciones», so a failure and a
 *  "you are up to date" both deserve to be visible. */
export async function checkForUpdates(manual: boolean): Promise<void> {
  if (state.phase === "installing") return
  set({ phase: "checking", error: null })
  try {
    const update = await updatesCheck()
    set({
      phase: update ? "available" : "idle",
      update,
      // A manual check re-opens a dismissed banner — otherwise pressing
      // «Buscar actualizaciones» would point at an aviso that is not there.
      // A background check only re-opens it for a version not yet dismissed.
      dismissed:
        !manual && update && update.version === state.update?.version ? state.dismissed : false,
    })
  } catch (err) {
    set({ phase: "idle", update: null, error: manual ? message(err) : null })
  }
}

export function dismissUpdate(): void {
  set({ dismissed: true })
}

/** Download, verify, install and relaunch. On success this never resolves —
 *  the process is replaced by the new build. */
export async function installUpdate(): Promise<void> {
  if (state.phase === "installing") return
  set({ phase: "installing", progress: null, error: null })

  const stop = onUpdateProgress((e) => {
    set({
      progress: e.totalBytes && e.totalBytes > 0 ? e.downloadedBytes / e.totalBytes : null,
    })
  })

  try {
    await updatesInstall()
  } catch (err) {
    set({ phase: "failed", error: message(err) })
  } finally {
    stop()
  }
}

export function useUpdates(): UpdateStore {
  return useSyncExternalStore(subscribe, () => state, () => state)
}
