"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Avatar, Button, Check, I, PillBtn, SectionHeader, StreamCard, Tag } from "@/components/smartrotom/media/ui"
import { useFormat } from "@boffmedia/ui/useFormat"
import { useFollowerCount, useStreamByUser, useTopStreams, useUser } from "../../_hooks/useTwitch"
import { compactCount, toStreamCard, twitchThumb, uptimeFrom } from "../../_utils/twitch"
import { StreamPlayer } from "./StreamPlayer"
import { ChatPanel } from "./ChatPanel"

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="relative overflow-hidden rounded-mw-xl border border-[color-mix(in_srgb,rgb(var(--mw-accent))_30%,var(--mw-hairline))] bg-[color-mix(in_srgb,rgb(var(--mw-accent))_8%,rgb(var(--mw-800)))] px-4 py-3.5 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[linear-gradient(to_bottom,rgb(var(--mw-accent)),transparent)] before:content-['']">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-mw-fg-faint">{label}</span>
      <strong className="mt-1 block font-mw-display text-[22px] font-bold tracking-[-0.01em]">{value}</strong>
      {sub && <em className="text-[11px] not-italic text-mw-fg-mute">{sub}</em>}
    </div>
  )
}

export function Live({ channel }: { channel: string }) {
  const t = useTranslations("twitch")
  const { time } = useFormat()
  const stream = useStreamByUser(channel)
  const user = useUser(channel)
  const followers = useFollowerCount(user.data?.id ?? "")
  const others = useTopStreams()
  const [following, setFollowing] = useState(false)

  const s = stream.data
  const u = user.data

  if (stream.isLoading || user.isLoading) {
    return <div className="p-6 text-sm text-mw-fg-faint">{t("stream.loading")}</div>
  }

  const name = u?.display_name ?? channel
  const startedAt = s?.started_at
  const startClock = startedAt
    ? time(startedAt, { hour: "2-digit", minute: "2-digit" })
    : undefined
  const otherStreams = (others.data ?? [])
    .filter((x) => x.user_login !== channel.toLowerCase())
    .slice(0, 4)
    .map(toStreamCard)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 px-4 pb-16 pt-5 md:px-8">
        <StreamPlayer channel={channel} viewers={s?.viewer_count} poster={twitchThumb(s?.thumbnail_url, 1280, 720)} />

        <div className="mt-5 flex flex-wrap justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar src={u?.profile_image_url} name={name} size={56} ring>
              {s && (
                <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-mw-pill border-2 border-mw-bg bg-mw-accent px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.08em] text-white">
                  <span className="h-1 w-1 rounded-full bg-white" /> {t("stream.liveBadge")}
                </span>
              )}
            </Avatar>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 font-mw-display text-lg font-bold">
                {name}
                {u?.broadcaster_type === "partner" && <Check />}
              </div>
              <h1 className="my-1.5 max-w-[740px] text-[15px] font-medium leading-[1.4] [text-wrap:pretty]">
                {s?.title ?? t("stream.offline")}
              </h1>
              {s && (
                <div className="inline-flex flex-wrap items-center gap-1.5 text-xs text-mw-fg-mute">
                  <span className="font-semibold text-mw-accent">{s.game_name}</span>
                  {s.tags?.slice(0, 3).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            {/* [deferred] follow/subscribe need Twitch OAuth (§13) */}
            <Button variant={following ? "ghost" : "solid"} onClick={() => setFollowing((f) => !f)}>
              <I.heart size={14} /> {following ? t("hero.following") : t("hero.follow")}
            </Button>
            <Button variant="ghost" aria-disabled title={t("common.comingSoon")}>
              <I.sparkles size={14} /> {t("stream.subscribe")}
            </Button>
            <PillBtn iconOnly aria-label={t("common.share")}>
              <I.share size={14} />
            </PillBtn>
          </div>
        </div>

        {s && (
          <div className="my-[18px] grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t("stream.statViewers")} value={compactCount(s.viewer_count)} sub={t("stream.statViewersSub")} />
            <Stat label={t("stream.statFollowers")} value={followers.data != null ? compactCount(followers.data) : "—"} sub={t("stream.statFollowersSub")} />
            <Stat label={t("stream.statTimeLabel")} value={uptimeFrom(startedAt)} sub={startClock ? t("stream.statTimeStarted", { time: startClock }) : undefined} />
            <Stat label={t("stream.statLangLabel")} value={(s.language ?? "").toUpperCase() || "—"} sub={t("stream.statLangSub")} />
          </div>
        )}

        {u?.description && (
          <div className="mb-6 rounded-mw-2xl border border-[color-mix(in_srgb,rgb(var(--mw-accent))_28%,var(--mw-hairline))] bg-[color-mix(in_srgb,rgb(var(--mw-accent))_6%,rgb(var(--mw-800)))] px-[22px] py-[18px]">
            <h3 className="mb-2 font-mw-display text-lg">{t("stream.about")}</h3>
            <p className="m-0 whitespace-pre-line text-sm leading-[1.6] text-mw-fg-mute">{u.description}</p>
          </div>
        )}

        {otherStreams.length > 0 && (
          <section>
            <SectionHeader title={t("stream.otherLive")} />
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
              {otherStreams.map((x) => (
                <StreamCard key={x.href} s={x} />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-0 lg:h-[calc(100dvh_-_7rem)] lg:self-start">
        <ChatPanel channel={channel} viewers={s?.viewer_count} />
      </aside>
    </div>
  )
}
