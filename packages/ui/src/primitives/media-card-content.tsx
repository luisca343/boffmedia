import type { ReactNode } from "react"

export interface MediaCardContentProps {
  label: string
  showLabel?: boolean
  /** Host-rendered image, artwork or fallback; contains no interactive controls. */
  children: ReactNode
}

/** Square artwork and a compact, equal-height two-line caption.
 * Reuse inside cards, drag overlays and insertion previews. */
export function MediaCardContent({ label, showLabel = true, children }: MediaCardContentProps) {
  return <>
    <span className="relative block aspect-square w-full overflow-hidden bg-base-2">{children}</span>
    {showLabel && <span data-media-card-caption className="flex h-7 items-center justify-center px-1 text-center font-body text-xs leading-3 text-txt" title={label}>
      <span className="line-clamp-2 break-words">{label}</span>
    </span>}
  </>
}
