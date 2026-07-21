"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { ChatMessage, I, PulseDot } from "@/components/smartrotom/media/ui"
import { compactCount } from "../../_utils/twitch"
import { useTwitchChat } from "../../_hooks/useTwitchChat"

export function ChatPanel({ channel, viewers }: { channel: string; viewers?: number }) {
  const t = useTranslations("twitch")
  const { messages, status } = useTwitchChat(channel)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, paused])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setPaused(!atBottom)
  }

  return (
    <div className="flex h-[540px] flex-col border-t border-mw-line bg-[color-mix(in_srgb,rgb(var(--mw-accent))_6%,rgb(var(--mw-bg)))] lg:h-full lg:border-l lg:border-t-0">
      <div className="flex items-center justify-between border-b border-[color-mix(in_srgb,rgb(var(--mw-accent))_32%,var(--mw-hairline))] bg-[color-mix(in_srgb,rgb(var(--mw-accent))_14%,rgb(var(--mw-bg)))] px-4 py-3.5">
        <strong className="font-mw-display text-sm font-bold tracking-[0.02em]">{t("chat.title")}</strong>
        <div className="inline-flex items-center gap-2.5 text-[11px] text-mw-fg-mute">
          {viewers != null && (
            <span className="inline-flex items-center gap-1.5 font-mono">
              <PulseDot /> {compactCount(viewers)} {t("chat.watching")}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-0 border-b border-mw-line bg-mw-bg px-2.5 py-1.5">
        <button type="button" className="rounded-md bg-mw-800 px-3 py-1.5 text-xs font-semibold text-white">{t("chat.tabChat")}</button>
        <button type="button" className="rounded-md px-3 py-1.5 text-xs font-semibold text-mw-fg-mute hover:text-mw-fg" aria-disabled title={t("common.comingSoon")}>
          {t("chat.tabSubOnly")}
        </button>
        <button type="button" className="rounded-md px-3 py-1.5 text-xs font-semibold text-mw-fg-mute hover:text-mw-fg" aria-disabled title={t("common.comingSoon")}>
          {t("chat.tabRules")}
        </button>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="mw-scroll flex-1 overflow-y-auto px-3.5 py-2.5">
        {messages.length === 0 && (
          <p className="py-6 text-center text-xs text-mw-fg-faint">
            {status === "closed" ? t("chat.connectionFailed") : t("chat.connecting")}
          </p>
        )}
        {messages.map((m) => (
          <ChatMessage key={m.id} m={m} />
        ))}
      </div>

      {paused && (
        <button
          type="button"
          onClick={() => {
            setPaused(false)
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }}
          className="mx-3.5 my-1 self-center rounded-md bg-mw-accent px-2.5 py-1.5 text-xs font-semibold text-mw-accent-on"
        >
          {t("chat.resume")}
        </button>
      )}

      {/* [deferred] sending needs a Twitch chat:edit OAuth token (§13) — read works native */}
      <div className="flex items-stretch gap-2 border-t border-mw-line px-3 py-2.5">
        <div className="flex flex-1 items-center rounded-mw-lg border border-mw-line bg-mw-800 pr-1.5 opacity-70">
          <input
            disabled
            placeholder={t("chat.placeholder")}
            className="flex-1 cursor-not-allowed bg-transparent px-3 py-2 text-[13px] text-mw-fg outline-none placeholder:text-mw-fg-faint"
          />
          <span className="inline-flex text-mw-fg-mute">
            <I.chat size={16} />
          </span>
        </div>
        <button type="button" disabled className="cursor-not-allowed rounded-mw-md bg-mw-700 px-3 text-xs font-semibold text-mw-fg-mute">
          {t("chat.send")}
        </button>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3.5 pb-3 pt-1.5 font-mono text-[11px] text-mw-fg-faint">
        <span>{t("chat.footer")}</span>
        <span>·</span>
        <span>{status === "open" ? t("chat.statusConnected") : status === "connecting" ? t("chat.statusConnecting") : t("chat.statusDisconnected")}</span>
      </div>
    </div>
  )
}
