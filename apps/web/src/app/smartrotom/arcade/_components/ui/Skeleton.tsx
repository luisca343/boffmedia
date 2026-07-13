import { cn } from "@/lib/utils"

export interface SkeletonProps {
  className?: string
}

/** Loading placeholder. `.ar-skeleton` carries the sweep and honours motion-off. */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden className={cn("ar-skeleton motion-reduce:animate-none", className)} />
}
