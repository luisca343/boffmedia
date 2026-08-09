import { useEffect, useState, useCallback } from "react"
import { Button, Panel, Progress, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import {
  authOpenVerification,
  getRandomizerAssignment,
  downloadRandomizerRom,
  provideFile,
  updateRandomizerExpectedHash,
  instanceRomSlot,
  webBaseUrl,
  type RandomizerAssignment,
} from "../../runtime"
import type { MissingUserFile } from "../../services/types"
import { useLauncher } from "../../state/launcher"

export function RandomizerPanel({
  slug,
  packId,
  missingFiles,
  romBlocked,
  className,
}: {
  slug: string
  packId: string
  missingFiles: MissingUserFile[]
  /**
   * Whether THIS install still has the clean ROM in its slot, read from the
   * on-disk marker (`compute_randomizer_blocked`).
   *
   * This — not the assignment's `status` — decides whether the ROM has to be
   * downloaded. `status: 'patched'` is a SERVER fact ("a ROM has been generated
   * for this assignment"), and the server has no idea which machine holds the
   * file: a reinstall, a second computer or a wiped data directory all leave it
   * saying `patched` with nothing on disk. Keying on it meant the panel
   * reported "ready to play" while the Play button stayed disabled on the very
   * gate this panel exists to clear, with no way for the player to retry.
   */
  romBlocked: boolean
  className?: string
}) {
  const t = useT("randomlocke")
  const { refreshInstallState } = useLauncher()
  const [assignment, setAssignment] = useState<RandomizerAssignment | null | "loading">("loading")
  const [flowState, setFlowState] = useState<"idle" | "claiming" | "downloading" | "ready" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  // `missingUserFiles` is rebuilt on every PackDetail render, so depending on
  // the array itself gives runAutoFlow a new identity each time — which resets
  // the effect's timer below and can starve it. The paths are what matter.
  const missingKey = missingFiles.map((f) => f.path).join("|")

  // Run the auto-flow: claim assignment, resolve ROM slot, download, place, update marker
  const runAutoFlow = useCallback(async () => {
    try {
      setError(null)
      setFlowState("claiming")

      // Step 1: Get/refresh the assignment
      const result = await getRandomizerAssignment(packId)
      if (!result) {
        // No active event → panel hides.
        setAssignment(null)
        return
      }
      setAssignment(result)

      // Step 2: Resolve the ROM slot
      let slotPath = await instanceRomSlot(slug)
      if (!slotPath) {
        // Fallback: try to find from missing files
        const emulatorExt = missingFiles.length > 0 ? missingFiles[0].path : null
        if (emulatorExt && /\.(gba|nds)$/i.test(emulatorExt)) {
          slotPath = emulatorExt
        }
      }
      if (!slotPath) {
        throw new Error(t("noRomSlot"))
      }

      // Two independent ways this install can still need the ROM, and BOTH have
      // to be clear before the panel may claim it is ready:
      //
      //   · the slot is empty — the ROM is a user-provided file, so it shows up
      //     in missingUserFiles until something puts it there;
      //   · the marker still expects the clean ROM's hash — the anti-cheat gate,
      //     which is what disables Play.
      //
      // Checking only one of them is how the panel ended up announcing "ready to
      // play" over a Play button that was disabled, with no way to retry.
      const norm = (p: string) => p.toLowerCase().replace(/\\/g, "/")
      const romMissingOnDisk = missingFiles.some((f) => norm(f.path) === norm(slotPath))

      if (!romBlocked && !romMissingOnDisk) {
        setFlowState("ready")
        return
      }

      // Step 3: Download the randomized ROM. Cheap when the server already has
      // the output — it streams the cached blob instead of regenerating — so
      // erring towards downloading costs a transfer, while erring the other way
      // leaves the pack permanently unplayable.
      setFlowState("downloading")
      const rom = await downloadRandomizerRom(result.eventId)

      // Step 4: Update marker with new expected hash
      await updateRandomizerExpectedHash(slug, slotPath, rom.outputSha512)

      // Step 5: Place the ROM in the slot
      await provideFile(slug, slotPath, rom.outputPath)

      // Done!
      setFlowState("ready")
      void refreshInstallState(packId)
      toast.success(t("autoInstalled"))
    } catch (err) {
      const message = (err as { message?: string })?.message ?? (typeof err === "string" ? err : t("downloadError"))
      // Every failure lands on the retryable panel, including one that happened
      // before the assignment resolved. The old split showed a dead-end message
      // for those, which is the worst possible response to a transient network
      // error on the one screen that can fix the pack.
      setError(message)
      setFlowState("error")
      console.error("Randomizer auto-flow failed:", err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, slug, missingKey, romBlocked, t, refreshInstallState])

  // One entry point. This used to fetch the assignment on mount and then fetch
  // it AGAIN inside the flow, which was two round trips for one screen — and
  // the mount copy owned the decision about whether to download at all.
  useEffect(() => {
    if (flowState !== "idle") return
    const timer = setTimeout(() => {
      void runAutoFlow()
    }, 100)
    return () => clearTimeout(timer)
  }, [flowState, runAutoFlow])

  // Don't render if no assignment (404 means no active event)
  if (assignment === null) return null

  // Loading state
  if (assignment === "loading") {
    return (
      <Panel title={t("panelTitle")} className={className}>
        <p className="text-sm text-txt-muted">{t("panelTitle")}…</p>
      </Panel>
    )
  }

  // Ready state
  if (flowState === "ready") {
    return (
      <Panel title={t("panelTitle")} className={className}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-txt-success">{t("readyToPlay")}</p>
          {assignment.eventId && (
            <Button size="sm" variant="default" onClick={() => {
                void authOpenVerification(`${webBaseUrl()}/eventos/${assignment.eventId}`).catch(
                  () => undefined,
                )
              }}>
              {t("eventLink")}
            </Button>
          )}
        </div>
      </Panel>
    )
  }

  // Error state with retry
  if (flowState === "error") {
    return (
      <Panel title={t("panelTitle")} className={className}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-bad">{error}</p>
          <Button size="sm" onClick={() => setFlowState("idle")}>
            {t("retry")}
          </Button>
        </div>
      </Panel>
    )
  }

  // Claiming/Downloading state
  return (
    <Panel title={t("panelTitle")} className={className}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-txt-muted">
          {flowState === "claiming" ? t("claiming") : t("downloading")}
        </p>
        <Progress value={flowState === "claiming" ? 33 : 66} />
      </div>
    </Panel>
  )
}
