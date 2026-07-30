import { useEffect, useMemo, useRef, useState } from "react"

import { Badge, Button, Empty, Kicker, Panel, Seg, Toggle } from "@boffmedia/ui"

import type { LogLine } from "../services/types"
import { useLauncher } from "../state/launcher"
import { formatClock } from "../utils/format"

const LEVEL_CLASS: Record<LogLine["level"], string> = {
  debug: "text-txt-dim",
  info: "text-txt-muted",
  warn: "text-warn",
  error: "text-bad",
}

export function Logs() {
  const { logs, clearLogs } = useLauncher()
  const [filter, setFilter] = useState("all")
  const [follow, setFollow] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  const shown = useMemo(() => {
    if (filter === "all") return logs
    if (filter === "problems") return logs.filter((l) => l.level === "warn" || l.level === "error")
    return logs.filter((l) => l.source === filter)
  }, [logs, filter])

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
    <div className="flex h-full min-h-0 flex-col px-8 py-7">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Diagnóstico</Kicker>
          <h1 className="font-display text-[30px]/none font-bold uppercase tracking-[0.06em] text-txt">
            Registro
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Seg
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "Todo" },
              { value: "launcher", label: "Launcher" },
              { value: "game", label: "Juego" },
              { value: "problems", label: "Problemas" },
            ]}
          />
          <Toggle on={follow} onChange={setFollow} label="Seguir" />
          <Button size="sm" icon="copy" onClick={copyAll} disabled={shown.length === 0}>
            Copiar
          </Button>
          <Button size="sm" variant="ghost" icon="trash" onClick={clearLogs}>
            Limpiar
          </Button>
        </div>
      </header>

      <Panel flat bodyClassName="p-0" className="flex min-h-0 flex-1 flex-col">
        {shown.length === 0 ? (
          <Empty
            icon="list"
            title="Sin registro"
            lead="Aquí aparecerá la salida del launcher y del juego."
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto bg-base-deep p-3">
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
        líneas mostradas · se conservan las últimas 2000
      </p>
    </div>
  )
}
