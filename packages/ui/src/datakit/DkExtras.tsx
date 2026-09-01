"use client"

import * as React from "react"
import { useNsT } from "../i18n"
import { cn } from "../cn"
import { Icon } from "../primitives"
import { DkFlag } from "./DkFlag"

// Datakit extras: round stepper, country multi-filter and the toast hook.
// Mirrors dk-steps / dk-cf / dk-toast in datakit.css.

export interface DkStep {
  value: string
  label: React.ReactNode
  status?: "done" | "live" | "pending"
}
export function DkStepper({ steps, value, onChange }: { steps: DkStep[]; value: string; onChange: (v: string) => void }) {
  const t = useNsT("common.dkExtras")
  return (
    <div className="flex gap-1 overflow-x-auto p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label={t("roundsAria")}>
      {steps.map((s) => {
        const on = value === s.value
        const st = s.status || "pending"
        return (
          <button
            key={s.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(s.value)}
            className={cn(
              "inline-flex flex-none items-center gap-1.5 border border-solid bg-base px-2.5 py-[7px] font-mono text-[10px]/none font-semibold uppercase tracking-[0.08em] transition-[color,border-color,background] duration-[140ms] cut-tag cut-tag-edge [--cut-tag:6px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-line",
              on ? "border-accent [--cut-line:var(--accent)] bg-accent text-accent-ink" : st === "live" ? "border-[color-mix(in_srgb,var(--ok)_40%,transparent)] [--cut-line:color-mix(in_srgb,var(--ok)_40%,transparent)] text-ok hover:border-line-2 hover:[--cut-line:var(--line-2)] hover:text-txt" : st === "done" ? "border-line text-txt-muted hover:border-line-2 hover:[--cut-line:var(--line-2)] hover:text-txt" : "border-line text-txt-dim hover:border-line-2 hover:[--cut-line:var(--line-2)] hover:text-txt",
            )}
          >
            {st === "live" && <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full bg-current animate-[dk-pulse_1.4s_ease-in-out_infinite] motion-reduce:animate-none", on && "text-accent-ink")} />}
            {s.label}
          </button>
        )
      })}
    </div>
  )
}

export interface DkCountryOption {
  code: string
  flag?: string
  name: string
  n: number
}
export function DkCountryFilter({ options, value, onChange, resultCount, noun }: { options: DkCountryOption[]; value: string[]; onChange: (v: string[]) => void; resultCount?: number; noun?: string }) {
  const t = useNsT("common.dkExtras")
  const [open, setOpen] = React.useState(false)
  const [pq, setPq] = React.useState("")
  const ref = React.useRef<HTMLDivElement>(null)
  const sel = value || []
  const selSet = React.useMemo(() => new Set(sel), [sel])
  const byCode = React.useMemo(() => new Map(options.map((c) => [c.code, c])), [options])
  React.useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])
  const toggle = (code: string) => onChange(selSet.has(code) ? sel.filter((c) => c !== code) : sel.concat([code]))
  const clear = () => onChange([])
  const filtered = React.useMemo(() => {
    const t = pq.trim().toLowerCase()
    return t ? options.filter((c) => c.name.toLowerCase().includes(t) || c.code.toLowerCase().includes(t)) : options
  }, [options, pq])
  const label = sel.length === 0 ? t("allCountries") : sel.length === 1 ? byCode.get(sel[0])?.name || sel[0] : t("countriesCount", { count: sel.length })

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-2.5">
      <div className="relative">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="dialog" className={cn("inline-flex items-center gap-2 border border-solid border-line-2 bg-base px-[11px] py-2 font-mono text-[11px]/none font-semibold tracking-[0.05em] transition-[color,border-color] duration-[140ms] cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:7px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-line", sel.length ? "border-accent-line [--cut-line:var(--accent-line)] text-accent-bright" : "text-txt-muted")}>
          <Icon name="globe" size={14} />
          <span>{label}</span>
          {sel.length > 1 && <span className="bg-accent-soft px-[5px] py-0.5 text-[9px] text-accent-bright">{sel.length}</span>}
          <Icon name="chevron" size={13} className={cn("transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div role="dialog" aria-label={t("filterByCountry")} className="absolute left-0 top-[calc(100%_+_6px)] z-[60] w-[min(430px,86vw)] border border-solid border-line-2 bg-panel [box-shadow:0_18px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 border-b border-solid border-line px-3 py-2.5 text-txt-dim">
              <Icon name="search" size={14} />
              <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder={t("searchCountryPh")} autoFocus className="min-w-0 flex-1 border-0 bg-transparent font-body text-[12px]/none text-txt outline-none" />
            </div>
            <div className="flex items-center justify-between border-b border-solid border-line px-3 py-2 font-mono text-[9px]/none font-semibold uppercase tracking-[0.12em] text-txt-dim">
              <span>{sel.length ? t("selectedCount", { count: sel.length }) : t("allCountries")}</span>
              {sel.length > 0 && (
                <button type="button" onClick={clear} className="border-0 bg-transparent font-mono text-[9px]/none font-semibold uppercase tracking-[0.12em] text-accent-bright">
                  {t("clear")}
                </button>
              )}
            </div>
            <div className="grid max-h-[280px] grid-cols-2 gap-0.5 overflow-y-auto p-1.5">
              {filtered.map((c) => {
                const on = selSet.has(c.code)
                return (
                  <button key={c.code} type="button" onClick={() => toggle(c.code)} aria-pressed={on} className={cn("flex min-w-0 items-center gap-2 border-0 bg-transparent px-2 py-[7px] text-left font-body text-[12px]/[1.2] text-txt focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-line", on ? "bg-accent-soft" : "hover:bg-panel-2")}>
                    <span className={cn("grid h-[15px] w-[15px] flex-none place-items-center border border-solid text-accent-bright", on ? "border-accent bg-accent-soft" : "border-line-2")}>{on ? <Icon name="check" size={11} /> : null}</span>
                    <DkFlag flag={c.flag} code={c.code} name={c.name} size={14} />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="font-mono text-[10px]/none text-txt-dim">{c.n}</span>
                  </button>
                )
              })}
              {filtered.length === 0 && <span className="col-span-2 p-3.5 font-mono text-[12px]/[1.4] text-txt-dim">{t("noMatchesFor", { query: pq })}</span>}
            </div>
          </div>
        )}
      </div>

      {sel.length > 0 && (
        <div className="flex flex-wrap items-center gap-[5px]">
          {sel.map((code) => {
            const c = byCode.get(code)
            return (
              <button key={code} type="button" onClick={() => toggle(code)} title={t("removeCountry", { name: c ? c.name : code })} className="inline-flex items-center gap-[5px] border border-solid border-accent-line bg-accent-soft px-2 py-[5px] font-mono text-[10px]/none font-semibold text-accent-bright cut cut-edge-slant [--cut-line:var(--accent-line)] [--cut:2px]">
                <DkFlag flag={c?.flag} code={code} name={c?.name || code} size={12} />
                <span>{code}</span>
                <Icon name="x" size={10} />
              </button>
            )
          })}
          <button type="button" onClick={clear} className="border-0 bg-transparent p-[5px] font-mono text-[10px]/none font-semibold uppercase tracking-[0.08em] text-txt-dim hover:text-txt">
            {t("clear")}
          </button>
        </div>
      )}

      {sel.length > 0 && resultCount != null && (
        <span className="font-mono text-[11px]/none text-txt-dim [&_b]:text-txt">
          <b>{resultCount}</b> {noun ?? t("defaultNoun")}
        </span>
      )}
    </div>
  )
}

export function useDkToast(): [React.ReactNode, (msg: React.ReactNode) => void] {
  const [msg, setMsg] = React.useState<React.ReactNode>(null)
  const tm = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(() => () => void (tm.current && clearTimeout(tm.current)), [])
  const show = (m: React.ReactNode) => {
    setMsg(m)
    if (tm.current) clearTimeout(tm.current)
    tm.current = setTimeout(() => setMsg(null), 2400)
  }
  const node = msg ? (
    <div role="status" className="fixed bottom-7 left-1/2 z-[200] inline-flex -translate-x-1/2 items-center gap-[9px] whitespace-nowrap border border-solid border-line-2 bg-base-deep px-4 py-[11px] font-mono text-[12px]/[1.3] font-medium text-txt [box-shadow:0_18px_50px_rgba(0,0,0,0.5)] cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:9px] animate-[dk-toastin_0.2s_cubic-bezier(0.2,0.7,0.3,1)] motion-reduce:animate-none">
      <Icon name="info" size={14} className="text-accent-bright" />
      {msg}
    </div>
  ) : null
  return [node, show]
}
