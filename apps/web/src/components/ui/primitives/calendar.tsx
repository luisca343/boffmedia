"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/primitives/button"

export type CalendarVariant = "default" | "wingull"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  variant?: CalendarVariant;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  variant = "default",
  ...props
}: CalendarProps) {
  const variantStyles = {
    default: {
      daySelected: "bg-layer-1 text-ink hover:bg-layer-1 hover:text-ink focus:bg-layer-1 focus:text-ink",
      dayToday: "text-ink",
      headCell: "text-ink rounded-md w-9 font-normal text-[0.8rem]",
      dayOutside: "day-outside text-ink-muted aria-selected:bg-layer-1/50 aria-selected:text-ink-muted",
      dayDisabled: "text-ink-muted opacity-50",
      dayRangeMiddle: "aria-selected:bg-layer-1 aria-selected:text-ink-dim",
      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-layer-1/50 [&:has([aria-selected])]:bg-layer-1 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
      captionLabel: "text-sm font-medium text-ink",
      navButtonColor: "text-ink-dim",
    },
    wingull: {
      daySelected: "bg-secondary-soft text-secondary-active hover:bg-secondary-soft hover:text-secondary-active focus:bg-secondary-soft focus:text-secondary-active",
      dayToday: "bg-secondary-soft text-secondary-active border-2 border-secondary",
      headCell: "text-secondary-active rounded-md w-9 font-medium text-[0.8rem]",
      dayOutside: "day-outside text-secondary-hover aria-selected:bg-secondary-soft/80 aria-selected:text-secondary-hover",
      dayDisabled: "text-secondary-hover opacity-50",
      dayRangeMiddle: "aria-selected:bg-secondary-soft aria-selected:text-secondary-active",
      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-secondary-soft/80 [&:has([aria-selected])]:bg-secondary-soft first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
      captionLabel: "text-sm font-medium text-secondary-active",
      navButtonColor: "text-secondary",
    }
  }

  const selectedVariant = variantStyles[variant];

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: cn(selectedVariant.captionLabel),
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: selectedVariant.headCell,
        row: "flex w-full mt-2",
        cell: selectedVariant.cell,
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: selectedVariant.daySelected,
        day_today: selectedVariant.dayToday,
        day_outside: selectedVariant.dayOutside,
        day_disabled: selectedVariant.dayDisabled,
        day_range_middle: selectedVariant.dayRangeMiddle,
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", selectedVariant.navButtonColor, className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", selectedVariant.navButtonColor, className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }