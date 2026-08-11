"use client"

import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import { useTrackerSync } from "@/features/vgc-tracker/context/TrackerSyncContext"

export function SyncStatusBadge() {
  const t = useTranslations("vgc.tracker.sync")
  const { syncStatus, conflictMessage, refreshNow } = useTrackerSync()

  if (syncStatus === "offline") return null

  if (syncStatus === "conflict") {
    return (
      <div className="grid max-w-[280px] gap-2 border border-solid border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft p-3 text-bad shadow-[var(--shadow)]">
        <p className="inline-flex items-center gap-[6px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
          <Icon name="alert" size={12} />
          {t("conflict")}
        </p>
        <p className="font-body text-[12px] leading-[1.5] text-txt-muted">{conflictMessage ?? t("conflictHint")}</p>
        <button
          type="button"
          onClick={() => void refreshNow()}
          className="justify-self-start border border-solid border-bad bg-bad px-[10px] py-[6px] font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90"
        >
          {t("refreshFromCloud")}
        </button>
      </div>
    )
  }

  // --cut-line repeats each tone's border colour: the two slants are painted
  // geometry, and they cannot read a `border-*` utility.
  const tone =
    syncStatus === "idle"
      ? "border-[color-mix(in_srgb,var(--ok)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft text-ok"
      : syncStatus === "syncing"
        ? "border-[color-mix(in_srgb,var(--warn)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft text-warn"
        : "border-[color-mix(in_srgb,var(--bad)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad"

  return (
    <div
      className={`cut cut-edge-slant [--cut:3px] inline-flex select-none items-center gap-[6px] border border-solid px-[9px] py-[5px] font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${tone}`}
      title={syncStatus === "idle" ? t("synced") : syncStatus === "syncing" ? t("syncing") : t("error")}
    >
      <Icon
        name={syncStatus === "syncing" ? "refresh" : syncStatus === "idle" ? "check" : "alert"}
        size={12}
        className={syncStatus === "syncing" ? "animate-spin motion-reduce:animate-none" : ""}
      />
      <span>{syncStatus === "idle" ? t("synced") : syncStatus === "syncing" ? t("syncing") : t("error")}</span>
    </div>
  )
}
