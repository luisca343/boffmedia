import { useEffect, useState } from "react"
import { Button, Panel, Progress, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import {
  getRandomizerAssignment,
  hashFile,
  patchRandomizerRom,
  filePicker,
  provideFile,
  updateRandomizerExpectedHash,
  instanceUserFilesScan,
  type RandomizerAssignment,
} from "../../runtime"
import type { MissingUserFile } from "../../services/types"

/** The emulator ROM slot within an instance, matched by extension. */
async function resolveRomSlotPath(slug: string, missingFiles: MissingUserFile[]): Promise<string | null> {
  const candidates = missingFiles.map((f) => f.path)
  try {
    const scan = await instanceUserFilesScan(slug)
    for (const p of (scan?.satisfied ?? []) as string[]) {
      if (!candidates.includes(p)) candidates.push(p)
    }
  } catch {
    // scan is best-effort; missingFiles alone is enough when the slot is unprovided
  }
  return candidates.find((p) => /\.(gba|nds)$/i.test(p)) ?? candidates[0] ?? null
}

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
  const [assignment, setAssignment] = useState<RandomizerAssignment | null | "loading">("loading")
  const [romPath, setRomPath] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState<"idle" | "uploading" | "downloading">("idle")
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load the assignment on mount
  useEffect(() => {
    const load = async () => {
      try {
        const result = await getRandomizerAssignment(packId)
        setAssignment(result)
        setLoadError(null)
      } catch (err) {
        // A null result (404 → no active event) legitimately hides the panel.
        // A thrown error (401/403/5xx) must be shown, not swallowed — otherwise
        // "not registered", "no session", etc. look identical to "no event".
        console.error("Failed to load randomizer assignment:", err)
        setLoadError((err as { message?: string })?.message ?? t("loadError"))
        setAssignment(null)
      }
    }
    void load()
  }, [packId])

  const handlePickRom = async () => {
    const picked = await filePicker()
    if (!picked) return

    setError(null)
    setUploadPhase("uploading")
    try {
      // Hash the ROM locally
      const actualHash = await hashFile(picked)
      if (!assignment || assignment === "loading") {
        setError(t("wrongHashError"))
        setUploadPhase("idle")
        return
      }

      // Compare to clean ROM hash
      if (actualHash.toLowerCase() !== assignment.cleanRomSha512.toLowerCase()) {
        toast.error(t("wrongHashError"))
        setUploadPhase("idle")
        return
      }

      // Resolve the emulator ROM slot from the pack's user files (no hardcoded name)
      const slotPath = await resolveRomSlotPath(slug, missingFiles)
      if (!slotPath) {
        toast.error(t("noRomSlot"))
        setUploadPhase("idle")
        return
      }

      // Upload and download randomized ROM
      setUploadPhase("uploading")
      const result = await patchRandomizerRom(assignment.eventId, picked, (progress) => {
        if (progress.phase === "uploading") {
          setUploadPhase("uploading")
          setUploadProgress(Math.round(progress.fraction * 100))
        } else {
          setUploadPhase("downloading")
          setUploadProgress(Math.round(progress.fraction * 100))
        }
      })

      // Update the marker to expect the output ROM hash
      await updateRandomizerExpectedHash(slug, slotPath, result.outputSha512)

      // Place the ROM in the instance
      await provideFile(slug, slotPath, result.outputPath)

      setRomPath(result.outputPath)
      setUploadPhase("idle")
      setUploadProgress(0)
      toast.success(t("readyToPlay"))
    } catch (err) {
      setError((err as { message?: string })?.message ?? t("wrongHashError"))
      setUploadPhase("idle")
      setUploadProgress(0)
    }
  }

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

  // Ready to play state (patched or verified)
  if (assignment.status === "patched" || assignment.status === "verified") {
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

  // ROM picker state (pending or claimed)
  return (
    <Panel title={t("panelTitle")} className={className}>
      <div className="flex flex-col gap-3">
        {uploadPhase === "idle" ? (
          <>
            <p className="text-sm text-txt-muted">{t("pickRom")}</p>
            <Button onClick={() => void handlePickRom()} icon="upload">
              {t("uploadButton")}
            </Button>
            {error && <p className="text-xs text-bad">{error}</p>}
          </>
        ) : (
          <>
            <p className="text-sm text-txt-muted">
              {uploadPhase === "uploading" ? t("uploading") : t("generating")}
            </p>
            <Progress value={uploadProgress} />
          </>
        )}
      </div>
    </Panel>
  )
}
