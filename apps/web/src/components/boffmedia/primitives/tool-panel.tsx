import { cn } from "@/lib/utils"

interface ToolPanelProps {
  title?: React.ReactNode
  meta?: React.ReactNode
  headRight?: React.ReactNode
  head?: React.ReactNode
  className?: string
  bodyClass?: string
  bodyStyle?: React.CSSProperties
  noBody?: boolean
  style?: React.CSSProperties
  children?: React.ReactNode
}

export function ToolPanel({
  title, meta, headRight, head,
  className, bodyClass, bodyStyle, noBody, style, children,
}: ToolPanelProps) {
  const showHead = head || title || meta != null || headRight
  return (
    <div className={cn("rounded-[var(--radius-lg)] border border-edge bg-[var(--card-bg)]", className)} style={style}>
      {showHead && (head || (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-edge">
          <span className="font-display font-bold uppercase tracking-wider text-sm">{title}</span>
          {headRight || (meta != null && <span className="font-mono text-xs text-ink-dim">{meta}</span>)}
        </div>
      ))}
      {noBody ? children : <div className={cn("p-4", bodyClass)} style={bodyStyle}>{children}</div>}
    </div>
  )
}
