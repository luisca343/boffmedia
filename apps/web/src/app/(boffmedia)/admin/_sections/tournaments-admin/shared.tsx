import { cn } from "@/lib/utils"
import { AvSectionHead } from "../../_components/ui/av-kit"

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
  return <AvSectionHead title={title} desc={sub} />
}
