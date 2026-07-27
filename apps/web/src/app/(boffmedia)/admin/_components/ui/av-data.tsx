"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, Avatar, Badge, IconButton, Spinner, type IconName } from "@/components/boffmedia/primitives"
import { useFormat } from "@/lib/useFormat"
import { AvPill, AvLiveDot } from "./av-kit"

/**
 * Admin data/telemetry layer — the `av-*` control-room table, rows, pipeline,
 * charts, GPU/split/distribution bars from the handoff, ported to Tailwind + v3
 * tokens. The AI-pipeline & training charts are an aspirational board fed by demo
 * data until the ML API lands. [deferred]
 */

/* ---- resource row + actions ------------------------------------------------ */

const AV_ROW =
  "flex items-center gap-[14px] border border-solid border-line border-l-4 border-l-line-2 bg-panel px-[15px] py-3 transition-[border-color,background] duration-[140ms] hover:border-line-2 hover:border-l-accent hover:bg-panel-2 [clip-path:polygon(0_0,100%_0,calc(100%_-_12px)_100%,0_100%)]"

export function AvRow({ off, className, children }: { off?: boolean; className?: string; children: React.ReactNode }) {
  return <div className={cn(AV_ROW, off && "opacity-55 hover:opacity-80", className)}>{children}</div>
}

export function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  const t = useTranslations("data")
  return (
    <div className="flex flex-none items-center gap-1.5">
      <IconButton name="edit" label={t("editLabel")} size={15} className="!h-8 !w-8" onClick={onEdit} />
      <IconButton name="trash" label={t("deleteLabel")} size={15} className="!h-8 !w-8" onClick={onDelete} />
    </div>
  )
}

export function AvResourceRow({
  icon,
  title,
  sub,
  actions,
  off,
}: {
  icon: IconName
  title: React.ReactNode
  sub: React.ReactNode
  actions?: React.ReactNode
  off?: boolean
}) {
  return (
    <AvRow off={off}>
      <span className="grid h-10 w-10 flex-none place-items-center border border-solid border-accent-line bg-accent-soft text-accent cut [--cut:8px]">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-[9px] font-display text-[16px]/[1.1] font-bold uppercase">{title}</div>
        <div className="mt-1 font-mono text-[11px]/[1.3] font-medium tracking-[0.03em] text-txt-muted">{sub}</div>
      </div>
      {actions && <div className="flex flex-none items-center gap-1.5">{actions}</div>}
    </AvRow>
  )
}

/* ---- member row (moderation) ---------------------------------------------- */

export type AvMemberStatus = "active" | "muted" | "banned"
export interface AvMember {
  id: number | string
  name: string
  handle: string
  role: string
  roleTone?: "accent" | "info"
  games: string
  joined: string
  status: AvMemberStatus
  points: number
}

const AV_MEMBER_STATUS: Record<AvMemberStatus, { key: string; tone: "green" | "amber" | "rose" }> = {
  active: { key: "statusActive", tone: "green" },
  muted: { key: "statusMuted", tone: "amber" },
  banned: { key: "statusBanned", tone: "rose" },
}

export function MemberRow({
  member,
  onView,
  onMute,
  onBan,
}: {
  member: AvMember
  onView?: () => void
  onMute?: () => void
  onBan?: () => void
}) {
  const t = useTranslations("data")
  const st = AV_MEMBER_STATUS[member.status]
  const initials = member.name.split(" ").map((w) => w[0]).slice(0, 2).join("")
  return (
    <AvRow off={member.status === "banned"}>
      <Avatar accent={member.role === "Moderador"}>{initials}</Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-[9px] font-display text-[15px]/[1.1] font-bold uppercase">
          {member.name}
          <Badge tone={member.role === "Moderador" ? "new" : member.roleTone === "info" ? "info" : "default"}>{member.role}</Badge>
          <AvPill tone={st.tone}>
            {member.status === "active" && <AvLiveDot />}
            {t(st.key)}
          </AvPill>
        </div>
        <div className="mt-1 font-mono text-[11px]/[1.3] font-medium tracking-[0.03em] text-txt-muted">
          @{member.handle} · {member.games} · {t("from")} {member.joined} · {member.points.toLocaleString()} pts
        </div>
      </div>
      <div className="flex flex-none items-center gap-1.5">
        <IconButton name="eye" label={t("viewProfile")} size={15} className="!h-8 !w-8" onClick={onView} />
        {member.status !== "banned" && <IconButton name="minus" label={t("muteLabel")} size={15} className="!h-8 !w-8" onClick={onMute} />}
        <IconButton name="shield" label={t("banLabel")} size={15} className="!h-8 !w-8" onClick={onBan} />
      </div>
    </AvRow>
  )
}

