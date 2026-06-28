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
      track: "bg-layer-3/80",
      range: "bg-gradient-to-r from-primary-active to-primary-hover",
      thumb: "border-2 border-primary bg-layer-1 ring-offset-layer-1 focus-visible:ring-primary hover:[box-shadow:0_0_10px_2px_rgb(var(--primary-500)/0.45)] hover:scale-110 cursor-grab active:cursor-grabbing active:scale-95"
    },
    wingull: {
      track: "bg-secondary-soft",
      range: "bg-gradient-to-r from-secondary to-secondary-hover",
      thumb: "border-2 border-secondary bg-secondary-soft ring-offset-secondary-soft focus-visible:ring-secondary hover:scale-110 cursor-grab active:cursor-grabbing"
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
      <SliderPrimitive.Track className={cn("relative h-1.5 w-full grow overflow-hidden rounded-full", variantStyles[variant].track)}>
        <SliderPrimitive.Range className={cn("absolute h-full", variantStyles[variant].range)} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={cn(
        "block h-4 w-4 rounded-full border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant].thumb
      )} />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
export type { SliderVariant }
