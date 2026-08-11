"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"

// copy `text` to the clipboard with confirmation.
export function CopyButton({
  text,
  label,
  copiedLabel,
}: {
  text: string | (() => string)
  label: string
  copiedLabel: string
}) {
  const [ok, setOk] = React.useState(false)
  const click = () => {
    try {
      navigator.clipboard.writeText(typeof text === "function" ? text() : text)
    } catch {
      /* noop */
    }
    setOk(true)
    setTimeout(() => setOk(false), 1600)
  }
  return (
    <button
      type="button"
      onClick={click}
      className={cn(
        "cut-tag cut-tag-edge [--cut-tag:6px] inline-flex items-center gap-[7px] border border-solid bg-panel px-[10px] py-[6px] font-mono text-[10px]/none font-semibold uppercase tracking-[0.1em]",
        "transition-[color,border-color] duration-[140ms]",
        ok
          ? "border-ok [--cut-line:var(--ok)] text-ok"
          : "border-line-2 [--cut-line:var(--line-2)] text-txt-muted hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:text-accent-bright",
      )}
    >
      <Icon name={ok ? "check" : "copy"} size={12} />
      {ok ? copiedLabel : label}
    </button>
  )
}
