import Link from "next/link"
import { cn } from "@/lib/utils"
import { PulseDot } from "./PulseDot"

export interface CategoryCardData {
  href: string
  art?: string
  name: string
  /** formatted live-viewer count, e.g. "32,4 K" — omit when the API doesn't provide it */
  viewers?: string
  /** live channel count — omit when unavailable */
  streams?: number
}

/** A Mewtwitch category: 2:3 box-art + live viewers + channel count. */
export function CategoryCard({ g, className }: { g: CategoryCardData; className?: string }) {
  return (
    <Link
      href={g.href}
      className={cn("group flex flex-col text-left text-mw-fg transition-transform duration-150 hover:-translate-y-[3px]", className)}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-mw-lg bg-mw-800 border border-mw-line transition-[border-color,box-shadow] duration-150 group-hover:border-mw-accent group-hover:shadow-[0_16px_30px_-16px_rgb(var(--mw-accent)/.35)]">
        {g.art && (
           
          <img src={g.art} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/70 to-transparent to-60%" />
        {g.viewers && (
          <span className="absolute left-2 top-2 z-[2] inline-flex items-center gap-1 rounded-mw-sm border border-mw-line-strong bg-black/70 px-[0.4375rem] py-[3px] font-mono text-[0.6875rem] font-bold text-white">
            <PulseDot /> {g.viewers}
          </span>
        )}
      </div>
      <div className="px-1 pb-1 pt-2.5">
        <h4 className="m-0 line-clamp-2 text-[0.8125rem] font-semibold leading-[1.3]">{g.name}</h4>
        {g.streams != null && <div className="mt-1 text-[0.6875rem] text-mw-fg-faint">{g.streams} canales</div>}
      </div>
    </Link>
  )
}
