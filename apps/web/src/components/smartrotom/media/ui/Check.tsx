import { cn } from "@/lib/utils"
import { I } from "./icons"

/** Verified badge — accent circle + white check (accent is per-app). */
export function Check({ size = "sm", className }: { size?: "sm" | "lg"; className?: string }) {
  const px = size === "lg" ? 18 : 14
  return (
    <span
      className={cn("inline-flex flex-none items-center justify-center rounded-full bg-mw-accent text-white", className)}
      style={{ width: px, height: px }}
    >
      <I.check size={size === "lg" ? 12 : 10} />
    </span>
  )
}
