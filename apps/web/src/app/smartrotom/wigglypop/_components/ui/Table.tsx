import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

/** The list table — Seguimiento and Mis anuncios. Rows tint pink on hover. */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn("w-full border-collapse", className)}>{children}</table>
}

export function TH({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b-wp border-wp-line/24 px-3 py-2.5 text-left",
        "font-wp text-[0.6875rem] font-black uppercase tracking-[.07em] text-wp-fg-subtle",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TR({
  className,
  children,
  onClick,
}: {
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "[&>td]:border-b [&>td]:border-wp-line/24 hover:[&>td]:bg-wp-panel-2",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  )
}

export function TD({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-3 py-3 font-wp text-[0.84375rem] font-bold text-wp-fg", className)}
      {...props}
    >
      {children}
    </td>
  )
}
