import * as React from "react"
import { cn } from "@/lib/utils"

const COLS_MAP = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  12: "grid-cols-12",
} as const

const COLS_MD_MAP = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  12: "md:grid-cols-12",
} as const

const COLS_LG_MAP = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  12: "lg:grid-cols-12",
} as const

const GAP_MAP = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
} as const

type ColsValue = keyof typeof COLS_MAP
type GapValue = keyof typeof GAP_MAP

export interface GridProps extends React.HTMLAttributes<HTMLElement> {
  cols?: ColsValue
  colsMd?: ColsValue
  colsLg?: ColsValue
  gap?: GapValue
  as?: React.ElementType
}

const Grid = React.forwardRef<HTMLElement, GridProps>(
  (
    {
      cols = 1,
      colsMd,
      colsLg,
      gap = 6,
      as: Comp = "div",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Comp
        ref={ref}
        className={cn(
          "grid",
          COLS_MAP[cols],
          colsMd && COLS_MD_MAP[colsMd],
          colsLg && COLS_LG_MAP[colsLg],
          GAP_MAP[gap],
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Grid.displayName = "Grid"

export { Grid }
export type { ColsValue, GapValue }
