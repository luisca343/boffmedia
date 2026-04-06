import * as React from "react"
import { cn } from "@/lib/utils"

const GAP_MAP = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
} as const

const ALIGN_MAP = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const

const JUSTIFY_MAP = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
} as const

export interface StackProps extends React.HTMLAttributes<HTMLElement> {
  direction?: "vertical" | "horizontal"
  gap?: keyof typeof GAP_MAP
  align?: keyof typeof ALIGN_MAP
  justify?: keyof typeof JUSTIFY_MAP
  wrap?: boolean
  as?: React.ElementType
}

const Stack = React.forwardRef<HTMLElement, StackProps>(
  (
    {
      direction = "vertical",
      gap = 4,
      align,
      justify,
      wrap = false,
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
          "flex",
          direction === "vertical" ? "flex-col" : "flex-row",
          GAP_MAP[gap],
          align && ALIGN_MAP[align],
          justify && JUSTIFY_MAP[justify],
          wrap && "flex-wrap",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Stack.displayName = "Stack"

export { Stack }
