import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives/table"
import { cn } from "@/lib/utils"

interface PokedexTableProps {
  children: React.ReactNode
  className?: string
}

export function PokedexTable({ children, className }: PokedexTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl shadow-lg my-4">
      <Table className={cn("w-full text-sm border-separate border-spacing-0", className)}>
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
    <TableRow className={cn("transition-all hover:bg-layer-3/50 group", className)}>
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
        "py-1 px-2 transition-colors",
        hard ? "border-edge/50 bg-layer-1 text-ink" : "border-edge/50 text-ink",
        "group-hover:border-edge",
        "first:pl-3 last:pr-3",
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
        "text-ink font-bold p-4 text-left",
        "first:pl-6 last:pr-6",
        className
      )} 
      colSpan={colSpan}
    >
      {children}
    </TableHead>
  )
}

export default PokedexTable