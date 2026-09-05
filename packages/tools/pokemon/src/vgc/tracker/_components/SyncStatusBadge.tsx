"use client"

import { useVgcT } from "../../i18n";
import { Icon } from "@boffmedia/ui"
import type { ToolSyncState } from "@boffmedia/tool-kit"
import { useTrackerSync } from "../../tracker-core/context/TrackerSyncContext"

/**
 * T5. Every state named ONCE, in a map the compiler checks.
 *
 * This file used to be a chain of `syncStatus === "idle"` comparisons -- nine
 * of them, spread across a `tone` ternary, a `title`, an icon name, an
 * animation class and the label. Nothing in it was exhaustive, so adding a
 * state to the union changed nothing here and compiled clean: the new member
 * simply fell through every branch into the red "sync error" ending. That is
 * the failure mode this repo keeps finding -- a change that looks applied and
 * is not -- and it was live in the tracker while three vocabularies drifted
 * apart.
 *
 * `Record<ToolSyncState, …>` makes the same mistake a type error. It is the
 * shape `ColeccionView` already uses for the TCG collection, which is why that
 * one did not drift.
 */

type Tone = "ok" | "warn" | "bad"

const TONE_CLASS: Record<Tone, string> = {
  // --cut-line repeats each tone's border colour: the two slants are painted
  // geometry, and they cannot read a `border-*` utility.
  ok: "border-[color-mix(in_srgb,var(--ok)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft text-ok",
  warn: "border-[color-mix(in_srgb,var(--warn)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft text-warn",
  bad: "border-[color-mix(in_srgb,var(--bad)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad",
}

interface Look {
  tone: Tone
  icon: "check" | "refresh" | "alert" | "clock"
  /** The `tracker.sync.*` key for this state's label. */
  label: string
  spin?: boolean
}

/**
 * `null` means the badge does not render at all, which is deliberate for the
 * two resting states: a signed-out player has nowhere to sync to and is not
 * failing at anything, and an offline one is working from a complete local
 * store. Neither should carry a status chip, and that was the old `offline`
 * early return -- kept, but now stated per state rather than hidden in a
 * comparison at the top of the component.
 *
 * `conflict` is also null here because it renders its own panel below: a chip
 * cannot carry the explanation and the refresh button that state needs.
 */
const LOOK: Record<ToolSyncState, Look | null> = {
  "local-only": null,
  queued: null,
  conflict: null,
  synced: { tone: "ok", icon: "check", label: "synced" },
  syncing: { tone: "warn", icon: "refresh", label: "syncing", spin: true },
  retrying: { tone: "bad", icon: "alert", label: "error" },
  stuck: { tone: "bad", icon: "alert", label: "stuck" },
  rejected: { tone: "bad", icon: "alert", label: "error" },
}

export function SyncStatusBadge() {
  const t = useVgcT("tracker.sync")
  const { syncStatus, conflictMessage, refreshNow, pendingCount } = useTrackerSync()

  if (syncStatus === "conflict") {
    return (
      <div className="grid max-w-[17.5rem] gap-2 border border-solid border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft p-3 text-bad shadow-[var(--shadow)]">
        <p className="inline-flex items-center gap-[0.375rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em]">
          <Icon name="alert" size={12} />
          {t("conflict")}
        </p>
        <p className="font-body text-[0.75rem] leading-[1.5] text-txt-muted">{conflictMessage ?? t("conflictHint")}</p>
        <button
          type="button"
          onClick={() => void refreshNow()}
          className="justify-self-start border border-solid border-bad bg-bad px-[0.625rem] py-[0.375rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90"
        >
          {t("refreshFromCloud")}
        </button>
      </div>
    )
  }

  const look = LOOK[syncStatus]
  if (!look) return null

  const label = t(look.label)

  return (
    <div
      className={`cut cut-edge-slant [--cut:3px] inline-flex select-none items-center gap-[0.375rem] border border-solid px-[0.5625rem] py-[0.3125rem] font-mono text-[0.5625rem] font-bold uppercase tracking-[0.14em] ${TONE_CLASS[look.tone]}`}
      title={label}
    >
      <Icon
        name={look.icon}
        size={12}
        className={look.spin ? "animate-spin motion-reduce:animate-none" : ""}
      />
      <span>{label}</span>
      {/* What the device still owes the server. "Saved" with a silent queue
          behind it is the kind of half-truth that gets found out later. */}
      {pendingCount > 0 && (
        <span className="border-l border-solid border-current/30 pl-[0.375rem] opacity-80">
          {t("pending", { count: pendingCount })}
        </span>
      )}
      {/* A dead queue must offer the way out of itself, or `stuck` is just a
          nicer word for "stuck forever". */}
      {syncStatus === "stuck" && (
        <button
          type="button"
          onClick={() => void refreshNow()}
          className="border-l border-solid border-current/30 pl-[0.375rem] underline underline-offset-2 hover:opacity-80"
        >
          {t("retry")}
        </button>
      )}
    </div>
  )
}
