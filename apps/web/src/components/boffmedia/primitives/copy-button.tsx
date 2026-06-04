"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface CopyButtonProps {
  text: string
  label?: string
  copiedLabel?: string
  className?: string
}

export function CopyButton({ text, label = "Copiar", copiedLabel = "Copiado", className }: CopyButtonProps) {
  const [done, setDone] = useState(false)
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    try { navigator.clipboard.writeText(text) } catch (_) { /* noop */ }
    setDone(true)
    setTimeout(() => setDone(false), 1600)
  }
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5",
        "rounded-[var(--radius)] border border-[var(--border)]",
        "text-xs font-medium text-[color:var(--text-muted)]",
        "hover:text-[color:var(--text)] hover:bg-[var(--surface-2)]",
        "transition-colors",
        done && "text-[color:var(--emerald-400)] border-[color:var(--emerald-400)]",
        className,
      )}
      onClick={onClick}
    >
      <Icon name={done ? "check" : "copy"} size={13} />
      {done ? copiedLabel : label}
    </button>
  )
}
