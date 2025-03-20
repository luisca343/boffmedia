"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

type SliderVariant = "default" | "wingull"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  variant?: SliderVariant;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: {
      track: "bg-surface-800",
      range: "bg-primary-300",
      thumb: "border-primary-300 bg-surface-800 ring-offset-surface-900 focus-visible:ring-primary-300"
    },
    wingull: {
      track: "bg-blue-900",
      range: "bg-blue-400",
      thumb: "border-blue-400 bg-blue-950 ring-offset-blue-950 focus-visible:ring-blue-300"
    }
  }

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className={cn("relative h-2 w-full grow overflow-hidden rounded-full", variantStyles[variant].track)}>
        <SliderPrimitive.Range className={cn("absolute h-full", variantStyles[variant].range)} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={cn(
        "block h-5 w-5 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant].thumb
      )} />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
export type { SliderVariant }