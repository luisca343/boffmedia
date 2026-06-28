"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type TableVariant = "default" | "wingull"

const TableVariantContext = React.createContext<TableVariant>("default")

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  variant?: TableVariant;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-layer-2",
      wingull: "border-0"
    }

    return (
      <TableVariantContext.Provider value={variant}>
        <div className={cn("relative w-full overflow-auto rounded-lg", variantStyles[variant])}>
          <table
            ref={ref}
            className={cn("w-full caption-bottom text-sm", className)}
            {...props}
          />
        </div>
      </TableVariantContext.Provider>
    )
  }
)
Table.displayName = "Table"

const useTableVariant = () => React.useContext(TableVariantContext)

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const variant = useTableVariant()

  const variantStyles = {
    default: "border-edge/60 bg-base/70",
    wingull: "border-secondary-active bg-secondary-soft"
  }

  return (
    <thead
      ref={ref}
      className={cn(
        "[&_tr]:border-b",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const variant = useTableVariant()

  const variantStyles = {
    default: "bg-layer-2",
    wingull: "bg-white"
  }

  return (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", variantStyles[variant], className)}
      {...props}
    />
  )
})
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const variant = useTableVariant()

  const variantStyles = {
    default: "border-edge bg-layer-3/50",
    wingull: "border-secondary bg-secondary-soft"
  }

  return (
    <tfoot
      ref={ref}
      className={cn(
        "border-t font-medium [&>tr]:last:border-b-0",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => {
  const variant = useTableVariant()

  const variantStyles = {
    default: "border-edge/50 hover:bg-primary/[0.05] data-[state=selected]:bg-primary/10 transition-colors duration-150",
    wingull: "border-secondary hover:bg-secondary-soft data-[state=selected]:bg-secondary-soft"
  }

  return (
    <tr
      ref={ref}
      className={cn(
        "border-b",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const variant = useTableVariant()

  const variantStyles = {
    default: "text-primary-hover text-[11px] uppercase tracking-wider font-bold",
    wingull: "text-white font-semibold text-xs uppercase tracking-wider"
  }

  return (
    <th
      ref={ref}
      className={cn(
        "h-11 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const variant = useTableVariant()

  const variantStyles = {
    default: "text-ink",
    wingull: "text-secondary-active"
  }

  return (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => {
  const variant = useTableVariant()

  const variantStyles = {
    default: "text-ink-muted",
    wingull: "text-secondary"
  }

  return (
    <caption
      ref={ref}
      className={cn(
        "mt-4 text-sm",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
export type { TableVariant }
