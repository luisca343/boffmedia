import type { ReactNode } from "react"

// The register. Every list in a government is a table, and every table here is this one:
// mono uppercase headers over a strong rule, hairline rows, hover tint.
// Row padding follows `--gt-row-py`, which `data-density` on the scope root swaps.

export function Table({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`gt-scroll w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-[0.8125rem]">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

export function TH({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`whitespace-nowrap border-b border-gt-line-strong px-3.5 py-[0.5625rem] text-left font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-gt-ink-400 ${className}`}
    >
      {children}
    </th>
  )
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TR({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-gt-line-soft transition-colors last:border-b-0 hover:bg-gt-paper-1 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </tr>
  )
}

export function TD({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <td
      className={`px-3.5 align-middle text-gt-ink-700 ${className}`}
      style={{ paddingTop: "var(--gt-row-py)", paddingBottom: "var(--gt-row-py)" }}
    >
      {children}
    </td>
  )
}
