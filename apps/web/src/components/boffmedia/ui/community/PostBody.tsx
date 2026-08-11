"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import { CM_NOTE_ICON, CM_NOTE_TONE, type PostBlock } from "./community-util"

// Renders an array of content blocks to «Señal» prose: italic display headings,
// diamond-marked lists, accent-barred quotes, mono code and four-tone callouts.
// Mirrors .cm-prose from comunidad.css.
// [deferred] Rich «MDX» component blocks (recipe/set/team/figure…) are part of
// the separate blog-blocks system and are not rendered here yet.
export function PostBody({ blocks, className }: { blocks?: PostBlock[]; className?: string }) {
  return (
    <div className={cn("max-w-[72ch] [&>*+*:not(h3)]:mt-[18px] [&>h3]:mt-[34px]", className)}>
      {(blocks || []).map((b, i) => {
        if (b.h)
          return (
            <h3 key={i} className="font-display text-[26px]/none font-extrabold italic uppercase">
              {b.h}
            </h3>
          )
        if (b.p)
          return (
            <p key={i} className="text-pretty font-body text-[17px]/[1.7] text-txt">
              {b.p}
            </p>
          )
        if (b.quote)
          return (
            <blockquote
              key={i}
              className="border-l-4 border-solid border-accent bg-accent-soft px-[22px] py-[18px] font-body text-[19px]/[1.5] font-medium italic text-txt [clip-path:polygon(0_0,100%_0,calc(100%_-_12px)_100%,0_100%)]"
            >
              {b.quote}
              {b.cite && (
                <cite className="mt-3 block font-mono text-[11px]/none font-semibold uppercase not-italic tracking-[0.1em] text-accent">
                  {b.cite}
                </cite>
              )}
            </blockquote>
          )
        if (b.list)
          return b.ordered ? (
            <ol key={i} className="grid list-decimal gap-2.5 pl-[26px]">
              {b.list.map((li, j) => (
                <li key={j} className="font-body text-[16px]/[1.6] text-txt">
                  {li}
                </li>
              ))}
            </ol>
          ) : (
            <ul key={i} className="grid list-none gap-2.5">
              {b.list.map((li, j) => (
                <li
                  key={j}
                  className="relative pl-[26px] font-body text-[16px]/[1.6] text-txt before:absolute before:left-1 before:top-[11px] before:h-2 before:w-2 before:bg-accent before:content-[''] before:[clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]"
                >
                  {li}
                </li>
              ))}
            </ul>
          )
        if (b.code)
          return (
            <pre
              key={i}
              className="overflow-x-auto border border-solid border-line-2 border-l-4 border-l-accent bg-base-deep px-5 py-[18px] [clip-path:polygon(0_0,100%_0,100%_100%,12px_100%,0_calc(100%_-_12px))] cut-edge-bl [--cut-e:12px] [--cut-line:var(--line-2)]"
            >
              <code className="whitespace-pre font-mono text-[13px]/[1.7] font-medium tracking-[0.02em] text-txt">{b.code}</code>
            </pre>
          )
        if (b.note) {
          const tone = CM_NOTE_TONE[b.tone || "info"] || CM_NOTE_TONE.info
          return (
            <div
              key={i}
              style={{ "--tone": tone } as React.CSSProperties}
              className="flex items-start gap-[14px] border border-solid border-line-2 border-l-4 border-l-[color:var(--tone)] bg-[color-mix(in_srgb,var(--tone)_9%,var(--panel))] px-[18px] py-4 [clip-path:polygon(0_0,100%_0,calc(100%_-_12px)_100%,0_100%)] cut-edge-slant-r [--cut:12px] [--cut-line:var(--line-2)]"
            >
              <Icon name={CM_NOTE_ICON[b.tone || "info"] || "info"} size={18} className="mt-px flex-none text-[color:var(--tone)]" />
              <div>
                {b.title && (
                  <strong className="mb-1.5 block font-mono text-[12px]/none font-bold uppercase tracking-[0.1em] text-[color:var(--tone)]">
                    {b.title}
                  </strong>
                )}
                <p className="font-body text-[15px]/[1.55] text-txt">{b.note}</p>
              </div>
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
