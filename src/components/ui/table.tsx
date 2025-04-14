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
      default: "bg-surface-800",
      wingull: "border-0"
    }
    
    return (
      <TableVariantContext.Provider value={variant}>
        <div className={cn("relative w-full overflow-auto rounded-md", variantStyles[variant])}>
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
    default: "border-surface-700 bg-surface-900",
    wingull: "border-blue-900 bg-blue-950"
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
    default: "bg-surface-700",
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
    default: "border-surface-700 bg-surface-700/50",
    wingull: "border-blue-200 bg-blue-50"
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
    default: "border-surface-700 hover:bg-surface-700/50 data-[state=selected]:bg-surface-700",
    wingull: "border-blue-100 data-[state=selected]:bg-blue-100"
  }
  
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors",
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
    default: "text-primary-300",
    wingull: "text-white font-semibold"
  }
  
  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0",
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
    default: "text-primary-400",
    wingull: "text-blue-950"
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
    default: "text-surface-400",
    wingull: "text-blue-500"
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