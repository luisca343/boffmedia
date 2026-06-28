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
        "inline-flex items-center gap-[0.35rem] px-[0.6rem] py-[0.3rem]",
        "rounded-[var(--radius)] [border-width:var(--hairline)] border-solid [border-color:var(--border-strong)]",
        "bg-layer-2 text-[11px] font-semibold text-ink-muted",
        "hover:text-ink hover:border-secondary",
        "transition-[color,border-color] duration-[var(--dur)] ease-[var(--ease)]",
        done && "text-[var(--emerald-400)] border-[color-mix(in_srgb,var(--emerald-400)_40%,transparent)]",
        className,
      )}
      onClick={onClick}
    >
      <Icon name={done ? "check" : "copy"} size={13} />
      {done ? copiedLabel : label}
    </button>
  )
}
