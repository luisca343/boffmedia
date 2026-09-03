"use client"

import * as React from "react"
import { Icon } from "@boffmedia/ui"
import { toast } from "@boffmedia/ui"

export interface SrtSeedTagProps {
  seed: string
  copyLabel: string
  copiedLabel: string
  seedLabel: string
}

export function SrtSeedTag({ seed, copyLabel, copiedLabel, seedLabel }: SrtSeedTagProps) {
  const [ok, setOk] = React.useState(false)

  const copy = () => {
    try {
      navigator.clipboard?.writeText(seed).then(
        () => {
          setOk(true)
          setTimeout(() => setOk(false), 1400)
        },
        () => {
          toast({ title: "toastCopyFailed", tone: "bad" })
        }
      )
    } catch {
      toast({ title: "toastCopyFailed", tone: "bad" })
    }
  }

  return (
    <span className="inline-flex items-center gap-[0.5625rem] border border-line-2 bg-panel-2 px-[0.6875rem] py-[0.4375rem] font-mono text-[0.6875rem] font-medium tracking-[0.04em] text-txt-muted">
      <Icon name="lock" size={13} className="flex-none text-signal" />
      {seedLabel} <code className="font-semibold text-accent">#{seed}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={copyLabel}
        className="ml-1 inline-flex items-center gap-[0.3125rem] border-0 bg-transparent p-0 text-txt-dim transition-colors hover:text-accent"
      >
        <Icon name={ok ? "check" : "copy"} size={12} />
        {ok ? copiedLabel : copyLabel}
      </button>
    </span>
  )
}
