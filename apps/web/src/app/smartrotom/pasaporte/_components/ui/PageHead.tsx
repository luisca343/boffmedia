// PAPER. The chapter's letterhead.

import { cn } from "@/lib/utils"

/**
 * Mono eyebrow inked in the chapter's deep ink, with the hairline that runs out of it and
 * fades; the Marcellus title; the foil rule under both. The accent comes from
 * `--ps-chapter` on the page root, so this never knows which chapter it is in.
 */
export function PageHead({
  eyebrow,
  title,
  accent,
  className,
}: {
  eyebrow: string
  title: string
  /** Trailing words of the title, struck in the chapter's ink. */
  accent?: string
  className?: string
}) {
  return (
    <div className={cn("mb-3.5", className)}>
      <div className="flex items-center gap-2 font-ps-mono text-[0.65625rem] uppercase tracking-[.32em] text-ps-chapter-deep">
        <span>{eyebrow}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-ps-chapter to-transparent" />
      </div>
      <h2 className="mt-[0.3125rem] font-ps-ceremony text-[clamp(1.375rem,3.2vh,2.125rem)] font-normal leading-[1.05] tracking-[.01em] text-ps-ink">
        {title}
        {accent && <span className="text-ps-chapter-deep"> {accent}</span>}
      </h2>
      <div className="mt-2.5 h-[3px] rounded-sm bg-[linear-gradient(90deg,rgb(var(--ps-chapter)),rgb(var(--ps-chapter)/.3)_70%,transparent)]" />
    </div>
  )
}
