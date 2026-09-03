import Link from "next/link"
import { cn } from "@/lib/utils"
import { Avatar } from "./Avatar"
import { Check } from "./Check"
import { I } from "./icons"

export interface VideoCardData {
  href: string
  thumb?: string
  title: string
  duration?: string
  /** 0..1 — renders the "continue watching" progress bar when present */
  progress?: number
  creator: string
  creatorAvatar?: string
  verified?: boolean
  views: string
  age: string
}

/** A single Mewtube video: 16:9 thumb + duration + progress + creator meta. */
export function VideoCard({ v, className }: { v: VideoCardData; className?: string }) {
  return (
    <Link
      href={v.href}
      className={cn(
        "group flex flex-col rounded-mw-xl text-left text-mw-fg transition-transform duration-150 hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden rounded-mw-xl bg-mw-800 border border-[color-mix(in_srgb,rgb(var(--mw-accent))_22%,var(--mw-hairline))] transition-[box-shadow,border-color] duration-150 group-hover:border-[color-mix(in_srgb,rgb(var(--mw-accent))_40%,transparent)] group-hover:shadow-[0_14px_30px_-14px_rgb(var(--mw-accent)/.35)]">
        {v.thumb && (
           
          <img
            src={v.thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[6s] ease-out group-hover:scale-[1.04]"
          />
        )}
        {v.duration && (
          <span className="absolute bottom-2 right-2 z-[2] rounded-mw-sm bg-black/85 px-1.5 py-[3px] font-mono text-[0.6875rem] font-bold text-white">
            {v.duration}
          </span>
        )}
        {v.progress != null && (
          <span className="absolute inset-x-0 bottom-0 z-[2] block h-[3px] bg-black/50">
            <span
              className="block h-full bg-mw-accent shadow-[0_0_8px_rgb(var(--mw-accent)/.35)]"
              style={{ width: `${Math.round(v.progress * 100)}%` }}
            />
          </span>
        )}
        <span className="absolute inset-0 z-[1] flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent to-40% opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <span className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-mw-accent text-white shadow-[0_8px_24px_rgb(var(--mw-accent)/.35)] transition-transform group-hover:scale-100">
            <I.play size={18} />
          </span>
        </span>
      </div>
      <div className="flex gap-2.5 px-1 pb-1 pt-3">
        <Avatar src={v.creatorAvatar} name={v.creator} size={36} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="m-0 line-clamp-2 text-sm font-semibold leading-[1.35] [text-wrap:pretty] group-hover:text-mw-accent" title={v.title}>
            {v.title}
          </h3>
          <div className="inline-flex items-center gap-1 text-xs text-mw-fg-mute">
            {v.creator}
            {v.verified && <Check />}
          </div>
          <div className="flex gap-1 text-xs text-mw-fg-faint">
            <span>{v.views} visitas</span>
            <span>·</span>
            <span>{v.age}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
