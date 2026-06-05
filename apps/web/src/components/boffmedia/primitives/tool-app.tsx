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
    <div className={cn("flex flex-col h-[calc(100dvh-68px)] min-h-[520px] mt-[68px] overflow-hidden bg-[var(--bg)]", bare && "", className)}>
      {toolbar && <div className="shrink-0 border-b-[var(--hairline)] border-b-solid border-b-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] backdrop-blur-[8px]">{toolbar}</div>}
      {subbar && <div className="shrink-0 border-b-[var(--hairline)] border-b-solid border-b-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_55%,transparent)]">{subbar}</div>}
      <div className="flex-1 min-h-0 flex">{children}</div>
    </div>
  )
}
