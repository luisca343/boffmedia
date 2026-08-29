"use client"

import { useTranslations, useLocale } from "next-intl"
import { Panel, Icon, Button, toast } from "@boffmedia/ui"
import { historyToCsv, type HistoryRound } from "@/components/boffmedia/ui/giveaways"
import { downloadText } from "@/lib/download"

export interface SorteosHistoryProps {
  history: HistoryRound[]
  onClearHistory: () => void
}

/**
 * History component — history with export/copy/clear
 */
export function SorteosHistory({ history, onClearHistory }: SorteosHistoryProps) {
  const t = useTranslations("otros.sorteosApp")
  const locale = useLocale()

  if (history.length === 0) return null

  const handleExport = () => {
    const csv = historyToCsv(history)
    const date = new Date().toISOString().split("T")[0]
    downloadText(`sorteo-boffmedia-${date}.csv`, csv, "text/csv")
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
      className="mt-[18px]"
      title={t("historyTitle")}
      media={<Icon name="trophy" />}
      aside={
        <div className="flex gap-[8px]">
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
            className="flex items-center gap-[14px] border-b border-line px-[18px] py-[13px] last:border-b-0"
          >
            <span className="cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:8px] grid h-[40px] w-[40px] flex-none place-items-center border border-accent-line bg-accent-soft font-display text-[15px] font-extrabold italic text-accent">
              #{r.round}
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-[7px]">
              {r.winners.map((w, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-[7px] border border-line-2 bg-panel-2 px-[9px] py-[6px] font-mono text-[12px] font-semibold text-txt"
                >
                  <Icon name="trophy" size={12} className="flex-none text-accent" />
                  {w.name}
                </span>
              ))}
            </div>
            <div className="grid flex-none gap-[4px] text-right">
              <span className="font-mono text-[10px] text-txt-dim">
                {t("seed")} <b className="text-txt-muted">#{r.seed}</b>
              </span>
              <time className="font-mono text-[10px] tracking-[0.06em] text-txt-dim">
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
