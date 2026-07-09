"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/boffmedia/primitives/badge"
import { Icon, type IconName } from "@/components/boffmedia/primitives/icon"
import { Byline } from "./CmAvatar"
import { timeAgo, type BlogCategoryLike, type BlogPostLike } from "./community-util"

// Reading-time chip shared by every card variant (mirrors .bl-read).
function BlRead({ mins }: { mins: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px]/none font-medium uppercase tracking-[0.08em] text-txt-dim">
      <Icon name="clock" size={13} className="text-txt-muted" />
      {mins} min
    </span>
  )
}

// The piece that populates the Blog. One component, four skins:
//   feature (cover + image-slot), grid, row (horizontal list) and mini (sidebar).
// The accent rail + glyph are tinted with the post's category hue. Mirrors
// .bl-feature / .bl-card / .bl-row / .bl-mini from comunidad.css.
// [deferred] The <image-slot> drop-zone from the handoff isn't wired locally, so
// the media panel shows the tinted glyph until an image-upload flow exists.
export function PostCard({
  post,
  variant = "grid",
  onOpen,
}: {
  post: BlogPostLike
  variant?: "grid" | "feature" | "row" | "mini"
  onOpen?: (href: string) => void
}) {
  const open = () => onOpen && onOpen("/blog/" + post.slug)
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") open()
  }
  const label = post.categoryLabel || "Blog"
  const style = { "--phue": post.hue } as React.CSSProperties
  const glyph = "text-[hsl(var(--phue)_74%_62%)] opacity-90"

  if (variant === "feature") {
    return (
      <div
        style={style}
        onClick={open}
        onKeyDown={onKey}
        role="button"
        tabIndex={0}
        className="grid cursor-pointer grid-cols-[1.05fr_1fr] items-stretch overflow-hidden border border-solid border-line border-l-4 border-l-[hsl(var(--phue)_72%_55%)] bg-panel text-left transition-[border-color,background,transform] duration-[140ms] cut-corner hover:-translate-y-[2px] hover:border-accent-line hover:border-l-accent"
      >
        <div className="relative min-h-[320px] overflow-hidden bg-panel-2">
          <div aria-hidden className="absolute inset-0 z-0 [background:radial-gradient(120%_90%_at_20%_10%,color-mix(in_srgb,hsl(var(--phue)_72%_45%)_30%,transparent),transparent_60%)]" />
          <Icon name={post.icon} size={168} className={cn("absolute -bottom-[14px] -right-[14px] z-[1]", glyph)} />
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[2] opacity-50 mix-blend-multiply [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.14)_0_1px,transparent_1px_3px)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[2] opacity-20 [background-image:radial-gradient(var(--line-2)_1px,transparent_1px)] [background-size:22px_22px]" />
        </div>
        <div className="flex flex-col gap-[14px] px-8 py-[30px]">
          <div className="flex items-center gap-2.5">
            <Badge tone="new">{label}</Badge>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-txt-muted">Destacado</span>
          </div>
          <h2 className="text-[clamp(28px,3vw,40px)]">{post.title}</h2>
          <p className="text-pretty text-[16px]/[1.6] text-txt-muted">{post.excerpt}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <Byline author={post.author} when={post.publishedAt} onOpen={onOpen} />
            <BlRead mins={post.readMins} />
          </div>
        </div>
      </div>
    )
  }

  if (variant === "row") {
    return (
      <div
        style={style}
        onClick={open}
        onKeyDown={onKey}
        role="button"
        tabIndex={0}
        className="grid min-w-0 cursor-pointer grid-cols-[116px_1fr] items-stretch overflow-hidden border border-solid border-line border-l-4 border-l-[hsl(var(--phue)_72%_55%)] bg-panel text-left transition-[border-color,background] duration-[140ms] [clip-path:polygon(0_0,100%_0,calc(100%_-_14px)_100%,0_100%)] hover:border-accent-line hover:border-l-accent hover:bg-panel-2"
      >
        <div className="relative grid place-items-center overflow-hidden bg-panel-2">
          <div aria-hidden className="absolute inset-0 [background:radial-gradient(120%_120%_at_50%_0%,color-mix(in_srgb,hsl(var(--phue)_72%_45%)_26%,transparent),transparent_65%)]" />
          <Icon name={post.icon} size={44} className={cn("relative", glyph)} />
        </div>
        <div className="flex min-w-0 flex-col gap-[7px] px-[18px] py-[15px]">
          <span>
            <Badge tone="new">{label}</Badge>
          </span>
          <h3 className="font-display text-[18px]/[1.15] font-bold uppercase not-italic">{post.title}</h3>
          <p className="line-clamp-2 text-[14px]/[1.5] text-txt-muted">{post.excerpt}</p>
          <div className="mt-[3px] flex items-center justify-between gap-2.5">
            <Byline author={post.author} when={post.publishedAt} onOpen={onOpen} size={26} />
            <BlRead mins={post.readMins} />
          </div>
        </div>
      </div>
    )
  }

  if (variant === "mini") {
    return (
      <div
        style={style}
        onClick={open}
        onKeyDown={onKey}
        role="button"
        tabIndex={0}
        className="group flex cursor-pointer items-center gap-3 border-b border-solid border-line px-1 py-2.5 last:border-b-0"
      >
        <span className="grid h-[38px] w-[38px] flex-none place-items-center border border-solid border-line-2 bg-[color-mix(in_srgb,hsl(var(--phue)_70%_50%)_12%,var(--panel-2))] text-[hsl(var(--phue)_74%_62%)] cut-seal [--cut:8px]">
          <Icon name={post.icon} size={19} />
        </span>
        <div>
          <p className="line-clamp-2 font-body text-[14px]/[1.25] font-semibold text-txt group-hover:text-accent-bright">{post.title}</p>
          <div className="mt-[5px] font-mono text-[9px]/none font-medium uppercase tracking-[0.08em] text-txt-dim">
            {label} · <TimeAgoText when={post.publishedAt} />
          </div>
        </div>
      </div>
    )
  }

  // grid (default)
  return (
    <div
      style={style}
      onClick={open}
      onKeyDown={onKey}
      role="button"
      tabIndex={0}
      className="flex min-w-0 cursor-pointer flex-col overflow-hidden border border-solid border-line border-t-4 border-t-[hsl(var(--phue)_72%_55%)] bg-panel text-left transition-[border-color,transform] duration-[140ms] cut-corner hover:-translate-y-[3px] hover:border-accent-line"
    >
      <div className="relative grid h-[132px] place-items-center overflow-hidden bg-panel-2">
        <div aria-hidden className="absolute inset-0 [background:radial-gradient(120%_100%_at_80%_0%,color-mix(in_srgb,hsl(var(--phue)_72%_45%)_24%,transparent),transparent_62%)]" />
        <Icon name={post.icon} size={54} className={cn("relative", glyph)} />
        <span className="absolute left-2.5 top-2.5 z-[2]">
          <Badge tone="new">{label}</Badge>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-[18px] pb-2 pt-4">
        <h3 className="font-display text-[19px]/[1.12] font-bold uppercase not-italic tracking-[0.01em]">{post.title}</h3>
        <p className="line-clamp-3 text-[14px]/[1.55] text-txt-muted">{post.excerpt}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2.5 border-t border-solid border-line px-[18px] pb-4 pt-3">
        <Byline author={post.author} when={post.publishedAt} onOpen={onOpen} size={26} />
        <BlRead mins={post.readMins} />
      </div>
    </div>
  )
}

// tiny helper so the mini meta can show a relative time without a full Byline
function TimeAgoText({ when }: { when: string }) {
  return <>{timeAgo(when)}</>
}

// The category filter chip used by the Blog toolbar (mirrors .bl-catchip).
export function BlogCatChip({
  cat,
  active,
  onClick,
}: {
  cat: BlogCategoryLike | { label: string; icon: IconName; hue: number }
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ "--phue": cat.hue } as React.CSSProperties}
      className={cn(
        "inline-flex items-center gap-2 border border-solid px-[14px] py-[9px] font-mono text-[11px]/none font-semibold uppercase tracking-[0.08em] transition-[color,border-color,background] duration-[140ms] cut-tag",
        active
          ? "border-[color-mix(in_srgb,hsl(var(--phue)_72%_55%)_55%,var(--line-2))] bg-[color-mix(in_srgb,hsl(var(--phue)_72%_50%)_14%,var(--panel))] text-txt"
          : "border-line-2 bg-panel text-txt-muted hover:bg-panel-2 hover:text-txt",
      )}
    >
      <Icon name={cat.icon} size={14} className="text-[hsl(var(--phue)_72%_62%)]" />
      {cat.label}
    </button>
  )
}
