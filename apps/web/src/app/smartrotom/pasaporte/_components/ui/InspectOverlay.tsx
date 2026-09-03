// DESK. The scanner's light, cast over the whole counter.

import { cn } from "@/lib/utils"

/**
 * The teal grid and the travelling scan bar of an inspection. Fixed and inert — it never
 * takes a click.
 *
 * The beam loops forever, so it is tagged `ps-loop`: `data-motion="off"` on the app root
 * parks it for readers who want the book still, and `motion-reduce` covers the OS setting.
 */
export function InspectOverlay({ show }: { show: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-[60] overflow-hidden transition-opacity duration-300",
        show ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="ps-grid-glow absolute inset-0" />
      <div className="ps-beam ps-loop absolute left-0 right-0 h-[11.25rem] animate-ps-scan motion-reduce:animate-none" />
    </div>
  )
}
