"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface CodeBlockProps {
  code: string
  lang?: string
  className?: string
}

export function CodeBlock({ code, lang = "jsx", className }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)
  const copy = () => { navigator.clipboard && navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1400) }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg,22px)] overflow-hidden",
        "border border-solid border-[var(--border)]",
        "bg-[var(--bg-grad-2)]",
        className,
      )}
    >
      <div className="flex items-center justify-between py-2 px-3.5 border-b-[var(--hairline,1px)] border-solid border-b-[var(--border)] bg-[var(--surface-2)]">
        <span className="font-mono text-xs tracking-[0.1em] uppercase text-[var(--text-dim)]">{lang}</span>
        <button
          className="inline-flex items-center gap-1.5 border-0 bg-transparent text-[var(--text-muted)] font-mono text-xs cursor-pointer py-0.5 px-1.5 rounded-[5px] hover:text-[var(--accent-bright)] hover:bg-[var(--accent-soft)]"
          onClick={copy}
        >
          <Icon name={copied ? "check" : "copy"} size={13} />{copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="m-0 p-4 overflow-x-auto font-mono text-sm leading-[1.65] text-[var(--text)] whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  )
}
