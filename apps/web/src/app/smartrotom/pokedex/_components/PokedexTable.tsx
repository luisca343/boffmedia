import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives/table"
import { cn } from "@/lib/utils"

interface PokedexTableProps {
  children: React.ReactNode
  className?: string
}

export function PokedexTable({ children, className }: PokedexTableProps) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-white/[0.05] bg-white/[0.012]", className)}>
      <Table className="w-full text-sm border-separate border-spacing-0">
        {children}
      </Table>
    </div>
  )
}

interface PokedexRowProps {
  children: React.ReactNode
  className?: string
}

export function PokedexRow({ children, className }: PokedexRowProps) {
  return (
    <TableRow
      className={cn(
        "transition-colors hover:bg-white/[0.03] border-b border-white/[0.04] last:border-b-0 group",
        className
      )}
    >
      {children}
    </TableRow>
  )
}

interface PokedexHeaderProps {
  children: React.ReactNode
  className?: string
}

export function PokedexHeader({ children, className }: PokedexHeaderProps) {
  return (
    <TableHeader className={cn("sticky top-0 z-10 pointer-events-none", className)}>
      {children}
    </TableHeader>
  )
}

interface PokedexCellProps {
  children?: React.ReactNode
  className?: string
  colSpan?: number
  hard?: boolean
}

export function PokedexCell({ children = '', className = '', colSpan = 1, hard = false }: PokedexCellProps) {
  return (
    <TableCell
      className={cn(
        "py-2.5 px-3 transition-colors",
        hard
          ? "bg-white/[0.025] text-surface-50 font-medium"
          : "text-surface-50",
        "first:pl-4 last:pr-4",
        className
      )}
      colSpan={colSpan}
    >
      {children}
    </TableCell>
  )
}

interface PokedexHeadProps {
  children: React.ReactNode
  className?: string
  colSpan?: number
}

export function PokedexHead({ children, className, colSpan = 1 }: PokedexHeadProps) {
  return (
    <TableHead
      className={cn(
        "text-surface-200 font-jetbrains text-[10px] tracking-[0.08em] uppercase p-3 text-left bg-white/[0.025] border-b border-white/[0.05]",
        "first:pl-4 last:pr-4",
        className
      )}
      colSpan={colSpan}
    >
      {children}
    </TableHead>
  )
}

export default PokedexTable
