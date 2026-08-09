import { useEffect, useState, useCallback } from "react"
import { Button, Panel, Progress, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import {
  getRandomizerAssignment,
  downloadRandomizerRom,
  provideFile,
  updateRandomizerExpectedHash,
  instanceRomSlot,
  type RandomizerAssignment,
} from "../../runtime"
import type { MissingUserFile } from "../../services/types"
import { useLauncher } from "../../state/launcher"

export function RandomizerPanel({
  slug,
  packId,
  missingFiles,
  className,
}: {
  slug: string
  packId: string
  missingFiles: MissingUserFile[]
  className?: string
}) {
  const t = useT("randomlocke")
  const { refreshInstallState } = useLauncher()
  const [assignment, setAssignment] = useState<RandomizerAssignment | null | "loading">("loading")
  const [flowState, setFlowState] = useState<"idle" | "claiming" | "downloading" | "ready" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Run the auto-flow: claim assignment, resolve ROM slot, download, place, update marker
  const runAutoFlow = useCallback(async () => {
    try {
      setError(null)
      setFlowState("claiming")

      // Step 1: Get/refresh the assignment
      const result = await getRandomizerAssignment(packId)
      if (!result) {
        // No active event → panel should hide, this shouldn't happen
        setAssignment(null)
        return
      }
      setAssignment(result)

      // If already patched/verified, no need to download
      if (result.status === "patched" || result.status === "verified") {
        setFlowState("ready")
        return
      }

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

      // Step 3: Download the randomized ROM
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
      setError(message)
      setFlowState("error")
      console.error("Randomizer auto-flow failed:", err)
    }
  }, [packId, slug, missingFiles, t, refreshInstallState])

  // Load the assignment on mount
  useEffect(() => {
    const load = async () => {
      try {
        const result = await getRandomizerAssignment(packId)
        if (!result) {
          // No active event → hide panel
          setAssignment(null)
          return
        }
        setAssignment(result)
        setLoadError(null)

        // If not yet patched, auto-start the flow
        if (result.status !== "patched" && result.status !== "verified") {
          setFlowState("idle")
        } else {
          setFlowState("ready")
        }
      } catch (err) {
        console.error("Failed to load randomizer assignment:", err)
        setLoadError((err as { message?: string })?.message ?? t("loadError"))
        setAssignment(null)
      }
    }
    void load()
  }, [packId, t])

  // Auto-run the flow when entering idle state (after mount or error retry)
  useEffect(() => {
    if (flowState === "idle" && assignment && assignment !== "loading") {
      const timer = setTimeout(() => {
        void runAutoFlow()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [flowState, assignment, runAutoFlow])

  // A real error (not a plain 404) is shown so the failing gate is visible.
  if (assignment === null && loadError) {
    return (
      <Panel title={t("panelTitle")} className={className}>
        <p className="text-sm text-bad">{loadError}</p>
      </Panel>
    )
  }

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
            <Button size="sm" variant="default" onClick={() => window.open(`/randomizer/events/${assignment.eventId}`)}>
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
