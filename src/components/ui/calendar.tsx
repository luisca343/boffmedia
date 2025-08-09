"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

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
      daySelected: "bg-surface-900 text-surface-100 hover:bg-surface-900 hover:text-surface-50 focus:bg-surface-900 focus:text-surface-50",
      dayToday: "text-surface-100",
      headCell: "text-surface-300 rounded-md w-9 font-normal text-[0.8rem]",
      dayOutside: "day-outside text-surface-500 aria-selected:bg-surface-100/50 aria-selected:text-surface-500",
      dayDisabled: "text-surface-500 opacity-50",
      dayRangeMiddle: "aria-selected:bg-surface-100 aria-selected:text-surface-900",
      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-surface-100/50 [&:has([aria-selected])]:bg-surface-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
      captionLabel: "text-sm font-medium text-surface-300",
      navButtonColor: "text-surface-600",
    },
    wingull: {
      daySelected: "bg-secondary-100 text-secondary-800 hover:bg-secondary-200 hover:text-secondary-900 focus:bg-secondary-100 focus:text-secondary-800",
      dayToday: "bg-secondary-50 text-secondary-900 border-2 border-secondary-400",
      headCell: "text-secondary-700 rounded-md w-9 font-medium text-[0.8rem]",
      dayOutside: "day-outside text-secondary-300 aria-selected:bg-secondary-50/80 aria-selected:text-secondary-400",
      dayDisabled: "text-secondary-200 opacity-50",
      dayRangeMiddle: "aria-selected:bg-secondary-50 aria-selected:text-secondary-800",
      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-secondary-50/80 [&:has([aria-selected])]:bg-secondary-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
      captionLabel: "text-sm font-medium text-secondary-700",
      navButtonColor: "text-secondary-500",
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