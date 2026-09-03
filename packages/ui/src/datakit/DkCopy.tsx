"use client"

import * as React from "react"
import { cn } from "../cn"
import { Icon } from "../primitives"

/** Copy `text` to the clipboard with confirmation. */
export function DkCopy({ text, label, copiedLabel }: { text: string | (() => string); label: string; copiedLabel: string }) {
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
        "cut-tag cut-tag-edge [--cut-tag:6px] inline-flex items-center gap-[0.4375rem] border border-solid bg-panel px-[0.625rem] py-[0.375rem] font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.1em]",
        "transition-[color,border-color] duration-[140ms]",
        ok ? "border-ok [--cut-line:var(--ok)] text-ok" : "border-line-2 [--cut-line:var(--line-2)] text-txt-muted hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:text-accent-bright",
      )}
    >
      <Icon name={ok ? "check" : "copy"} size={12} />
      {ok ? copiedLabel : label}
    </button>
  )
}
