import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"

export function DkEmpty({
  icon,
  title,
  lead,
  children,
  className,
}: {
  icon?: IconName
  title: React.ReactNode
  lead?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid justify-items-center gap-2 border border-dashed border-line-2 px-5 py-[46px] text-center text-txt-dim", className)}>
      {icon && <Icon name={icon} size={26} className="text-txt-dim" />}
      <b className="font-display text-[16px] font-bold uppercase leading-[1.1] tracking-[0.04em] text-txt-muted">{title}</b>
      {lead && <p className="m-0 max-w-[46ch] font-body text-[12.5px] leading-[1.5]">{lead}</p>}
      {children && <div className="mt-1 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}

const SKEL_CUT = "polygon(0 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%)"
const SKEL_CLS = cn(
  "block w-full border border-solid border-line",
  "[background:linear-gradient(100deg,var(--panel)_40%,var(--panel-2)_50%,var(--panel)_60%)] [background-size:200%_100%]",
  "animate-[bm-shimmer_1.15s_linear_infinite] motion-reduce:animate-none",
)

/** Single shimmer block. */
export function DkSkel({ h = 62, className, style }: { h?: number | string; className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden="true" style={{ height: h, clipPath: SKEL_CUT, ...style }} className={cn(SKEL_CLS, className)} />
}

export function DkSkelList({ rows = 6, h = 62, gap = 7, className }: { rows?: number; h?: number; gap?: number; className?: string }) {
  return (
    <div className="grid" style={{ gap }}>
      {Array.from({ length: rows }).map((_, i) => (
        <span key={i} aria-hidden="true" style={{ height: h, clipPath: SKEL_CUT }} className={cn(SKEL_CLS, className)} />
      ))}
    </div>
  )
}
