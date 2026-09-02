import { useEffect } from "react"

import {
  isDesktop,
  onPackDone,
  onPackError,
  toolPacksInstall,
  toolPacksStatus,
} from "../runtime"

// ── Module-level in-flight guard ─────────────────────────────────────────
// Two manifests can share one `dataPack.id` (Mewgenics' codex and builder
// both declare "mewgenics"), so a player opening one right after the other
// — before either status fetch even resolves — must not start two installs
// racing to write the same `<tool>/<version>.zip.part`. Rust's own
// `tool_packs_install` has no such guard: `PackState.begin()` unconditionally
// replaces the tool's cancel flag and spawns a fresh `run_install` task, so
// a second call orphans the first install's cancel handle rather than
// joining it. This set is therefore the only thing preventing a duplicate
// install, and it has to live at module scope — one per pack id, not one per
// component instance — so every `ToolView` mount (and every remount from
// leaving and reopening the tool) shares it.
const inFlight = new Set<string>()

// Cleared as soon as Rust reports the install is over, however it ended —
// on `done` so a later version bump can start a fresh install, and on
// `error` so a transient failure does not wedge the pack forever. Registered
// once at module scope (not inside the hook) because the component that
// started the install may already be unmounted — the player left the tool —
// by the time either event arrives, and the install itself keeps running
// server-side regardless.
onPackDone((e) => inFlight.delete(e.tool))
onPackError((e) => inFlight.delete(e.tool))

let warnedOnce = false
/** At most one console line for the whole session — this hook never shows
 *  the player anything, so a runaway retry loop must not spam the console
 *  either. */
function warnOnce(context: string, err: unknown) {
  if (warnedOnce) return
  warnedOnce = true
  console.warn(`[tool-pack] ${context}`, err)
}

/**
 * Silent background prefetch for a tool's data pack (RF4, seamless revision
 * 2026-09-02 — the owner rejected the download gate). The tool that calls
 * this always mounts immediately regardless of pack state; this hook's only
 * job is to notice a missing or outdated pack and start `tool_packs_install`
 * without the player ever seeing it. Art streams through `boffasset://`
 * while the install runs, so the tool is usable throughout.
 *
 * `toolId` is `ToolManifest.dataPack.id`, already gated by the caller to
 * `isDesktop()` — a web host or a manifest without `dataPack` passes
 * `undefined` and this hook does nothing. Offline (`status.available` is
 * `null`) and any install error are both swallowed: nothing throws, nothing
 * renders, at most one warning reaches the console for the whole session.
 * The only visible surface for any of this is Settings > Storage, which
 * reads pack state independently.
 */
export function useToolPack(toolId: string | undefined): void {
  useEffect(() => {
    if (!toolId || !isDesktop()) return
    let cancelled = false

    void toolPacksStatus(toolId)
      .then((status) => {
        if (cancelled) return
        // `available` is null exactly when the index could not be reached —
        // offline degrades to "keep streaming from the asset cache", not an
        // install attempt.
        if (!status.available) return
        // Any DIFFERENCE means install, never "greater than": a pack version is
        // `<dataset>-<content hash>` (pack-tool-assets.mjs), and a hash does not
        // order — rebuilding the same dataset can produce a suffix that sorts
        // lower, which a `>` test would read as "already current" and the fix
        // would never reach the player.
        const outdated =
          !status.installed || status.available.version !== status.installed.version
        if (!outdated || inFlight.has(toolId)) return
        inFlight.add(toolId)
        void toolPacksInstall(toolId).catch((err) => {
          inFlight.delete(toolId)
          warnOnce(`install ${toolId} failed`, err)
        })
      })
      .catch((err) => warnOnce(`status ${toolId} failed`, err))

    return () => {
      cancelled = true
    }
  }, [toolId])
}
