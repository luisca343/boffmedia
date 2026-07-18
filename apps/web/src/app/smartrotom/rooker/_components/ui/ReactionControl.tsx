"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { ActionBtn } from "./ActionBtn"
import { ReactionGlyph } from "./ReactionGlyph"
import {
  REACTIONS,
  REACTION_BY_TYPE,
  totalReactions,
  type ReactionCounts,
  type ReactionType,
} from "../../_utils/reactions"
import { useDisplayStore } from "../../_stores/displayStore"

/**
 * The like button, and the five-reaction tray behind it.
 *
 * The design rule: a plain tap always works. Clicking the button reacts with ❤ (or
 * removes whatever you already left), exactly as a like does on Twitter — so the
 * common case is one tap and nothing new to learn. Hovering opens the tray, where the
 * four Pixelmon reactions live. Readers who set *Reacciones → Solo me gusta* in
 * Pantalla never see the tray at all, and the control degrades into a like button.
 *
 * The tray must survive the gap between the button and itself, so closing is deferred
 * on a timer that re-entering cancels — without it the tray snaps shut as the pointer
 * travels the 6px to reach it.
 */
export interface ReactionControlProps {
  reactions: ReactionCounts
  mine: ReactionType | null
  onReact: (type: ReactionType) => void
}

export function ReactionControl({ reactions, mine, onReact }: ReactionControlProps) {
  const t = useTranslations("rooker")
  const expressive = useDisplayStore((s) => s.reactions) === "expresivas"
  const [tray, setTray] = useState(false)
  const [burst, setBurst] = useState<ReactionType | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
      if (burstTimer.current) clearTimeout(burstTimer.current)
    },
    [],
  )

  const fire = (type: ReactionType) => {
    onReact(type)
    setBurst(type)
    if (burstTimer.current) clearTimeout(burstTimer.current)
    burstTimer.current = setTimeout(() => setBurst(null), 650)
    setTray(false)
  }

  const open = () => {
    if (!expressive) return
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setTray(true)
  }
  const close = () => {
    closeTimer.current = setTimeout(() => setTray(false), 180)
  }

  const total = totalReactions(reactions)
  const active = REACTIONS.find((r) => r.type === mine) ?? null

  return (
    <div className="relative inline-flex" onMouseEnter={open} onMouseLeave={close}>
      <ActionBtn
        label={active ? t("reactions.remove", { reaction: t(`reactions.${active.type}`) }) : t("reactions.heart")}
        tone="heart"
        active={Boolean(mine)}
        fillActive={false}
        count={total}
        onClick={() => fire(mine ?? "heart")}
        icon={
          <span className="relative grid place-items-center">
            <ReactionGlyph type={mine ?? "heart"} size={18} active={Boolean(mine)} />
            {burst && (
              <span className="pointer-events-none absolute inset-0 grid animate-rk-fly place-items-center motion-reduce:animate-none">
                <ReactionGlyph type={burst} size={18} active />
              </span>
            )}
          </span>
        }
      />

      {expressive && tray && (
        <div
          role="menu"
          aria-label={t("reactions.trayLabel")}
          onMouseEnter={open}
          onMouseLeave={close}
          className={cn(
            "absolute bottom-[calc(100%_+_6px)] left-[-8px] z-40 flex animate-rk-pop gap-0.5 rounded-rk-pill",
            "border border-rk-line-strong bg-rk-elevated/95 px-2 py-1.5 shadow-[0_12px_30px_-8px_rgb(0_0_0/.7)]",
            "backdrop-blur-md motion-reduce:animate-none",
          )}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              role="menuitem"
              title={t(`reactions.${r.type}`)}
              aria-label={t(`reactions.${r.type}`)}
              aria-pressed={mine === r.type}
              onClick={(e) => {
                e.stopPropagation()
                fire(r.type)
              }}
              className={cn(
                "grid place-items-center rounded-full p-1.5 transition-transform duration-100",
                "hover:-translate-y-0.5 hover:scale-[1.35] motion-reduce:hover:transform-none",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-rk-accent",
                mine === r.type && REACTION_BY_TYPE[r.type].wash,
              )}
            >
              <ReactionGlyph type={r.type} size={24} active />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
