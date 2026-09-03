"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { TnCompetitor } from "./tournaments-util"

const CUT_POD = "cut-corner cut-corner-edge [--cut-lg:14px]"
// The place badge is a filled slab when first, a bordered one otherwise — the
// stroke colour follows in the branch that sets the border.
const CUT_PLACE = "cut-corner cut-corner-edge [--cut-lg:6px]"

function PodiumAvatar({ c, size }: { c: TnCompetitor; size: number }) {
  const ini = (c.name || "?").trim()[0]?.toUpperCase() || "?"
  return (
    <span
      className="grid flex-none place-items-center overflow-hidden border border-solid border-line-2 bg-panel-2 font-display font-extrabold uppercase text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: c.avatar ? undefined : `hsl(${c.hue ?? 210} 42% 34%)`,
      }}
    >
      {c.avatar ? (
        <img src={c.avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        ini
      )}
    </span>
  )
}

/** Top-3 podium (2 · 1 · 3 visual order) for a completed tournament. */
export function TnPodium({ podium }: { podium: TnCompetitor[] }) {
  const top = podium.slice(0, 3)
  if (top.length === 0) return null
  const order = [top[1], top[0], top[2]].filter(Boolean) as TnCompetitor[]
  return (
    <div className="mx-auto grid w-full max-w-[47.5rem] grid-cols-3 items-end gap-4 max-[720px]:max-w-[23.75rem] max-[720px]:grid-cols-1">
      {order.map((c) => {
        const place = top.indexOf(c) + 1
        const first = place === 1
        return (
          <div
            key={c.id}
            className={cn(
              "relative flex flex-col items-center px-4 pb-[1.125rem] pt-[2.875rem] text-center",
              "border border-solid bg-panel",
              first
                ? "border-accent-line [--cut-line:var(--accent-line)] bg-[linear-gradient(to_bottom,var(--accent-soft),var(--panel)_60%)] pt-[3.375rem]"
                : "border-line [--cut-line:var(--line)]",
              CUT_POD,
              "max-[720px]:flex-row max-[720px]:items-center max-[720px]:gap-[0.875rem] max-[720px]:p-4 max-[720px]:text-left",
            )}
          >
            <span
              className={cn(
                "absolute left-1/2 top-3 grid h-[2.125rem] w-[2.125rem] -translate-x-1/2 place-items-center font-display text-[1.125rem]/none font-extrabold italic",
                first ? "bg-accent text-accent-ink [--cut-line:var(--accent)]" : "border border-solid border-line-2 [--cut-line:var(--line-2)] bg-panel-2 text-txt",
                CUT_PLACE,
                "max-[720px]:static max-[720px]:translate-x-0",
              )}
            >
              {place}
            </span>
            <span className={cn("mb-3 max-[720px]:mb-0", first ? "" : "")}>
              <PodiumAvatar c={c} size={first ? 74 : 60} />
            </span>
            <span className="font-display text-[1.1875rem]/[1.05] font-bold uppercase">{c.name}</span>
            {c.flag && <span className="mt-1 text-[0.9375rem]">{c.flag}</span>}
          </div>
        )
      })}
    </div>
  )
}
