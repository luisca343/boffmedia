"use client"

import { useTranslations } from "next-intl"
import { useGame, useStreamsForGame } from "../../_hooks/useTwitch"
import { compactCount, toStreamCard, twitchThumb } from "../../_utils/twitch"
import { StreamSection } from "../../_components/StreamSection"

export function CategoryView({ id }: { id: string }) {
  const t = useTranslations("twitch")
  const game = useGame(id)
  const streams = useStreamsForGame(id)
  const g = game.data
  const list = (streams.data ?? []).map(toStreamCard)
  const totalViewers = (streams.data ?? []).reduce((a, s) => a + s.viewer_count, 0)

  return (
    <div className="mx-auto max-w-[102.5rem] px-4 pb-20 pt-6 md:px-10">
      {g && (
        <div className="mb-3 grid grid-cols-[6.25rem_1fr] items-center gap-7 border-b border-mw-line pb-7">
          <img src={twitchThumb(g.box_art_url, 200, 270)} alt="" className="w-[6.25rem] rounded-mw-lg" />
          <div>
            <div className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-mw-accent">{t("game.category")}</div>
            <h1 className="my-1.5 font-mw-display text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold tracking-[-0.01em]">{g.name}</h1>
            <div className="text-[0.8125rem] text-mw-fg-mute">
              <strong className="text-mw-fg">{compactCount(totalViewers)}</strong> {t("game.viewersSuffix")} · {list.length} {t("game.streamsSuffix")}
            </div>
          </div>
        </div>
      )}
      <StreamSection title={t("game.liveNow")} streams={list} loading={streams.isLoading} />
    </div>
  )
}
