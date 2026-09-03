"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { useFormat } from "@boffmedia/ui/useFormat"
import { Avatar } from "./Avatar"
import { Check } from "./Check"
import { LivePill } from "./LivePill"
import { PulseDot } from "./PulseDot"
import { Tag } from "./Tag"

export interface StreamCardData {
  href: string
  thumb?: string
  title: string
  streamer: string
  streamerAvatar?: string
  verified?: boolean
  game: string
  /** live viewer count */
  viewers: number
  tags?: string[]
}

/** A single Mewtwitch live stream: preview + live pill + viewers pulse + tags. */
export function StreamCard({ s, className }: { s: StreamCardData; className?: string }) {
  const { number } = useFormat()
  return (
    <Link
      href={s.href}
      className={cn(
        "group flex flex-col rounded-mw-xl text-left text-mw-fg transition-transform duration-150 hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden rounded-mw-xl bg-mw-800 border border-[color-mix(in_srgb,rgb(var(--mw-accent))_28%,var(--mw-hairline))] transition-[box-shadow,border-color] duration-150 group-hover:border-[color-mix(in_srgb,rgb(var(--mw-accent))_50%,transparent)] group-hover:shadow-[0_16px_30px_-16px_rgb(var(--mw-accent)/.35)]">
        {s.thumb && (
           
          <img src={s.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/65 to-transparent to-50%" />
        <LivePill className="absolute left-2.5 top-2.5 shadow-[0_4px_14px_rgb(var(--mw-accent)/.35)]" />
        <span className="absolute bottom-2.5 left-2.5 z-[2] inline-flex items-center gap-1.5 rounded-mw-sm border border-mw-line-strong bg-black/75 px-2 py-[3px] font-mono text-[0.6875rem] font-bold text-white">
          <PulseDot /> {number(s.viewers)}
        </span>
      </div>
      <div className="flex gap-2.5 px-1 pb-1 pt-3">
        <Avatar src={s.streamerAvatar} name={s.streamer} size={36} ring />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <h3 className="m-0 line-clamp-2 text-sm font-semibold leading-[1.3] group-hover:text-mw-accent" title={s.title}>
            {s.title}
          </h3>
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-mw-fg">
            {s.streamer}
            {s.verified && <Check />}
          </div>
          <div className="text-xs text-mw-accent">{s.game}</div>
          {s.tags && s.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {s.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
