import { useEffect, useMemo, useRef, useState } from "react"

import { Badge, Button, Empty, Panel, Seg, Toggle } from "@boffmedia/ui"

import { useT } from "../../i18n"
import type { LogLine } from "../../services/types"
import { formatClock } from "../../utils/format"

// The log viewer itself, extracted so the Registro TAB on the pack page and the
// standalone Logs SCREEN render the same thing. Two copies of a virtualised,
// auto-following table is two places for the follow behaviour to drift.

const LEVEL_CLASS: Record<LogLine["level"], string> = {
  debug: "text-txt-dim",
  info: "text-txt-muted",
  warn: "text-warn",
  error: "text-bad",
}

export function LogPanel({
  lines,
  onClear,
  className,
}: {
  lines: LogLine[]
  /** Omitted on the pack tab: clearing is a diagnostic action that belongs
   *  with the rest of them on the Logs screen. */
  onClear?: () => void
  className?: string
}) {
  const t = useT("logPanel")
  const [filter, setFilter] = useState("all")
  const [follow, setFollow] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  const shown = useMemo(() => {
    if (filter === "all") return lines
    if (filter === "problems") return lines.filter((l) => l.level === "warn" || l.level === "error")
    return lines.filter((l) => l.source === filter)
  }, [lines, filter])

  // Only auto-scroll while following, so reading scrollback isn't yanked away
  // every time the game emits a line.
  useEffect(() => {
    if (follow) endRef.current?.scrollIntoView({ block: "end" })
  }, [shown.length, follow])

  const copyAll = () => {
    const text = shown.map((l) => `${formatClock(l.ts)} [${l.level}] ${l.text}`).join("\n")
    void navigator.clipboard?.writeText(text)
  }

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Seg
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("allLogs") },
            { value: "app", label: t("app") },
            { value: "game", label: t("game") },
            { value: "problems", label: t("problems") },
          ]}
        />
        <Toggle on={follow} onChange={setFollow} label={t("follow")} />
        <span className="flex-1" />
        <Button size="sm" icon="copy" onClick={copyAll} disabled={shown.length === 0}>
          {t("copyButton")}
        </Button>
        {onClear && (
          <Button size="sm" variant="ghost" icon="trash" onClick={onClear}>
            {t("clearButton")}
          </Button>
        )}
      </div>

      <Panel flat bodyClassName="p-0" className="flex min-h-0 flex-col">
        {shown.length === 0 ? (
          <Empty
            icon="list"
            title={t("noLogs")}
            lead={t("noLogsDetail")}
          />
        ) : (
          <div className="max-h-[520px] min-h-0 flex-1 overflow-auto bg-base-deep p-3">
            <table className="w-full border-collapse font-mono text-[12px] leading-[1.55]">
              <tbody>
                {shown.map((line, i) => (
                  <tr key={`${line.ts}-${i}`} className="align-top">
                    <td className="w-[74px] select-none pr-3 text-txt-dim">
                      {formatClock(line.ts)}
                    </td>
                    <td className="w-[64px] select-none pr-3">
                      <span className={LEVEL_CLASS[line.level]}>{line.level}</span>
                    </td>
                    <td className="w-[70px] select-none pr-3 text-txt-dim">{line.source}</td>
                    <td className={`whitespace-pre-wrap ${LEVEL_CLASS[line.level]}`}>
                      {line.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div ref={endRef} />
          </div>
        )}
      </Panel>

      <p className="mt-3 flex items-center gap-2 text-xs text-txt-dim">
        <Badge tone="info">{shown.length}</Badge>
        {t("linesSummary", { shown: shown.length })}
      </p>
    </div>
  )
}
