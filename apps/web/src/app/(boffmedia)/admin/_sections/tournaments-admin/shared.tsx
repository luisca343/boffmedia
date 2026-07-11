import { cn } from "@/lib/utils"

export function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: string
}) {
  return (
    <div className="cut border border-solid border-line bg-base px-3 py-2 [--cut:5px]">
      <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-txt-dim">{label}</div>
      <div className={cn("truncate font-display text-[19px] font-bold not-italic leading-tight", tone ?? "text-txt")}>
        {value}
      </div>
    </div>
  )
}

export function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="grid gap-0.5">
      <h2 className="font-display text-[20px] font-bold uppercase not-italic tracking-[0.02em]">{title}</h2>
      {sub && <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-txt-dim">{sub}</p>}
    </div>
  )
}
