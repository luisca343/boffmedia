"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"
import { authorHue, timeAgo, type CmAuthor, type CmTone } from "./community-util"

// The shared authorship atoms of Blog + Foro: the tinted broadcast initial
// (CmAvatar), the byline (avatar + linked name + meta) and the #tag pills.
// Mirrors cm-ava / cm-byline / cm-tags from comunidad.css.

export function CmAvatar({
  author,
  hue,
  letter,
  size,
}: {
  author?: { avatar?: string; avatarUrl?: string | null; tone?: CmTone; name?: string } | null
  hue?: number
  letter?: string
  size?: number
}) {
  const h = hue != null ? hue : authorHue(author)
  const ch = letter || (author ? author.avatar : "?")
  const px = size ?? 34
  return (
    <span
      style={{ "--h": h, width: size, height: size, fontSize: size ? size * 0.44 : undefined } as React.CSSProperties}
      className="relative inline-grid h-[34px] w-[34px] flex-none place-items-center border border-solid border-[color-mix(in_srgb,hsl(var(--h)_70%_50%)_40%,var(--line-2))] bg-[color-mix(in_srgb,hsl(var(--h)_70%_50%)_16%,var(--panel-2))] font-display text-[15px]/none font-extrabold italic text-[hsl(var(--h)_78%_62%)] cut-seal cut-seal-edge [--cut-line:color-mix(in_srgb,hsl(var(--h)_70%_50%)_40%,var(--line-2))] [--cut:8px]"
    >
      {author?.avatarUrl ? (
        <ArtImage src={author.avatarUrl} alt={author.name ?? ""} width={px} height={px} className="h-full w-full" fallback={<span>{ch}</span>} />
      ) : (
        ch
      )}
    </span>
  )
}

export function Byline({
  author,
  when,
  sub,
  onOpen,
  link = true,
  size,
  now,
}: {
  author?: CmAuthor | null
  when?: string
  sub?: string
  onOpen?: (href: string) => void
  link?: boolean
  size?: number
  // Reference «now» for the relative timestamp. Undefined keeps the frozen
  // showcase CM_NOW default (see timeAgo); real pages pass a live Date.
  now?: Date
}) {
  if (!author) return null
  const clickName = (e: React.MouseEvent) => {
    if (onOpen && link) {
      e.preventDefault()
      e.stopPropagation()
      onOpen("/blog/autor/" + author.handle)
    }
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <CmAvatar author={author} size={size} />
      <span className="grid min-w-0">
        <span className="truncate font-display text-[13px]/[1.1] font-bold uppercase tracking-[0.03em]">
          {link ? (
            <a href={"#/blog/autor/" + author.handle} onClick={clickName} className="no-underline hover:text-accent-bright">
              {author.name}
            </a>
          ) : (
            author.name
          )}
        </span>
        <span className="mt-[3px] font-mono text-[10px]/[1.2] font-medium uppercase tracking-[0.08em] text-txt-muted">
          {sub || (when ? timeAgo(when, now) : author.role)}
        </span>
      </span>
    </span>
  )
}

export function CmTags({
  tags,
  onOpen,
  base = "/blog?tag=",
  max,
}: {
  tags?: string[]
  onOpen?: (href: string) => void
  base?: string
  max?: number
}) {
  if (!tags || !tags.length) return null
  const shown = max ? tags.slice(0, max) : tags
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {shown.map((t) => (
        <a
          key={t}
          href={"#" + base + t}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onOpen && onOpen(base + t)
          }}
          className={cn(
            "border border-solid border-line-2 bg-panel px-2 py-[5px] font-mono text-[10px]/none font-semibold uppercase tracking-[0.06em] text-txt-muted no-underline transition-[color,border-color] duration-[140ms] cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:5px]",
            "hover:border-accent-line hover:text-accent-bright",
          )}
        >
          <span className="text-txt-dim">#</span>
          {t}
        </a>
      ))}
    </span>
  )
}
