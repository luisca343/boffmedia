import { useEffect, useState } from "react"

import { Button, Kicker } from "@boffmedia/ui"

import { useT } from "../i18n"
import { CrashDiagnosisCard } from "../components/CrashDiagnosis"
import { LogPanel } from "../components/pack/LogPanel"
import { getRuntimeInfo, type RuntimeInfo } from "../runtime"
import { useApp } from "../state/app"
import { buildSupportReport } from "../utils/report"

export function Logs() {
  const t = useT("logs")
  const { logs, clearLogs, game, selected, settings } = useApp()
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    void getRuntimeInfo().then(setRuntime)
  }, [])

  const copyReport = async () => {
    const report = buildSupportReport({ runtime, pack: selected, game, settings, logs })
    const ok = await navigator.clipboard
      ?.writeText(report)
      .then(() => true)
      .catch(() => false)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-8 py-7">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <Kicker>{t("sectionTitle")}</Kicker>
          <h1 className="font-display text-[30px]/none font-bold uppercase tracking-[0.06em] text-txt">
            {t("title")}
          </h1>
        </div>
        {/* §9 — one paste with the launcher/pack/Java context on top, so a report
            is a block of text a player can send, not a screenshot of scrollback. */}
        <Button size="sm" icon="copy" onClick={() => void copyReport()} disabled={logs.length === 0}>
          {copied ? t("copied") : t("copyReportButton")}
        </Button>
      </header>

      {/* §9 — above the log, not inside it: the whole point is that the player
          never has to read the 4000 lines below to know what happened. */}
      {game.kind === "crashed" && (
        <div className="mb-4">
          <CrashDiagnosisCard diagnosis={game.diagnosis} onCopyReport={() => void copyReport()} />
        </div>
      )}

      <LogPanel lines={logs} onClear={clearLogs} className="flex min-h-0 flex-1 flex-col" />
    </div>
  )
}
