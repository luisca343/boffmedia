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
      daySelected: "bg-blue-700 text-blue-50 hover:bg-blue-600 hover:text-blue-50 focus:bg-blue-700 focus:text-blue-50",
      dayToday: "bg-blue-100 text-blue-900",
      headCell: "text-blue-500 rounded-md w-9 font-normal text-[0.8rem]",
      dayOutside: "day-outside text-blue-400 aria-selected:bg-blue-100/50 aria-selected:text-blue-500",
      dayDisabled: "text-blue-400 opacity-50",
      dayRangeMiddle: "aria-selected:bg-blue-100 aria-selected:text-blue-900",
      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-blue-100/50 [&:has([aria-selected])]:bg-blue-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
      captionLabel: "text-sm font-medium text-blue-300",
      navButtonColor: "text-blue-500",
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