"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { Icon } from "./icon"

export interface CodeBlockProps {
  lines: string[] | string
  label?: React.ReactNode
  copyText?: string
  scan?: boolean
  tone?: "accent"
  actions?: React.ReactNode
  className?: string
}

export function CodeBlock({ lines, label, copyText, scan = false, tone, actions, className }: CodeBlockProps) {
  const t = useTranslations("common.primitives")
  const [ok, setOk] = React.useState(false)
  const arr = Array.isArray(lines) ? lines : String(lines || "").split("\n")
  const text = copyText != null ? copyText : arr.join("")
  const copy = () => {
    try {
      navigator.clipboard.writeText(text)
    } catch {
      /* noop */
    }
    setOk(true)
    setTimeout(() => setOk(false), 1600)
  }
  return (
    <div
      className={cn(
        "border border-solid border-line-2 bg-base-deep overflow-hidden",
        "cut-corner [--cut-lg:10px]",
        className,
      )}
    >
      {(label || copyText != null) && (
        <div className="flex items-center gap-2 py-2 px-3 border-b border-solid border-[color-mix(in_srgb,var(--line-2)_60%,transparent)] bg-[color-mix(in_srgb,var(--panel)_40%,transparent)]">
          {label && (
            <span className="inline-flex items-center gap-[6px] font-mono text-[10px] font-semibold leading-none uppercase tracking-[0.12em] text-txt-muted">
              <Icon name="code" size={13} />
              {label}
            </span>
          )}
          <span className="ml-auto" aria-hidden="true" />
          {actions}
          <button
            type="button"
            onClick={copy}
            aria-label={t("copyCode")}
            className={cn(
              "inline-flex items-center gap-[5px] font-mono text-[11px] font-semibold leading-none tracking-[0.04em] cursor-pointer",
              "bg-transparent border border-solid py-[6px] px-[9px] cut [--cut:4px]",
              "transition-[color,border-color] duration-[140ms]",
              ok ? "text-ok border-[color-mix(in_srgb,var(--ok)_50%,transparent)]" : "text-txt-muted border-line-2 hover:text-txt hover:border-txt-muted",
            )}
          >
            <Icon name={ok ? "check" : "copy"} size={14} />
            {ok ? t("copied") : t("copy")}
          </button>
        </div>
      )}
      <div
        className={cn(
          "relative py-4 px-[18px] font-mono text-[18px] font-bold leading-[1.7] tracking-[0.18em] break-all",
          tone === "accent" ? "text-accent-bright" : "text-txt",
        )}
      >
        {scan && (
          <span
            aria-hidden="true"
            className="absolute left-0 right-0 top-0 h-[34px] pointer-events-none [background:linear-gradient(180deg,color-mix(in_srgb,var(--accent)_22%,transparent),transparent)] animate-[bm-scan_1.4s_ease-in-out_infinite] motion-reduce:hidden"
          />
        )}
        {arr.map((l, i) => (
          <div key={i} className="whitespace-pre">
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}
