"use client"

import { Panel, Icon, Button, toast } from "@boffmedia/ui"
import { historyToCsv, type HistoryRound } from "@boffmedia/ui/giveaways"
import { saveFile } from "@boffmedia/tool-kit"
import { useToolT, SORTEOS_NS, useLocale } from "../i18n"

export interface SorteosHistoryProps {
  history: HistoryRound[]
  onClearHistory: () => void
}

/**
 * History component — history with export/copy/clear
 */
export function SorteosHistory({ history, onClearHistory }: SorteosHistoryProps) {
  const t = useToolT(SORTEOS_NS)
  const locale = useLocale()

  if (history.length === 0) return null

  const handleExport = async () => {
    const csv = historyToCsv(history)
    const date = new Date().toISOString().split("T")[0]
    // This is the seam that turns one anchor-click on the web into a real native
    // save dialog in the launcher.
    await saveFile({
      suggestedName: `sorteo-boffmedia-${date}.csv`,
      data: new Blob([csv], { type: "text/csv" }),
      mimeType: "text/csv",
    })
  }

  const handleCopy = () => {
    const csv = historyToCsv(history)
    try {
      navigator.clipboard?.writeText(csv).then(
        () => {
          toast({ msg: t("toastHistoryCopied"), tone: "ok", icon: "check" })
        },
        () => {
          toast({ msg: t("toastCopyFailed"), tone: "bad" })
        }
      )
    } catch {
      toast({ msg: t("toastCopyFailed"), tone: "bad" })
    }
  }

  return (
    <Panel
      className="mt-[1.125rem]"
      title={t("historyTitle")}
      media={<Icon name="trophy" />}
      aside={
        <div className="flex gap-[0.5rem]">
          <Button
            variant="ghost"
            size="sm"
            icon="download"
            onClick={handleExport}
          >
            {t("exportCsv")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="copy"
            onClick={handleCopy}
          >
            {t("copyHistory")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="x"
            onClick={onClearHistory}
          >
            {t("clearHistory")}
          </Button>
        </div>
      }
      bodyClassName="p-0"
    >
      <div className="grid">
        {history.map((r) => (
          <div
            key={r.round + "-" + r.seed}
            className="flex items-center gap-[0.875rem] border-b border-line px-[1.125rem] py-[0.8125rem] last:border-b-0"
          >
            <span className="cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:8px] grid h-[2.5rem] w-[2.5rem] flex-none place-items-center border border-accent-line bg-accent-soft font-display text-[0.9375rem] font-extrabold italic text-accent">
              #{r.round}
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-[0.4375rem]">
              {r.winners.map((w, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-[0.4375rem] border border-line-2 bg-panel-2 px-[0.5625rem] py-[0.375rem] font-mono text-[0.75rem] font-semibold text-txt"
                >
                  <Icon name="trophy" size={12} className="flex-none text-accent" />
                  {w.name}
                </span>
              ))}
            </div>
            <div className="grid flex-none gap-[0.25rem] text-right">
              <span className="font-mono text-[0.625rem] text-txt-dim">
                {t("seed")} <b className="text-txt-muted">#{r.seed}</b>
              </span>
              <time className="font-mono text-[0.625rem] tracking-[0.06em] text-txt-dim">
                {new Date(r.at).toLocaleString(locale, {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