/* ---- sortable data grid ---------------------------------------------------- */

export interface AvColumn<T> {
  key: string
  label: React.ReactNode
  align?: "right"
  name?: boolean
  sortable?: boolean
  sortValue?: (row: T) => number | string
}

export function AvDataGrid<T extends Record<string, React.ReactNode> & { id?: number | string }>({
  columns,
  rows,
  initialSort,
}: {
  columns: AvColumn<T>[]
  rows: T[]
  initialSort?: { key: string; dir: 1 | -1 }
}) {
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(initialSort || null)
  const toggle = (c: AvColumn<T>) =>
    setSort((s) => (s && s.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))
  let view = rows
  if (sort) {
    const col = columns.find((c) => c.key === sort.key)
    const val = (r: T) => (col && col.sortValue ? col.sortValue(r) : (r[sort.key] as unknown as string | number))
    view = [...rows].sort((a, b) => {
      const x = val(a)
      const y = val(b)
      const nx = parseFloat(String(x).replace(/[^\d.-]/g, ""))
      const ny = parseFloat(String(y).replace(/[^\d.-]/g, ""))
      if (!isNaN(nx) && !isNaN(ny)) return (nx - ny) * sort.dir
      return String(x).localeCompare(String(y)) * sort.dir
    })
  }
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse border border-solid border-line bg-panel">
        <thead>
          <tr>
            {columns.map((c) => {
              const sorted = sort?.key === c.key
              return (
                <th
                  key={c.key}
                  aria-sort={sorted ? (sort!.dir === 1 ? "ascending" : "descending") : undefined}
                  className={cn(
                    "border-b-2 border-solid border-line-2 bg-panel-2 px-4 py-3 text-left font-mono text-[10px]/none font-semibold uppercase tracking-[0.14em] text-txt-muted",
                    c.align === "right" && "text-right",
                  )}
                >
                  {c.sortable ? (
                    <button type="button" onClick={() => toggle(c)} className="inline-flex items-center gap-1.5 uppercase tracking-[inherit] hover:text-txt">
                      {c.label}
                      <Icon name="chevron" size={13} className={cn(sorted ? "text-accent" : "text-txt-dim", sorted && sort!.dir === -1 && "[transform:scaleY(-1)]")} />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {view.map((r, i) => (
            <tr key={r.id != null ? r.id : i} className="transition-[background] duration-[140ms] hover:bg-panel-2">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "border-b border-solid border-line px-4 py-3 text-[15px] [tr:last-child_&]:border-b-0",
                    c.align === "right" && "text-right font-mono text-[13px]/none",
                  )}
                >
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---- pipeline -------------------------------------------------------------- */

export type AvPipeState = "done" | "active" | "pending"
export interface AvPipeStage {
  key: string
  name: React.ReactNode
  icon: IconName
  meta: React.ReactNode
  state: AvPipeState
}

export function AvPipeline({ stages, active, onNav }: { stages: AvPipeStage[]; active?: string; onNav?: (key: string) => void }) {
  const t = useTranslations("data")
  return (
    <div className="mb-[18px] flex items-stretch gap-0 overflow-x-auto border border-solid border-line bg-panel p-[5px]">
      {stages.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => onNav?.(s.key)}
          className={cn(
            "relative flex min-w-[118px] flex-1 flex-col gap-[7px] px-3 pb-[11px] pt-3 text-left transition-[background] duration-[140ms] hover:bg-panel-2",
            active === s.key && "bg-accent-soft",
            "[&:not(:last-child)]:after:absolute [&:not(:last-child)]:after:right-0 [&:not(:last-child)]:after:top-1/2 [&:not(:last-child)]:after:h-[34px] [&:not(:last-child)]:after:w-px [&:not(:last-child)]:after:-translate-y-1/2 [&:not(:last-child)]:after:bg-line [&:not(:last-child)]:after:content-['']",
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-[1.5px] border-solid",
                s.state === "done"
                  ? "border-[color:color-mix(in_srgb,var(--ok)_50%,transparent)] bg-ok-soft text-ok"
                  : s.state === "active"
                    ? "border-accent-line bg-accent-soft text-accent"
                    : "border-line-2 bg-panel-2 text-txt-dim",
              )}
            >
              {s.state === "done" ? <Icon name="check" size={12} /> : s.state === "active" ? <Spinner size={11} /> : <Icon name={s.icon} size={11} />}
            </span>
            <span className="font-display text-[13px]/none font-bold uppercase tracking-[0.03em]">{s.name}</span>
          </div>
          <span className="font-mono text-[10px]/none font-medium text-txt-dim">{s.meta}</span>
          <span className={cn("font-mono text-[8.5px]/none font-bold uppercase tracking-[0.1em]", s.state === "done" ? "text-ok" : s.state === "active" ? "text-accent" : "text-txt-dim")}>
            {s.state === "done" ? t("pipelineReady") : s.state === "active" ? t("pipelineActive") : t("pipelineQueued")}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ---- charts + bars --------------------------------------------------------- */

export interface AvChartLine {
  values: number[]
  color?: string
  width?: number
  dashed?: boolean
}
export interface AvLegendItem {
  label: React.ReactNode
  color?: string
  dash?: boolean
}
export interface AvDistRow {
  label: React.ReactNode
  value: number
  display?: string
  color?: string
}

export function AvLegend({ items }: { items: AvLegendItem[] }) {
  return (
    <div className="flex flex-wrap gap-[14px]">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[11px]/none font-medium text-txt-muted">
          <span className={cn("inline-block w-[14px] border-t-[2.5px]", it.dash ? "border-dashed" : "border-solid")} style={{ borderTopColor: it.color || "var(--accent)" }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

function MiniTrend({
  lines = [],
  baseline,
  height = 150,
  pad = 8,
  yPad = 0.08,
  yMin,
  yMax,
}: {
  lines?: AvChartLine[]
  baseline?: number
  height?: number
  pad?: number
  yPad?: number
  yMin?: number
  yMax?: number
}) {
  const [el, setEl] = React.useState<HTMLDivElement | null>(null)
  const [w, setW] = React.useState(0)
  React.useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver((es) => setW(es[0].contentRect.width))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [el])
  const all = lines.flatMap((l) => l.values).concat(baseline != null ? [baseline] : [])
  const hasData = all.length > 0 && w > 0
  let lo = yMin != null ? yMin : Math.min(...all)
  let hi = yMax != null ? yMax : Math.max(...all)
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const span = hi - lo || 1
  lo -= span * yPad
  hi += span * yPad
  const innerW = Math.max(1, w - pad * 2)
  const innerH = height - pad * 2
  const xAt = (i: number, n: number) => pad + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const yAt = (v: number) => pad + innerH - ((v - lo) / (hi - lo)) * innerH
  return (
    <div ref={setEl} className="relative w-full" style={{ height }}>
      {hasData && (
        <svg width={w} height={height} className="block">
          {baseline != null && <line x1={pad} x2={w - pad} y1={yAt(baseline)} y2={yAt(baseline)} className="[stroke:var(--line-2)]" strokeWidth={1} strokeDasharray="3 4" />}
          {lines.map((l, li) => {
            const n = l.values.length
            if (!n) return null
            const d = l.values.map((v, i) => (i ? "L" : "M") + xAt(i, n).toFixed(1) + " " + yAt(v).toFixed(1)).join(" ")
            return <path key={li} d={d} fill="none" stroke={l.color || "var(--accent)"} strokeWidth={l.width || 2} strokeDasharray={l.dashed ? "5 4" : undefined} strokeLinejoin="round" strokeLinecap="round" />
          })}
        </svg>
      )}
    </div>
  )
}

export function AvChartFrame({
  lines,
  baseline,
  height = 168,
  yMin,
  yMax,
  yFmt = (v) => String(v),
  xLabels = [],
  ticks = 3,
}: {
  lines: AvChartLine[]
  baseline?: number
  height?: number
  yMin?: number
  yMax?: number
  yFmt?: (v: number) => React.ReactNode
  xLabels?: React.ReactNode[]
  ticks?: number
}) {
  const all = lines.flatMap((l) => l.values).concat(baseline != null ? [baseline] : [])
  let lo = yMin != null ? yMin : Math.min(...all)
  let hi = yMax != null ? yMax : Math.max(...all)
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const yticks = Array.from({ length: ticks }, (_, i) => hi - (i / (ticks - 1)) * (hi - lo))
  return (
    <div>
      <div className="flex items-end">
        <div className="flex flex-none flex-col justify-between pr-2 pt-0.5 text-right font-mono text-[9.5px]/none font-medium text-txt-dim" style={{ height }}>
          {yticks.map((v, i) => (
            <span key={i}>{yFmt(v)}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <MiniTrend lines={lines} baseline={baseline} height={height} yMin={yMin} yMax={yMax} yPad={0.06} />
        </div>
      </div>
      {xLabels.length > 0 && (
        <div className="flex justify-between pl-[2.4rem] pt-1.5 font-mono text-[9.5px]/none font-medium text-txt-dim">
          {xLabels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export function AvSplitBar({ win = 0, loss = 0, draw = 0, showRate = true, height = 8 }: { win?: number; loss?: number; draw?: number; showRate?: boolean; height?: number }) {
  const total = win + loss + draw || 1
  const decided = win + loss
  const wr = decided ? Math.round((win / decided) * 100) : null
  return (
    <div className="flex w-full items-center gap-2.5">
      <div className="flex flex-1 overflow-hidden border border-solid border-line bg-panel-2" style={{ height }}>
        {win > 0 && <span className="bg-ok" style={{ width: (win / total) * 100 + "%" }} />}
        {draw > 0 && <span className="bg-[color:var(--dim)]" style={{ width: (draw / total) * 100 + "%" }} />}
        {loss > 0 && <span className="bg-bad" style={{ width: (loss / total) * 100 + "%" }} />}
      </div>
      {showRate && <span className={cn("flex-none font-mono text-[11px]/none font-bold", wr != null && wr >= 50 ? "text-ok" : wr != null ? "text-bad" : "")}>{wr != null ? wr + "%" : "—"}</span>}
    </div>
  )
}

export function AvGpuBar({ name, pct, temp }: { name: React.ReactNode; pct: number; temp?: number }) {
  return (
    <div className="flex items-center gap-[11px] py-[7px] [&:not(:last-child)]:border-b [&:not(:last-child)]:border-solid [&:not(:last-child)]:border-line">
      <span className="w-[78px] flex-none font-mono text-[11px]/none font-semibold">{name}</span>
      <span className="h-[7px] flex-1 overflow-hidden border border-solid border-line bg-panel-2">
        <span className="block h-full bg-[linear-gradient(90deg,var(--accent),var(--accent-bright))] transition-[width] duration-[400ms]" style={{ width: pct + "%" }} />
      </span>
      <span className="w-10 flex-none text-right font-mono text-[11px]/none font-medium text-txt-muted">{pct}%</span>
      {temp != null && <span className="w-[42px] flex-none text-right font-mono text-[10px]/none font-medium text-txt-dim">{temp}°C</span>}
    </div>
  )
}

export function AvDist({ rows, max }: { rows: AvDistRow[]; max?: number }) {
  const { number: formatNumber } = useFormat()
  const peak = max || Math.max(...rows.map((r) => r.value))
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[132px_1fr_78px] items-center gap-[11px] max-[520px]:grid-cols-[92px_1fr_62px]">
          <span className="truncate font-body text-[13px]/[1.1] font-semibold">{r.label}</span>
          <span className="h-[9px] overflow-hidden border border-solid border-line bg-panel-2">
            <span className="block h-full" style={{ width: (r.value / peak) * 100 + "%", background: r.color || "var(--accent)" }} />
          </span>
          <span className="text-right font-mono text-[11px]/none font-medium text-txt-muted">{r.display || formatNumber(r.value)}</span>
        </div>
      ))}
    </div>
  )
}
