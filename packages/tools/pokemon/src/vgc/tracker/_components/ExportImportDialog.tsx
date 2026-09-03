"use client"

import { useRef, useState } from "react"
import { useVgcT } from "../../i18n";
import { cn } from "@boffmedia/ui/cn"
import { Modal, Icon, type IconName } from "@boffmedia/ui"
import {
  downloadJson,
  exportAll,
  exportSession,
  importData,
  parseExportFile,
  type ImportResult,
} from "../../tracker-core/utils/exportImport"
import { useTrackerSync } from "../../tracker-core/context/TrackerSyncContext"

interface Props {
  sessionId?: string
  sessionLabel?: string
  onImportDone: () => void
  onClose: () => void
}

function ActionRow({
  icon,
  iconClass,
  title,
  hint,
  disabled,
  onClick,
}: {
  icon: IconName
  iconClass: string
  title: React.ReactNode
  hint?: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-[0.625rem] border border-solid border-line bg-base px-[0.8125rem] py-[0.6875rem] text-left transition-[border-color,background] hover:border-line-2 hover:bg-panel-2 disabled:opacity-50"
    >
      <Icon name={icon} size={16} className={cn("flex-none", iconClass)} />
      <span className="grid min-w-0">
        <span className="font-body text-[0.8125rem] text-txt">{title}</span>
        {hint && <span className="truncate font-mono text-[0.6875rem] text-txt-dim">{hint}</span>}
      </span>
    </button>
  )
}

export function ExportImportDialog({ sessionId, sessionLabel, onImportDone, onClose }: Props) {
  const t = useVgcT("tracker")
  const { pushChange } = useTrackerSync()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState("")

  const handleExportSession = async () => {
    if (!sessionId) return
    setBusy(true)
    try {
      const data = await exportSession(sessionId)
      const label = sessionLabel?.replace(/[^a-z0-9]/gi, "_") ?? "session"
      downloadJson(data, `vgc_session_${label}.json`)
    } finally {
      setBusy(false)
    }
  }

  const handleExportAll = async () => {
    setBusy(true)
    try {
      const data = await exportAll()
      downloadJson(data, `vgc_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`)
    } finally {
      setBusy(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setBusy(true)
    setImportError("")
    setResult(null)
    try {
      const text = await file.text()
      const data = parseExportFile(text)
      const res = await importData(data, (table, id, entity) => pushChange(table, id, entity))
      setResult(res)
      onImportDone()
    } catch {
      setImportError(t("exportImport.importError"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={t("exportImport.title")} size="sm">
      <div className="grid gap-3">
        {sessionId && (
          <ActionRow
            icon="download"
            iconClass="text-accent-bright"
            title={t("exportImport.exportSession")}
            hint={sessionLabel ? `— ${sessionLabel}` : undefined}
            disabled={busy}
            onClick={handleExportSession}
          />
        )}
        <ActionRow icon="download" iconClass="text-accent-bright" title={t("exportImport.exportAll")} disabled={busy} onClick={handleExportAll} />

        <div className="border-t border-solid border-line" />

        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
        <ActionRow
          icon="inbox"
          iconClass="text-warn"
          title={t("exportImport.importFile")}
          hint={t("exportImport.importHint")}
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        />

        {result && (
          <p className="text-center font-mono text-[0.6875rem] text-ok">
            {t("exportImport.importSuccess", { sessions: result.sessions, matches: result.matches })}
          </p>
        )}
        {importError && <p className="text-center font-mono text-[0.6875rem] text-bad">{importError}</p>}
      </div>
    </Modal>
  )
}
