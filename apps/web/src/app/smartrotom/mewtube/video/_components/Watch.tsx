"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Avatar, Button, I, PillBtn, Toggle } from "@/components/smartrotom/media/ui"
import { useChannel, useComments, useRelated, useVideo } from "../../_hooks/useYoutube"
import { addToHistory } from "../../_services/historyService"
import { formatCount, relativeTime, toVideoCard, videoIdOf } from "../../_utils/youtube"
import { parseChapters } from "../../_utils/chapters"
import { NativePlayer, type NativePlayerHandle } from "./NativePlayer"
import { UpNext } from "./UpNext"
import { Comments } from "./Comments"

export function Watch({ id }: { id: string }) {
  const t = useTranslations("mewtube")
  const playerRef = useRef<NativePlayerHandle>(null)
  const video = useVideo(id)
  const v = video.data
  const channel = useChannel(v?.snippet.channelId ?? "")
  const related = useRelated(v?.snippet.title ?? "")
  const comments = useComments(id)

  useEffect(() => {
    if (v) addToHistory(v)
  }, [v])

  // Deferred (need Google OAuth): subscribe / like reflect local UI only
  const [subscribed, setSubscribed] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [autoplay, setAutoplay] = useState(true)

  if (video.isLoading) {
    return <div className="p-6 text-sm text-mw-fg-faint">{t("video.loadingVideo")}</div>
  }
  if (!v) {
    return <div className="p-6 text-sm text-mw-fg-faint">{t("video.notFound")}</div>
  }

  const chapters = parseChapters(v.snippet.description)
  const channelAvatar = channel.data?.snippet.thumbnails.default?.url
  const subs = channel.data?.statistics.subscriberCount
  const poster = v.snippet.thumbnails.high?.url ?? v.snippet.thumbnails.medium?.url
  const recos = (related.data ?? [])
    .filter((r) => videoIdOf(r) !== id)
    .map((r) => toVideoCard(r))
  const tags = (v.snippet as { tags?: string[] }).tags?.slice(0, 3) ?? []

  return (
    <div className="grid grid-cols-1 gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_340px] md:px-6">
      <div className="min-w-0">
        <NativePlayer ref={playerRef} videoId={id} poster={poster} title={v.snippet.title} chapters={chapters} />

        <h1 className="mb-3.5 mt-[18px] font-mw-display text-2xl font-extrabold leading-[1.25] tracking-[-0.01em] [text-wrap:balance]">
          {v.snippet.title}
        </h1>

        <div className="flex flex-wrap justify-between gap-4 border-b border-mw-line pb-[18px] pt-3.5">
          <div className="flex items-center gap-3">
            <Avatar src={channelAvatar} name={v.snippet.channelTitle} size={44} />
            <div>
              <div className="inline-flex items-center gap-1.5 text-[15px] font-semibold">
                {v.snippet.channelTitle}
              </div>
              {subs && <div className="text-xs text-mw-fg-mute">{t("video.subscribers", { count: formatCount(subs) })}</div>}
            </div>
            {/* [deferred] real subscribe needs Google OAuth */}
            <Button
              variant={subscribed ? "ghost" : "solid"}
              className="ml-2"
              onClick={() => setSubscribed((s) => !s)}
            >
              {subscribed ? t("video.subscribed") : t("video.subscribe")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center overflow-hidden rounded-mw-pill border border-[color-mix(in_srgb,rgb(var(--mw-accent))_30%,var(--mw-hairline))] bg-[color-mix(in_srgb,rgb(var(--mw-accent))_8%,rgb(var(--mw-800)))]">
              {/* [deferred] like/dislike need OAuth */}
              <PillBtn active={liked} onClick={() => setLiked((l) => !l)} className="!rounded-none !border-0 !bg-transparent">
                <I.thumbUp size={16} /> {v.statistics ? formatCount(v.statistics.likeCount) : ""}
              </PillBtn>
              <span className="h-5 w-px bg-mw-line" />
              <PillBtn iconOnly aria-label={t("video.dislike")} className="!rounded-none !border-0 !bg-transparent">
                <I.thumbUp size={16} className="rotate-180" />
              </PillBtn>
            </div>
            <PillBtn>
              <I.share size={16} /> {t("video.share")}
            </PillBtn>
            <PillBtn active={saved} onClick={() => setSaved((s) => !s)}>
              <I.save size={16} /> {saved ? t("video.saved") : t("video.save")}
            </PillBtn>
          </div>
        </div>

        <div className="mt-[18px] rounded-mw-2xl border border-[color-mix(in_srgb,rgb(var(--mw-accent))_28%,var(--mw-hairline))] bg-[color-mix(in_srgb,rgb(var(--mw-accent))_6%,rgb(var(--mw-800)))] px-5 py-[18px]">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-mw-fg-mute">
            {v.statistics && <strong className="font-semibold text-mw-fg">{t("video.views", { count: formatCount(v.statistics.viewCount) })}</strong>}
            <span>·</span>
            <span>{relativeTime(v.snippet.publishedAt)}</span>
            {tags.length > 0 && <span>·</span>}
            {tags.map((tag) => (
              <span key={tag} className="text-mw-accent">#{tag}</span>
            ))}
          </div>
          {v.snippet.description && (
            <p className="mt-3 whitespace-pre-line text-sm leading-[1.6] text-mw-fg-mute">{v.snippet.description}</p>
          )}

          {chapters.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-mw-fg-faint">
                <I.bookmark size={14} /> {t("video.chapters", { count: chapters.length })}
              </div>
              <div className="grid gap-1 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
                {chapters.map((c) => (
                  <button
                    key={c.seconds}
                    type="button"
                    onClick={() => playerRef.current?.seek(c.seconds)}
                    className="flex items-center gap-2.5 rounded-mw-lg px-2.5 py-2 text-left text-[13px] text-mw-fg-mute transition-colors hover:bg-mw-800 hover:text-mw-fg"
                  >
                    <span className="flex-none font-mono text-xs font-bold text-mw-accent">{c.time}</span>
                    <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Comments comments={comments.data ?? []} loading={comments.isLoading} />
      </div>

      <aside className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-mw-md border border-[color-mix(in_srgb,rgb(var(--mw-accent))_30%,var(--mw-hairline))] bg-[color-mix(in_srgb,rgb(var(--mw-accent))_8%,rgb(var(--mw-900)))] px-3.5 py-2 text-[13px]">
          <span>{t("video.autoplay")}</span>
          <Toggle checked={autoplay} onChange={setAutoplay} label={t("video.autoplay")} />
        </div>
        <UpNext videos={recos} loading={related.isLoading} />
      </aside>
    </div>
  )
}
