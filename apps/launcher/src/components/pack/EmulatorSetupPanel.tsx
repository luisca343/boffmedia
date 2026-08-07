import { useEffect, useState } from "react"
import {
  Badge,
  Button,
  Icon,
  Panel,
  toast,
} from "@boffmedia/ui"

import { useT } from "../../i18n"
import type { MissingUserFile } from "../../services/types"
import {
  emulatorStatus,
  emulatorSetPath,
  emulatorClearPath,
  instanceUserFilesScan,
  filePicker,
  folderPicker,
  provideFile,
} from "../../runtime"

interface EmulatorSetupPanelProps {
  slug: string
  emulatorKind?: string | null
  missingFiles: MissingUserFile[]
  onFileProvided: () => void
  className?: string
}

export function EmulatorSetupPanel({
  slug,
  emulatorKind,
  missingFiles,
  onFileProvided,
  className,
}: EmulatorSetupPanelProps) {
  const t = useT("emulatorSetup")
  const [emulatorData, setEmulatorData] = useState<any>(null)
  const [scanning, setScanning] = useState(false)
  const [satisfiedFiles, setSatisfiedFiles] = useState<string[]>([])
  const [stillMissing, setStillMissing] = useState<MissingUserFile[]>(missingFiles)

  const emulatorLabel = t(`emulatorSetup.emulatorNames.${emulatorKind}`) ?? "Unknown"

  // Load emulator status on mount
  useEffect(() => {
    if (!emulatorKind || (emulatorKind !== "mgba" && emulatorKind !== "melonds")) return

    void emulatorStatus(emulatorKind as "mgba" | "melonds").then((data) => {
      setEmulatorData(data)
    })
  }, [emulatorKind])

  // Scan for ROMs on mount and when missingFiles changes
  useEffect(() => {
    setStillMissing(missingFiles)
    void scanForFiles()
  }, [slug, missingFiles])

  const scanForFiles = async () => {
    setScanning(true)
    try {
      const result = await instanceUserFilesScan(slug)
      setSatisfiedFiles(result.satisfied || [])
      setStillMissing(
        missingFiles.filter((f) => !(result.satisfied || []).includes(f.path))
      )

      // Show toast if files were found
      if ((result.satisfied || []).length > 0) {
        toast.success(t("filesFoundToast", { count: result.satisfied.length }))
      }
    } catch (err) {
      console.error("Failed to scan for files:", err)
      toast.error(t("scanError"))
    } finally {
      setScanning(false)
    }
  }

  const handleLocateEmulator = async () => {
    if (!emulatorKind || (emulatorKind !== "mgba" && emulatorKind !== "melonds")) return

    const path = await filePicker()
    if (!path) return

    try {
      const newStatus = await emulatorSetPath(emulatorKind as "mgba" | "melonds", path)
      setEmulatorData(newStatus)
      toast.success(t("emulatorPathSet"))
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("emulatorPathError"))
    }
  }

  const handleChangeEmulator = async () => {
    if (!emulatorKind || (emulatorKind !== "mgba" && emulatorKind !== "melonds")) return

    const path = await filePicker()
    if (!path) return

    try {
      const newStatus = await emulatorSetPath(emulatorKind as "mgba" | "melonds", path)
      setEmulatorData(newStatus)
      toast.success(t("emulatorPathChanged"))
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("emulatorPathError"))
    }
  }

  const handleClearEmulator = async () => {
    if (!emulatorKind || (emulatorKind !== "mgba" && emulatorKind !== "melonds")) return

    try {
      const newStatus = await emulatorClearPath(emulatorKind as "mgba" | "melonds")
      setEmulatorData(newStatus)
      toast.success(t("emulatorPathCleared"))
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("emulatorPathError"))
    }
  }

  const handleSelectFile = async (file: MissingUserFile) => {
    const path = await filePicker()
    if (!path) return

    try {
      await provideFile(slug, file.path, path)
      setSatisfiedFiles((prev) => [...prev, file.path])
      setStillMissing((prev) => prev.filter((f) => f.path !== file.path))
      toast.success(t("fileProvided"))
      onFileProvided()
    } catch (err) {
      const error = err as any
      if (error.code === "wrong_hash") {
        toast.error(t("wrongHashError", { hint: error.expectedHint || file.hint }))
      } else {
        toast.error((err as { message?: string })?.message ?? t("provideFileError"))
      }
    }
  }

  const isResolved = emulatorData?.resolved
  const sourceTag = emulatorData?.resolved?.source

  return (
    <Panel title={t("emulatorRow.title")} className={className}>
      {/* Emulator row */}
      <div className="mb-6 rounded border border-line bg-surface-bright p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="gamepad" size={20} className="text-txt-muted" />
            <div>
              <p className="font-medium text-txt">{emulatorLabel}</p>
              {isResolved ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-txt-dim">{emulatorData.resolved.path}</p>
                  {sourceTag && (
                    <Badge tone="info" className="text-xs">
                      · {t(`emulatorRow.source.${sourceTag}`)}
                    </Badge>
                  )}
                </div>
              ) : emulatorData?.staleOverride ? (
                <p className="text-sm text-bad">{t("emulatorRow.staleOverride")}</p>
              ) : (
                <p className="text-sm text-txt-dim">{t("emulatorRow.unresolved")}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!isResolved ? (
              <Button
                size="sm"
                variant="default"
                icon="folder"
                onClick={handleLocateEmulator}
              >
                {t("emulatorRow.locate")}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleChangeEmulator}
                >
                  {t("emulatorRow.change")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearEmulator}
                >
                  {t("emulatorRow.clear")}
                </Button>
              </>
            )}
          </div>
        </div>
        {!isResolved && (
          <p className="mt-3 text-sm text-txt-dim">
            {t("emulatorRow.emudeckHint")}
            {" "}
            <a href="https://www.emudeck.com/" target="_blank" rel="noopener noreferrer" className="text-accent">
              emudeck.com
            </a>
          </p>
        )}
      </div>

      {/* ROM checklist */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-txt">{t("romChecklist.title")}</h3>
          <Button
            size="sm"
            variant="ghost"
            icon="refresh"
            loading={scanning}
            onClick={scanForFiles}
          >
            {t("romChecklist.scan")}
          </Button>
        </div>

        {stillMissing.length === 0 && satisfiedFiles.length === 0 && scanning ? (
          <div className="flex items-center justify-center rounded border border-dashed border-line bg-surface-dim py-8 text-center">
            <p className="text-sm text-txt-dim">{t("romChecklist.scanning")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Satisfied files */}
            {satisfiedFiles.map((path) => (
              <div
                key={path}
                className="flex items-center gap-3 rounded border border-line-ok bg-surface-ok-dim p-3"
              >
                <Icon name="check" size={16} className="text-ok" />
                <span className="flex-1 font-mono text-sm text-txt">{path}</span>
                <Badge tone="ok">{t("romChecklist.provided")}</Badge>
              </div>
            ))}

            {/* Missing files */}
            {stillMissing.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-3 rounded border border-line bg-surface-dim p-3"
              >
                <Icon name="alert" size={16} className="text-warn" />
                <div className="flex-1">
                  <p className="font-mono text-sm text-txt">{file.path}</p>
                  <p className="text-xs text-txt-dim">{file.hint}</p>
                  <p className="text-xs text-txt-dim">~{Math.round(file.fileSize / 1024 / 1024)}MB</p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => void handleSelectFile(file)}
                >
                  {t("romChecklist.selectFile")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patch note for patched ROMs */}
      <div className="rounded border border-line-info bg-surface-info-dim p-3 text-sm text-txt">
        <p className="font-medium">{t("patchNote.title")}</p>
        <p className="mt-1 text-txt-dim">{t("patchNote.description")}</p>
      </div>
    </Panel>
  )
}
