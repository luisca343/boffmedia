import { cn } from "@/lib/utils"

interface ToolAppProps {
  toolbar?: React.ReactNode
  subbar?: React.ReactNode
  className?: string
  bare?: boolean
  children?: React.ReactNode
}

export function ToolApp({ toolbar, subbar, children, className, bare }: ToolAppProps) {
  return (
    <div className={cn("flex flex-col overflow-hidden", bare && "", className)}>
      {toolbar && <div className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_60%,transparent)]">{toolbar}</div>}
      {subbar && <div className="shrink-0 px-4 py-1.5 border-b border-[var(--border)] bg-[var(--surface-2)] text-xs text-[color:var(--text-dim)]">{subbar}</div>}
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  )
}
