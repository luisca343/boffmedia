"use client"

import * as React from "react"
import { Icon } from "../primitives/boffmedia/icon"
import { BoffModal as Modal } from "../primitives/boffmedia/dialog"

interface ToolEntry {
  title: string
  icon: string
  href: string
  soon?: boolean
  cat?: string
  gameShort?: string
}

interface ToolCommandProps {
  tools?: ToolEntry[]
  go: (path: string) => void
  className?: string
}

export function ToolCommand({ tools = [], go, className = "" }: ToolCommandProps) {
  const [q, setQ] = React.useState("")
  const term = q.trim().toLowerCase()

  const results = term
    ? tools
        .filter(
          (t) =>
            t.title.toLowerCase().includes(term) ||
            (t.cat || "").toLowerCase().includes(term) ||
            (t.gameShort || "").toLowerCase().includes(term)
        )
        .slice(0, 7)
    : tools.slice(0, 7)

  return (
    <Modal
      size="md"
      title={null as unknown as string}
      trigger={
        <button
          className={
            "flex items-center gap-[0.6rem] w-full cursor-pointer px-[0.9rem] h-[48px] rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-2)] text-[color:var(--text-muted)] text-[length:var(--t-sm)] transition-all duration-[var(--dur)] hover:border-[var(--orange-500)] hover:bg-[var(--surface)]" +
            (className ? " " + className : "")
          }
        >
          <Icon name="search" size={16} />
          <span className="flex-1 text-left">Buscar herramienta…</span>
          <kbd className="font-mono text-[length:var(--t-xs)] px-[0.4rem] py-[0.15rem] rounded-[5px] bg-[var(--surface-3)] border border-[var(--border)] text-[color:var(--text-dim)]">
            ⌘K
          </kbd>
        </button>
      }
    >
      {(close: () => void) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-[0.6rem] py-[0.4rem] px-[0.4rem] pb-4 border-b border-[var(--border)] text-[color:var(--text-dim)]">
            <Icon name="search" size={18} />
            <input
              autoFocus
              placeholder="Busca por herramienta, categoría o juego…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 border-0 bg-transparent text-[color:var(--text)] font-[inherit] text-[length:var(--t-base)] outline-none"
            />
            <kbd className="font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)]">ESC</kbd>
          </div>
          <div className="flex flex-col gap-[0.2rem] pt-3 max-h-[320px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="text-center text-[color:var(--text-dim)] text-[length:var(--t-sm)] py-6">
                Sin resultados para «{q}».
              </div>
            ) : (
              results.map((t) => (
                <button
                  key={t.href}
                  className="flex items-center gap-[0.7rem] w-full text-left border-0 bg-transparent text-[color:var(--text-muted)] font-[inherit] text-[length:var(--t-sm)] py-[0.6rem] px-[0.7rem] rounded-[var(--radius)] cursor-pointer transition-[background,color] duration-[var(--dur)] hover:bg-[var(--surface-2)] hover:text-[color:var(--text)] [&_svg]:text-[color:var(--text-dim)]"
                  onClick={() => {
                    if (!t.soon) {
                      go(t.href.replace(/^#/, ""))
                    }
                    close()
                  }}
                >
                  <Icon name={t.icon} size={16} />
                  {t.title}
                  {t.gameShort && (
                    <span className="ml-auto font-mono text-[length:var(--t-xs)] text-[color:var(--text-dim)]">
                      {t.gameShort}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
