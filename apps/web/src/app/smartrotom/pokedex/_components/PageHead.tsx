import type { ComponentType, ReactNode } from "react"

// scr-pagehead — icon eyebrow + display title + description + optional right-aligned meta stats.
export function PageHead({
  icon: Icon,
  eyebrow,
  title,
  desc,
  meta,
}: {
  icon: ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  desc: string
  meta?: ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-6 items-end pb-[1.125rem] border-b border-white/[0.05]">
      <div>
        <div className="font-pk-mono text-[0.65625rem] tracking-[0.12em] uppercase text-pk-surface-500 inline-flex items-center gap-2 mb-1.5">
          <span className="w-[1.375rem] h-[1.375rem] grid place-items-center rounded-md bg-pk-primary-400/[0.12] text-pk-primary-300">
            <Icon className="w-3.5 h-3.5" />
          </span>
          {eyebrow}
        </div>
        <h1 className="font-pk-display font-bold text-[1.75rem] tracking-tight text-pk-surface-50 mb-1.5">{title}</h1>
        <p className="text-pk-surface-400 text-[0.84375rem] leading-[1.55] m-0 max-w-[33.75rem]">{desc}</p>
      </div>
      {meta && <div className="flex flex-col gap-1.5 text-right text-xs text-pk-surface-400">{meta}</div>}
    </div>
  )
}

export function MetaStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span>
      {label}
      <b className="font-pk-display font-bold text-xl text-pk-surface-50 tabular-nums ml-1.5">{value}</b>
    </span>
  )
}
